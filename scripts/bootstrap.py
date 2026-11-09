"""Baixa somente a biblioteca Three.js, sem modelos/assets externos, na primeira execução."""
from pathlib import Path
from urllib.request import urlopen, Request

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "web" / "assets" / "three.module.js"
URLS = (
    "https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js",
    "https://unpkg.com/three@0.160.1/build/three.module.js",
)
def main():
    OUT.parent.mkdir(parents=True, exist_ok=True)
    if OUT.exists() and OUT.stat().st_size > 200_000:
        print("Three.js já existe.")
        return
    for url in URLS:
        try:
            with urlopen(Request(url, headers={"User-Agent": "Mapa-ControlCenter/0.1"}), timeout=28) as response:
                contents = response.read(2_600_000)
            if len(contents) < 200_000 or b"WebGLRenderer" not in contents:
                raise ValueError("Arquivo inesperado")
            partial = OUT.with_suffix(".js.part")
            partial.write_bytes(contents)
            partial.replace(OUT)
            print("Motor 3D obtido (cache local).")
            return
        except Exception as ex:
            print("Falhou este mirror:", type(ex).__name__)
    raise SystemExit("Sem conexão para baixar Three.js. Confira a internet e execute novamente.")
if __name__ == "__main__":
    main()
