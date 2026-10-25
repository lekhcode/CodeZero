"""Single table: interview tone -> mild TTS delivery tweaks (avoid over-modulation)."""

from __future__ import annotations

from dataclasses import dataclass

from codezero_interviewer.tts.provider import Tone


@dataclass(frozen=True, slots=True)
class ToneDelivery:
    rate_mult: float
    pitch_hz: int  # Edge uses Hz offset string like +2Hz
    volume_mult: float
    azure_style: str | None = None


# Keep deltas small — large swings sound fake.
TONE_TABLE: dict[Tone, ToneDelivery] = {
    "neutral": ToneDelivery(1.0, 0, 1.0, "general"),
    "encouraging": ToneDelivery(1.05, 2, 1.0, "friendly"),
    "curious": ToneDelivery(1.02, 3, 1.0, "cheerful"),
    "probing": ToneDelivery(0.95, -2, 1.0, "serious"),
    "reassuring": ToneDelivery(0.92, -1, 0.92, "empathetic"),
    "wrapping_up": ToneDelivery(0.97, 0, 0.95, "hopeful"),
}


def delivery_for(tone: Tone) -> ToneDelivery:
    return TONE_TABLE.get(tone, TONE_TABLE["neutral"])
