"""Testes de catálogo, segurança, andares e ocultação visual local."""
import unittest
from pathlib import Path

import yaml

ROOT=Path(__file__).resolve().parent.parent

class MapaTests(unittest.TestCase):
    def source(self,name):
        return (ROOT/name).read_text(encoding="utf-8")

    def test_rooms(self):
        rooms=yaml.safe_load(self.source("config/projects.yaml"))["rooms"]
        self.assertEqual(len(rooms),2)
        self.assertEqual(sum(len(x["people"]) for x in rooms),6)

    def test_all_intranet_pages(self):
        from backend.app import intranet_catalogue
        deps=intranet_catalogue()
        self.assertEqual(len(deps),8)
        self.assertEqual(sum(len(d["pages"]) for d in deps),60)
        for dep in deps:
            for pg in dep["pages"]:
                self.assertTrue(pg["path"].startswith("/"))
                self.assertTrue(pg["path"].endswith(".html"))

    def test_character_body_procedural(self):
        text=self.source("web/assets/character.js")
        self.assertNotIn("BoxGeometry(",text)
        for term in ("LatheGeometry","CapsuleGeometry","TubeGeometry"):
            self.assertIn(term,text)

    def test_shelf_and_floors(self):
        text=self.source("web/assets/world.js")
        for term in ("createIntranet(","createBookshelf(","setFloor(number)","goUpFloor()","goDownFloor()","enterShelf()","exitShelf()","makeStairs()"):
            self.assertIn(term,text)
        shelf=self.source("web/assets/bookshelf.js")
        self.assertIn('userData.computerId',shelf)
        self.assertIn('userData.storeId',shelf)
        self.assertIn('caption.visible=false',shelf)
        self.assertIn('this.view==="shelf"',text)

    def test_ui_collapsed_and_one_scroll(self):
        html=self.source("web/index.html")
        js=self.source("web/assets/main.js")
        css=self.source("web/assets/style.css")
        self.assertIn("left-collapsed right-collapsed",html)
        self.assertIn('data-floor="1"',html)
        self.assertIn('data-floor="2"',html)
        for key in ("ArrowUp","ArrowDown","localStorage","hiddenDetails"):
            self.assertIn(key,js+html)
        self.assertIn("overflow-y:auto",css)
        self.assertIn("scrollbar-color",css)
        self.assertNotIn('id="welcome"',html)
        self.assertIn('boot();',js)

    def test_hide_does_not_call_remote_write(self):
        text=self.source("web/assets/main.js")
        self.assertIn('window.localStorage.setItem',text)
        self.assertIn('state.world?.setHidden(state.hidden)',text)
        self.assertNotIn('fetch("/api/hide"',text)
        self.assertNotIn('fetch("/api/move"',text)
        self.assertIn('workstation.userData.seatId',self.source("web/assets/world.js"))

    def test_computer_sanitization(self):
        from backend.app import safe_computers
        devices=safe_computers([
          {"id":"pet-hashed123","name":"Caixa 3","owner":"Ilha Plaza","status":"online","secret":"FORBIDDEN"},
          {"id":"pet-hashed123","name":"Duplicado","owner":"Centro","status":"offline"},
          {"id":"raw-id","name":"Sem permissão","status":"online"}
        ])
        self.assertEqual(len(devices),1)
        self.assertEqual(devices[0]["owner"],"Ilha Plaza")
        self.assertNotIn("secret",devices[0])

    def test_read_only_local_server(self):
        app=self.source("backend/app.py")
        self.assertIn('uvicorn.run(app, host=BIND_HOST',app)
        self.assertIn('BIND_HOST = "127.0.0.1" if os.environ.get("MAPA_LOCAL_ONLY") == "1" else "0.0.0.0"',app)
        self.assertIn('"canControl": False',app)
        self.assertNotIn('@app.post(',app)

    def test_lan_only_http_and_websocket(self):
        from backend.app import is_lan_host, is_lan_peer
        for ip in ("127.0.0.1", "192.168.0.28", "10.1.2.3", "172.29.1.2"):
            self.assertTrue(is_lan_peer(ip))
            self.assertTrue(is_lan_host(ip + ":47831"))
        self.assertTrue(is_lan_host("localhost:47831"))
        for host in ("google.com:47831", "8.8.8.8:47831", "26.204.42.26:47831",
                     "example.test@192.168.0.9:47831", "192.168.0.9:8000",
                     "192.168.0.9:47831\\nInjected: test"):
            self.assertFalse(is_lan_host(host), host)
        for ip in ("8.8.8.8", "26.204.42.26", "example.org", "169.254.12.4"):
            self.assertFalse(is_lan_peer(ip), ip)
        source=self.source("backend/app.py")
        self.assertIn('origin != "http://" + host',source)
        self.assertIn('connect-src \'self\' ws://{host}',source)

    def test_launcher_avoids_duplicate_process(self):
        bat=self.source("Iniciar Mapa.bat")
        self.assertIn("if not errorlevel 1 goto porta_ocupada",bat)
        self.assertIn(":porta_ocupada",bat)

    def test_manual_start(self):
        bat=self.source("Iniciar Mapa.bat").lower()
        self.assertNotIn("schtasks",bat)
        self.assertNotIn("startup",bat)
        self.assertTrue((ROOT/"web/assets/three.module.js").is_file())
