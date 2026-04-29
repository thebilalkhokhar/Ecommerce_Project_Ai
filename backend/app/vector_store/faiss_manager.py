import json
from pathlib import Path
from typing import Any

import faiss
import numpy as np
from sentence_transformers import SentenceTransformer

_EMBED_DIM = 384
_DEFAULT_MODEL = "sentence-transformers/all-MiniLM-L6-v2"


class FAISSManager:
    """In-memory FAISS index with FAISS id → PostgreSQL product id persisted to disk."""

    def __init__(
        self,
        *,
        index_path: Path | None = None,
        mapping_path: Path | None = None,
        model_name: str = _DEFAULT_MODEL,
    ) -> None:
        self._model_name = model_name
        self._encoder: SentenceTransformer | None = None

        backend_root = Path(__file__).resolve().parents[2]
        data_dir = backend_root / "data" / "faiss"
        data_dir.mkdir(parents=True, exist_ok=True)

        self._index_path = index_path or (data_dir / "products.index")
        self._mapping_path = mapping_path or (data_dir / "id_map.json")

        self._index: faiss.IndexFlatL2
        self._faiss_id_to_product_id: dict[int, int] = {}
        self._load_or_create()

    @property
    def encoder(self) -> SentenceTransformer:
        if self._encoder is None:
            self._encoder = SentenceTransformer(self._model_name)
        return self._encoder

    def _load_or_create(self) -> None:
        if self._index_path.exists():
            self._index = faiss.read_index(str(self._index_path))
        else:
            self._index = faiss.IndexFlatL2(_EMBED_DIM)

        if self._mapping_path.exists():
            raw: dict[str, Any] = json.loads(
                self._mapping_path.read_text(encoding="utf-8"),
            )
            self._faiss_id_to_product_id = {
                int(k): int(v) for k, v in raw.items()
            }

    def _persist(self) -> None:
        faiss.write_index(self._index, str(self._index_path))
        self._mapping_path.write_text(
            json.dumps(
                {str(k): v for k, v in self._faiss_id_to_product_id.items()},
            ),
            encoding="utf-8",
        )

    def _embed(self, text: str) -> np.ndarray:
        vector = self.encoder.encode(
            text,
            convert_to_numpy=True,
            normalize_embeddings=False,
        )
        if vector.ndim == 1:
            vector = vector.reshape(1, -1)
        return vector.astype(np.float32, copy=False)

    def add_product_vector(self, product_id: int, text: str) -> None:
        row = self._embed(text)
        if row.shape[1] != _EMBED_DIM:
            raise ValueError(
                f"Embedding dimension {row.shape[1]} does not match index ({_EMBED_DIM})",
            )
        next_id = int(self._index.ntotal)
        self._index.add(row)
        self._faiss_id_to_product_id[next_id] = product_id
        self._persist()

    def search_similar(
        self,
        query_text: str,
        top_k: int,
    ) -> list[tuple[int, float]]:
        if self._index.ntotal == 0:
            return []
        q = self._embed(query_text)
        k = min(max(top_k, 1), int(self._index.ntotal))
        distances, indices = self._index.search(q, k)
        results: list[tuple[int, float]] = []
        for dist, idx in zip(distances[0].tolist(), indices[0].tolist()):
            if idx < 0:
                continue
            product_id = self._faiss_id_to_product_id.get(int(idx))
            if product_id is None:
                continue
            results.append((product_id, float(dist)))
        return results


_manager: FAISSManager | None = None


def get_faiss_manager() -> FAISSManager:
    global _manager
    if _manager is None:
        _manager = FAISSManager()
    return _manager
