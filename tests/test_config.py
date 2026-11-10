"""Mapa v0.4 — validações de um único andar, estante e segurança LAN."""
import shutil
import subprocess
import unittest
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent.parent


class MapaTests(unittest.TestCase):
    def content(self,path):
        return (ROOT/path).read_text(encoding="utf-8")

    def test_rooms_real(self):
        rooms=yaml.safe_load(self.content("config/projects.yaml"))["rooms"]
        self.assertEqual(len(rooms),2)
        self.assertEqual(sum(len(room["people"]) for room in rooms),6)

    def test_single_floor_no_intranet(self):
        world=self.content("web/assets/world.js")
        html=self.content("web/index.html")
        backend=self.content("backend/app.py")
        self.assertNotIn("createIntranet",world)
        self.assertNotIn("makeStairs()",world)
        self.assertNotIn("setFloor(",world)
        self.assertNotIn('data-floor="2"',html)
        self.assertNotIn("intranet_catalogue",backend)
        self.assertNotIn('"intranet":',backend)
        self.assertFalse((ROOT/"web/assets/intranet.js").exists())
        self.assertFalse((ROOT/"config/intranet_pages.yaml").exists())

    def test_front_shelf_is_independent(self):
        world=self.content("web/assets/world.js")
        self.assertIn("this.scene.attach(this.shelf.root)",world)
        self.assertIn('this.group.visible=this.view!=="shelf"',world)
        self.assertIn("os.attach(this.shelf.root)",world)
        self.assertIn("this.shelf.root.scale.setScalar(.57)",world)
        self.assertIn('const targets=this.view==="shelf"?',world)

    def test_shelf_structure_and_hover(self):
        shelf=self.content("web/assets/bookshelf.js")
        self.assertIn("VISIBLE_ROWS",shelf)
        self.assertIn("planShelves(devices,hidden)",shelf)
        self.assertIn("book.rotation.z=bookLean(",shelf)
        self.assertIn("label.visible=false",shelf)
        self.assertIn("rows.slice",self.content("web/assets/shelf_rules.mjs"))
        self.assertIn('userData.computerId',shelf)

    @unittest.skipUnless(shutil.which("node"),"Node.js não disponível")
    def test_javascript_rules(self):
        proc=subprocess.run(
            ["node",str(ROOT/"tests/shelf_rules.test.mjs")],
            cwd=ROOT,capture_output=True,text=True,timeout=20
        )
        self.assertEqual(proc.returncode,0,proc.stdout+"\n"+proc.stderr)
        self.assertIn("SHELF_RULES_OK",proc.stdout)

    def test_character_procedural(self):
        js=self.content("web/assets/character.js")
        self.assertNotIn("BoxGeometry(",js)
        self.assertIn("LatheGeometry",js)
        self.assertIn("CapsuleGeometry",js)

    def test_hidden_local_only(self):
        js=self.content("web/assets/main.js")
        html=self.content("web/index.html")
        self.assertIn("window.localStorage.setItem",js)
        self.assertIn("state.world?.setHidden(state.hidden)",js)
        self.assertIn("hiddenDetails",html)
        self.assertIn("left-collapsed right-collapsed",html)
        self.assertIn("shelfQuick",html)
        self.assertNotIn('fetch("/api/move"',js)

    def test_sanitized_computers(self):
        from backend.app import safe_computers
        result=safe_computers([
            {"id":"pet-hash01","name":"Caixa","owner":"Centro","status":"offline","token":"SECRET"},
            {"id":"pet-hash01","name":"Dup","owner":"Icaraí","status":"online"},
            {"id":"raw-real-identifier","name":"Unsafe","status":"online"}
        ])
        self.assertEqual(len(result),1)
        self.assertEqual(result[0]["status"],"offline")
        self.assertEqual(result[0]["owner"],"Centro")
        self.assertNotIn("token",result[0])

    def test_lan_only(self):
        from backend.app import is_lan_peer,is_lan_host
        self.assertTrue(is_lan_peer("192.168.0.9"))
        self.assertTrue(is_lan_host("192.168.0.9:47831"))
        self.assertTrue(is_lan_host("localhost:47831"))
        self.assertFalse(is_lan_peer("8.8.8.8"))
        self.assertFalse(is_lan_host("example.com:47831"))
        backend=self.content("backend/app.py")
        self.assertIn('uvicorn.run(app, host=BIND_HOST',backend)
        self.assertIn('origin != "http://" + host',backend)
        self.assertIn('"canControl": False',backend)
        self.assertNotIn("@app.post(",backend)

    def test_manual_launch(self):
        bat=self.content("Iniciar Mapa.bat").lower()
        self.assertNotIn("schtasks",bat)
        self.assertNotIn("startup",bat)
        self.assertIn(":porta_ocupada",bat)
        self.assertTrue((ROOT/"web/assets/three.module.js").is_file())


if __name__ == "__main__":
    unittest.main()
