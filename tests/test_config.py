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
