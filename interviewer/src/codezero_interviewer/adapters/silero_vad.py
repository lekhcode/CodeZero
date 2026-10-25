"""Silero VAD adapter stub — energy/null until onnxruntime + model are bundled."""

from __future__ import annotations

import logging

from codezero_interviewer.ports.vad import IVADPort, VadSpeechState

logger = logging.getLogger(__name__)


class SileroVadAdapter(IVADPort):
    """
    Intended path: load silero_vad.onnx via onnxruntime.
    Until then, treat frames as silence so FE energy VAD remains the live path.
    """

    def __init__(self, *, model_path: str | None = None) -> None:
        self.model_path = model_path
        self._loaded = False
        if model_path:
            logger.info(
                "Silero VAD model path set (%s) but ONNX runtime not wired yet",
                model_path,
            )

    def reset(self) -> None:
        return None

    def process(self, pcm16_le: bytes, sample_rate: int = 16000) -> VadSpeechState:
        _ = pcm16_le, sample_rate
        return VadSpeechState.SILENCE
