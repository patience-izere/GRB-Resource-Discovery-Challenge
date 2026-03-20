import json
import faiss
import numpy as np
from pathlib import Path
from .embedder import encode

INDEX_DIR = Path(__file__).parent.parent / "indices"
INDEX_DIR.mkdir(exist_ok=True)


def build_index(name: str, texts: list[str], ids: list) -> None:
    """
    Encode texts, build an IndexFlatIP (inner product = cosine on
    normalised vectors), persist index + id map.
    """
    vectors = encode(texts)        # (N, 384) float32, already L2-normalised
    dim = vectors.shape[1]

    index = faiss.IndexFlatIP(dim) # Inner Product — cosine similarity on unit vectors
    index.add(vectors)

    faiss.write_index(index, str(INDEX_DIR / f"{name}.index"))

    with open(INDEX_DIR / f"{name}_map.json", "w") as f:
        json.dump(ids, f)          # position i → original DB id/pk


def load_index(name: str):
    index = faiss.read_index(str(INDEX_DIR / f"{name}.index"))
    with open(INDEX_DIR / f"{name}_map.json") as f:
        id_map = json.load(f)
    return index, id_map
