#!/usr/bin/env python3
"""Enfoque Mapa VPS: API somente leitura; apenas estados systemd allowlisted."""
from __future__ import annotations
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from datetime import datetime, timezone
from pathlib import Path
import hmac
import json
import subprocess
from urllib.request import Request, urlopen
import time

TOKEN_FILE=Path("/opt/enfoque-control-center3d/private/read-token")
HOST="127.0.0.1"
PORT=43277
SERVICES={
  "enfoque-os-remote":"enfoque-os-remote.service",
  "enfoque-agent-api":"enfoque-agent-api.service",
  "enfoque-os-oidc":"enfoque-os-oidc.service",
  "nginx":"nginx.service",
  "chatgpt-mcp":"chatgpt-mcp.service",
  "enfoque-vpn-monitor":"enfoque-vpn-monitor.service",
}
_cache={"at":0.0,"data":None}

def state(name):
    try:
        p=subprocess.run(["/bin/systemctl","is-active",name],capture_output=True,text=True,timeout=1.3,check=False)
        s=p.stdout.strip().lower()
        return s if s in ("active","inactive","failed","activating","deactivating") else "unknown"
    except (OSError, subprocess.TimeoutExpired):
        return "unknown"

def snapshot():
    now=time.monotonic()
    if _cache["data"] is not None and now-_cache["at"]<5:
        return _cache["data"]
    stamp=datetime.now(timezone.utc).isoformat()
    services={key:{"state":state(value),"checkedAt":stamp} for key,value in SERVICES.items()}
    # MAPA_PET_READ_V02: one tiny localhost request reuses existing MCP sockets;
    # never contacts PCs and never returns device credentials or raw hostnames.
    device_status_available = False
    devices = []
    try:
        token = TOKEN_FILE.read_text(encoding="utf-8").strip()
        req = Request("http://127.0.0.1:3211/internal/mapa-devices",
                      headers={"Authorization":"Bearer "+token})
        with urlopen(req, timeout=2.5) as response:
            report=json.loads(response.read(50_000))
        if report.get("ok") is True and isinstance(report.get("devices"),list):
            device_status_available = True
            for dev in report["devices"][:30]:
                if not isinstance(dev,dict):continue
                devices.append({
                   "id":str(dev.get("id", ""))[:40],
                   "name":str(dev.get("name", "Computador"))[:45],
                   "owner":str(dev.get("owner", "Sem loja"))[:40],
                   "status":dev.get("status") if dev.get("status") in ("online","offline","unknown") else "unknown",
                   "lastSeenAt":dev.get("lastSeenAt") if isinstance(dev.get("lastSeenAt"),str) else None,
                })
    except Exception:
        pass
    data={"ok":True,"version":"0.2.0","mode":"read-only","checkedAt":stamp,"services":services,
          "devicesAvailable":device_status_available,"devices":devices}
    _cache.update(at=now,data=data)
    return data

class Handler(BaseHTTPRequestHandler):
    server_version="Enfoque3D/0.1"
    def log_message(self,*args):
        return
    def respond(self,code,data):
        body=json.dumps(data,separators=(",",":"),ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type","application/json; charset=utf-8")
        self.send_header("Cache-Control","no-store")
        self.send_header("X-Content-Type-Options","nosniff")
        self.send_header("Content-Length",str(len(body)))
        self.end_headers()
        self.wfile.write(body)
    def do_GET(self):
        if self.path=="/health":
            return self.respond(200,{"ok":True,"service":"Mapa read-only"})
        if self.path!="/api/snapshot":
            return self.respond(404,{"ok":False})
        try:
            token=TOKEN_FILE.read_text(encoding="utf-8").strip()
        except OSError:
            return self.respond(503,{"ok":False})
        auth=self.headers.get("Authorization","")
        if not hmac.compare_digest(auth.encode("utf-8"),("Bearer "+token).encode("utf-8")):
            return self.respond(401,{"ok":False})
        return self.respond(200,snapshot())
    def do_POST(self):return self.respond(405,{"ok":False})
    def do_PUT(self):return self.respond(405,{"ok":False})
    def do_DELETE(self):return self.respond(405,{"ok":False})

if __name__=="__main__":
    ThreadingHTTPServer((HOST,PORT),Handler).serve_forever(poll_interval=.4)
