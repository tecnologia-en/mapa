"""Mapa Control Center - backend local, leitura remota, FastAPI + WebSocket."""
from __future__ import annotations

import asyncio
import webbrowser
import json
import os
import threading
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import urlsplit
from urllib.request import Request, urlopen

import uvicorn
import yaml
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

ROOT = Path(__file__).resolve().parent.parent
WEB = ROOT / "web"
PORT = 47831
CFG = ROOT / "config" / "projects.yaml"
SECRETS = ROOT / "config.local.json"
CACHE_TTL = 5.0
_ALLOWED_STATES = {"active", "inactive", "unknown", "failed", "activating", "deactivating"}

app = FastAPI(title="Mapa Control Center", docs_url=None, redoc_url=None, openapi_url=None)
_lock = threading.Lock()
_cache: dict[str, Any] = {"at": 0.0, "data": None}


def projects() -> list[dict]:
    raw = yaml.safe_load(CFG.read_text(encoding="utf-8"))
    if not isinstance(raw, dict) or not isinstance(raw.get("rooms"), list):
        raise ValueError("Configuração sem a lista rooms")
    return raw["rooms"][:12]


def safe_pets(raw: object) -> list[dict]:
    """Allow only display fields: never forward agent identifiers or credentials."""
    if not isinstance(raw, list):
        return []
    pets = []
    seen = set()
    for item in raw[:35]:
        if not isinstance(item, dict):
            continue
        pet_id = str(item.get("id", ""))[:40]
        if not pet_id.startswith("pet-") or pet_id in seen:
            continue
        seen.add(pet_id)
        status = str(item.get("status", "unknown"))
        if status not in ("online", "offline", "unknown"):
            status = "unknown"
        pets.append({
            "id": pet_id,
            "name": str(item.get("name") or "Computador")[:45],
            "owner": str(item.get("owner") or "Sem loja")[:40],
            "status": status,
            "lastSeenAt": str(item["lastSeenAt"])[:64] if item.get("lastSeenAt") else None,
        })
    return pets[:30]


_last_known_pets: list[dict] = []


def remote_status() -> dict:
    """Remote side returns allowlisted service states, never credentials or process arguments."""
    try:
        config = json.loads(SECRETS.read_text(encoding="utf-8"))
        url = str(config.get("snapshot_url", ""))
        token = str(config.get("access_token", ""))
        parsed = urlsplit(url)
        if parsed.scheme != "https" or not parsed.hostname or not token or parsed.username or parsed.password:
            return {"connected": False, "error": "Conexão segura ainda não configurada"}
        req = Request(url, headers={
            "Authorization": "Bearer " + token,
            "Accept": "application/json",
            "User-Agent": "Enfoque-Mapa/0.1"
        })
        with urlopen(req, timeout=4.5) as response:
            raw = response.read(65_536)
        data = json.loads(raw)
        if data.get("ok") is not True or not isinstance(data.get("services"), dict):
            raise ValueError("Resposta incompleta")
        states = {}
        for key, item in data["services"].items():
            if not isinstance(key, str) or not isinstance(item, dict):
                continue
            state = str(item.get("state", "unknown"))
            states[key[:80]] = {
                "state": state if state in _ALLOWED_STATES else "unknown",
                "checkedAt": str(item.get("checkedAt", ""))[:64]
            }
        pets = safe_pets(data.get("devices", []))
        if data.get("devicesAvailable") is True:
            # Approved without active websocket/poll is disconnected from the
            # agent network (not proof that the hardware is powered off).
            for pet in pets:
                if pet["status"] == "unknown":
                    pet["status"] = "offline"
        return {"connected": True, "services": states,
                "checkedAt": str(data.get("checkedAt", ""))[:64],
                "petsAvailable": data.get("devicesAvailable") is True,
                "pets": pets}
    except (OSError, ValueError, KeyError, TypeError, json.JSONDecodeError):
        return {"connected": False, "error": "Servidor indisponível ou autenticação inválida"}


