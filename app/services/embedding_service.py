import numpy as np
from typing import Optional
import logging

logger = logging.getLogger(__name__)


class EmbeddingService:
    """
    Singleton service managing local SentenceTransformers embedding generation
    and cosine similarity calculation for materials.
    """

    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        self.model_name = model_name
        self._model = None

    @property
    def model(self):
        if self._model is None:
            logger.info("Initializing SentenceTransformer model: %s", self.model_name)
            from sentence_transformers import SentenceTransformer
            self._model = SentenceTransformer(self.model_name)
        return self._model

    def compute_similarity(self, text_a: str, text_b: str) -> float:
        """
        Compute cosine similarity between two texts and return a score scaled to 0.0 – 100.0.
        """
        if not text_a or not text_b:
            return 0.0

        if text_a.strip().lower() == text_b.strip().lower():
            return 100.0

        embeddings = self.model.encode(
            [text_a, text_b],
            convert_to_numpy=True,
            normalize_embeddings=True,
        )

        # Dot product of L2-normalized vectors is cosine similarity
        cos_sim = float(np.dot(embeddings[0], embeddings[1]))
        
        # Clamp to [0.0, 1.0] and scale to 0 - 100
        normalized_score = max(0.0, min(1.0, cos_sim)) * 100.0
        return round(normalized_score, 2)


embedding_service = EmbeddingService()
