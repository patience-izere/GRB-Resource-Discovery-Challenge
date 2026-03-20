import json
from pathlib import Path
from .indexer import build_index, INDEX_DIR


def build_census_index(census_records: list[dict]) -> None:
    """
    census_records: list of dicts like:
      {"id": "kigali-gasabo-education", "province": "Kigali",
       "district": "Gasabo", "sector": "education",
       "text": "Girls NAR 94.2% Boys NAR 91.1% secondary attendance ..."}
    """
    texts = [r["text"] for r in census_records]
    ids   = [r["id"]   for r in census_records]
    build_index("census", texts, ids)

    # Persist full records for hydration (no Django model needed)
    map_path = INDEX_DIR / "census_records.json"
    with open(map_path, "w") as f:
        json.dump({r["id"]: r for r in census_records}, f)
