"""Validação de YAML, representação procedural e modo seguro."""
from pathlib import Path
import unittest
import yaml

ROOT = Path(__file__).resolve().parent.parent

class MapaConfigTests(unittest.TestCase):
    def test_rooms_and_people(self):
        data = yaml.safe_load((ROOT / "config/projects.yaml").read_text(encoding="utf-8"))
        self.assertEqual(len(data["rooms"]), 2)
        self.assertEqual(sum(len(r["people"]) for r in data["rooms"]), 6)
        self.assertTrue(all(p.get("check_id") for r in data["rooms"] for p in r["people"]))

    def test_no_character_boxes(self):
        js = (ROOT / "web/assets/character.js").read_text(encoding="utf-8")
        self.assertNotIn("BoxGeometry(", js)
        for required in ("LatheGeometry", "CapsuleGeometry", "ExtrudeGeometry", "TubeGeometry"):
            self.assertIn(required, js)

    def test_automatic_scene_and_team_focus(self):
        html = (ROOT / "web/index.html").read_text(encoding="utf-8")
        js = (ROOT / "web/assets/main.js").read_text(encoding="utf-8")
        world = (ROOT / "web/assets/world.js").read_text(encoding="utf-8")
        self.assertNotIn('id="welcome"', html)
        self.assertIn('id="sidebarToggle"', html)
        self.assertIn('id="focusTeamBtn"', html)
        self.assertIn("boot();", js)
        self.assertIn("isolateRoom(id)", world)

    def test_pets_are_procedural(self):
        source = (ROOT / "web/assets/pet.js").read_text(encoding="utf-8")
        self.assertNotIn("BoxGeometry(", source)
        self.assertIn("CapsuleGeometry", source)
        self.assertIn("TubeGeometry", source)
        self.assertIn("offline", source)

    def test_pet_sanitization(self):
        from backend.app import safe_pets
        pets = safe_pets([
            {"id": "pet-abc123", "owner": "Ilha Plaza", "name": "Salão", "status": "online", "token": "SECRET"},
            {"id": "pet-abc123", "owner": "Centro", "name": "Duplicado", "status": "offline"},
            {"id": "raw-device-id", "status": "online"},
        ])
        self.assertEqual(len(pets), 1)
        self.assertEqual(pets[0]["status"], "online")
        self.assertEqual(pets[0]["owner"], "Ilha Plaza")
        self.assertNotIn("token", pets[0])

    def test_local_only(self):
        py = (ROOT / "backend/app.py").read_text(encoding="utf-8")
        self.assertIn('host="127.0.0.1"', py)

    def test_no_autostart(self):
        bat = (ROOT / "Iniciar Mapa.bat").read_text(encoding="utf-8").lower()
        self.assertNotIn("schtasks", bat)
        self.assertNotIn("startup", bat)
        self.assertTrue((ROOT / "web/assets/three.module.js").is_file())

if __name__ == "__main__":
    unittest.main()
