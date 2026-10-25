from __future__ import annotations

from codezero_interviewer.tts.provider import normalize_tone
from codezero_interviewer.tts.tone_params import delivery_for


def test_normalize_unknown_tone() -> None:
    assert normalize_tone("nope") == "neutral"
    assert normalize_tone("probing") == "probing"


def test_delivery_table_covers_tones() -> None:
    for tone in (
        "neutral",
        "encouraging",
        "curious",
        "probing",
        "reassuring",
        "wrapping_up",
    ):
        d = delivery_for(tone)  # type: ignore[arg-type]
        assert 0.8 <= d.rate_mult <= 1.2
