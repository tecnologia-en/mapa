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
        self.assertIn('host="127.0.0.1"',app)
        self.assertIn('"canControl": False',app)
        self.assertNotIn('@app.post(',app)

    def test_manual_start(self):
        bat=self.source("Iniciar Mapa.bat").lower()
        self.assertNotIn("schtasks",bat)
        self.assertNotIn("startup",bat)
        self.assertTrue((ROOT/"web/assets/three.module.js").is_file())
