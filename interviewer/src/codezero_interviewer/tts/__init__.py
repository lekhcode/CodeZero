"""Neural / pluggable TTS for the interviewer (Edge primary, browser fallback on FE)."""

from codezero_interviewer.tts.provider import TtsRequest, TtsResult, TtsProvider
from codezero_interviewer.tts.service import TtsService

__all__ = ["TtsRequest", "TtsResult", "TtsProvider", "TtsService"]
