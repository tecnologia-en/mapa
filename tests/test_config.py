"""Mapa v0.5 — teste da lista simples, status confiável e acesso local."""
import shutil
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path

import yaml

ROOT=Path(__file__).resolve().parent.parent


class MapaTests(unittest.TestCase):
    def source(self,path):
        return (ROOT/path).read_text(encoding="utf-8")

    def test_two_rooms_only(self):
        rooms=yaml.safe_load(self.source("config/projects.yaml"))["rooms"]
        self.assertEqual(len(rooms),2)
        self.assertEqual(sum(len(r["people"]) for r in rooms),6)
        self.assertFalse((ROOT/"web/assets/intranet.js").exists())

    def test_poster_replaces_bookshelf(self):
        poster=self.source("web/assets/poster.js")
        world=self.source("web/assets/world.js")
        self.assertIn("createComputerPoster",world)
        self.assertIn("shelfTarget",poster)
        self.assertIn("COMPUTADORES",poster)
        self.assertIn("CLIQUE PARA VER",poster)
        self.assertIn("this.scene.attach(this.shelf.root)",world)
        self.assertIn('this.group.visible=this.view!=="shelf"',world)
        self.assertFalse((ROOT/"web/assets/bookshelf.js").exists())
        self.assertFalse((ROOT/"web/assets/shelf_rules.mjs").exists())

    def test_html_computer_list_three_columns(self):
        html=self.source("web/index.html")
        js=self.source("web/assets/main.js")
        css=self.source("web/assets/style.css")
        for term in ('id="computerPanel"','id="computerRows"', 'Empresa / loja',
                     'Computador</th>', 'Status</th>', 'computer-table-scroll'):
            self.assertIn(term,html)
        self.assertIn("function renderComputerList()",js)
        self.assertIn('state.listSignature===signature',js)
        self.assertIn("scrollArea.scrollTop=previousScroll",js)
        list_fn=js[js.index("function renderComputerList()"):js.index("function updateFloorUI()")]
        self.assertLess(list_fn.index("if(state.listSignature===signature)return;"),
                        list_fn.index("root.replaceChildren();"),
                        "O cache nao pode limpar as linhas em cada heartbeat")
        self.assertIn("window.localStorage.setItem",js)
        self.assertIn("computer-badge",css)
        self.assertIn("scrollbar-color",css)
        self.assertIn("left-collapsed right-collapsed",html)

    def test_agent_status_is_grounded_in_freshness(self):
        from backend.app import normalized_agent_status, ONLINE_FRESHNESS
        now=datetime(2026,11,9,19,0,tzinfo=timezone.utc)
        stamp=lambda diff: (now-diff).isoformat()
        self.assertEqual(normalized_agent_status("online",stamp(timedelta(seconds=60)),now=now),"online")
        self.assertEqual(normalized_agent_status("online",stamp(ONLINE_FRESHNESS+timedelta(seconds=1)),now=now),"unknown")
        self.assertEqual(normalized_agent_status("online",None,now=now),"unknown")
        self.assertEqual(normalized_agent_status("online","not a time",now=now),"unknown")
        self.assertEqual(normalized_agent_status("unknown",None,now=now),"unknown")
        self.assertEqual(normalized_agent_status("offline",stamp(timedelta(days=1)),now=now),"offline")
        self.assertEqual(normalized_agent_status("error",None,now=now),"unknown")

    def test_sanitization(self):
        from backend.app import safe_computers
        fresh=datetime.now(timezone.utc).isoformat()
        items=[
          {"id":"pet-abc","name":"Extra","owner":"Extra","status":"online","lastSeenAt":fresh,"token":"SECRET"},
          {"id":"pet-abc","name":"Duplicate","owner":"Ilha Plaza","status":"offline"},
          {"id":"pet-unknown","name":"Sem sinal","owner":"Centro","status":"unknown"},
          {"id":"raw-real-device-id","name":"Should not appear","status":"online"}
        ]
        result=safe_computers(items)
        self.assertEqual(len(result),2)
        self.assertEqual(result[0]["status"],"online")
        self.assertEqual(result[1]["status"],"unknown")
        self.assertNotIn("token",result[0])
        self.assertIn('Nunca converter "sem sinal" em "offline"',self.source("backend/app.py"))

    def test_private_lan_only(self):
        from backend.app import is_lan_peer,is_lan_host
        self.assertTrue(is_lan_peer("192.168.0.9"))
        self.assertTrue(is_lan_host("192.168.0.9:47831"))
        self.assertTrue(is_lan_host("localhost:47831"))
        self.assertFalse(is_lan_peer("8.8.8.8"))
        self.assertFalse(is_lan_host("external.example.com:47831"))
        backend=self.source("backend/app.py")
        self.assertIn('uvicorn.run(app, host=BIND_HOST',backend)
        self.assertIn('origin != "http://" + host',backend)
        self.assertIn('"canControl": False',backend)
        self.assertNotIn("@app.post(",backend)

    def test_hide_is_local(self):
        js=self.source("web/assets/main.js")
        self.assertIn("state.world?.setHidden(state.hidden)",js)
        self.assertIn("renderComputerList()",js)
        self.assertNotIn('fetch("/api/move"',js)
        self.assertIn("workstation.userData.seatId",self.source("web/assets/world.js"))

    def test_manual_launch(self):
        bat=self.source("Iniciar Mapa.bat").lower()
        self.assertIn(":porta_ocupada",bat)
        self.assertNotIn("schtasks",bat)
        self.assertTrue((ROOT/"web/assets/three.module.js").is_file())

if __name__=="__main__":
    unittest.main()