def snapshot_uncached() -> dict:
    rooms = json.loads(json.dumps(projects(), ensure_ascii=False))
    remote = remote_status()
    connected = bool(remote.get("connected"))
    global _last_known_pets
    summary = {"active": 0, "inactive": 0, "unknown": 0}
    if connected and remote.get("petsAvailable"):
        _last_known_pets = remote.get("pets", [])
        pets = _last_known_pets
    else:
        # Keep the known animals in view, but never show stale "online".
        pets = [{**item, "status": "unknown"} for item in _last_known_pets]

    for room in rooms:
        for person in room.get("people", []):
            check = str(person.get("check_id", ""))
            record = remote.get("services", {}).get(check) if connected else None
            st = record.get("state", "unknown") if isinstance(record, dict) else "unknown"
            person["status"] = st
            person["checkedAt"] = record.get("checkedAt") if record else None
            summary["active" if st == "active" else "inactive" if st in ("inactive", "failed") else "unknown"] += 1
            # Avoid returning arbitrary check configuration or secrets from YAML.
            person.pop("check", None)
    return {
        "version": "0.2.0", "mode": "read-only", "connected": connected,
        "checkedAt": remote.get("checkedAt") if connected else None,
        "connectionMessage": "VPS conectada, verificações reais" if connected else remote.get("error", "Sem conexão"),
        "summary": summary, "rooms": rooms,
        "pets": pets, "petsAvailable": connected and bool(remote.get("petsAvailable")),
        "petSummary": {
            "total": len(pets),
            "online": sum(p["status"] == "online" for p in pets),
            "offline": sum(p["status"] == "offline" for p in pets),
            "unknown": sum(p["status"] == "unknown" for p in pets),
        },
        "canControl": False
    }


def snapshot() -> dict:
    now = time.monotonic()
    with _lock:
        if _cache["data"] is not None and now - _cache["at"] < CACHE_TTL:
            return _cache["data"]
        result = snapshot_uncached()
        _cache.update(at=now, data=result)
        return result


@app.middleware("http")
async def security_headers(req, call_next):
    result = await call_next(req)
    result.headers["X-Content-Type-Options"] = "nosniff"
    result.headers["Referrer-Policy"] = "no-referrer"
    result.headers["Cache-Control"] = "no-store"
    result.headers["Content-Security-Policy"] = (
        "default-src 'self'; script-src 'self'; worker-src 'self'; style-src 'self'; "
        "img-src 'self' data: blob:; connect-src 'self' ws://127.0.0.1:47831 ws://localhost:47831; "
        "font-src 'self'; object-src 'none'; base-uri 'none'"
    )
    return result


@app.get("/api/state")
async def get_state():
    return await asyncio.to_thread(snapshot)


@app.get("/api/health")
async def health():
    return {"ok": True, "mode": "read-only", "version": "0.2.0"}


@app.websocket("/ws")
async def ws(websocket: WebSocket):
    origin = websocket.headers.get("origin", "")
    if origin and origin not in ("http://127.0.0.1:47831", "http://localhost:47831"):
        await websocket.close(code=1008)
        return
    await websocket.accept()
    try:
        while True:
            await websocket.send_json(await asyncio.to_thread(snapshot))
            await asyncio.sleep(8)
    except (WebSocketDisconnect, RuntimeError, OSError):
        pass


@app.on_event("startup")
async def open_client_after_start():
    # O .bat abre o navegador APENAS ao iniciar manualmente o programa.
    if os.environ.get("MAPA_OPEN_BROWSER", "1") != "0":
        asyncio.get_running_loop().call_later(1.0, lambda: webbrowser.open("http://127.0.0.1:47831/"))


app.mount("/assets", StaticFiles(directory=WEB / "assets"), name="assets")


@app.get("/")
async def home():
    return FileResponse(WEB / "index.html", media_type="text/html")


def main():
    print("\n" + "=" * 54)
    print("       ENFOQUE MAPA - CONTROL CENTER 3D")
    print("=" * 54)
    print("Interface local: http://127.0.0.1:47831")
    print("Conexao de leitura com a VPS. Nenhum comando sera enviado.")
    print("Para encerrar: feche a janela ou pressione Ctrl+C.\n")
    try:
        uvicorn.run(app, host="127.0.0.1", port=PORT, log_level="warning", access_log=False)
    except OSError as exc:
        print("Falha ao iniciar: ", exc)


if __name__ == "__main__":
    main()
