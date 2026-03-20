import numpy as np
from .embedder import encode
from .indexer import load_index

_cache: dict = {}


def _get(name: str):
    if name not in _cache:
        _cache[name] = load_index(name)   # raises RuntimeError if file missing
    return _cache[name]


def search(query: str, sources: list[str], top_k: int = 10) -> list[dict]:
    """
    Returns a ranked list of {source, id, score} dicts across all requested sources.
    Scores are cosine similarities in [0, 1].
    """
    query_vec = encode([query])          # (1, 384)
    results = []

    for name in sources:
        try:
            index, id_map = _get(name)
        except (FileNotFoundError, RuntimeError):
            # Index file not built yet for this source — skip silently
            continue
        k = min(top_k, index.ntotal)
        if k == 0:
            continue
        scores, positions = index.search(query_vec, k)  # (1, k)
        for score, pos in zip(scores[0], positions[0]):
            if pos == -1:
                continue
            results.append({
                "source": name,
                "id": id_map[pos],
                "score": float(score),
            })

    results.sort(key=lambda r: r["score"], reverse=True)
    return results[:top_k]


def invalidate_cache(name: str = None) -> None:
    """Clear cached indices. Pass name to clear a specific one, or None to clear all."""
    if name:
        _cache.pop(name, None)
    else:
        _cache.clear()
