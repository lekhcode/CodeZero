"""Separate orchestration metadata from speakable interviewer lines."""

from __future__ import annotations

import re

_BOLD_ITALIC = re.compile(r"(\*\*|__|\*|_|`)")
_HEADING = re.compile(r"(?m)^\s{0,3}#{1,6}\s+")
_BULLET_LINE = re.compile(r"(?m)^\s*[-*•]\s+")
_NUMBERED = re.compile(r"(?m)^\s*\d+[.)]\s+")
_JSONISH = re.compile(r"[{}\[\]]")
_MULTI_SPACE = re.compile(r"\s{2,}")
_PRAISE_OPENERS = re.compile(
    r"^\s*(that's (a )?(great|excellent|perfect|awesome|good) (answer|point|approach|job)[!.,]?\s*"
    r"|great (job|answer|question|point)[!.,]?\s*"
    r"|excellent[!.,]?\s*"
    r"|absolutely[!.,]?\s*"
    r"|certainly[!.,]?\s*"
    r"|perfect[!.,]?\s*"
    r"|everything is correct[!.,]?\s*)",
    re.I,
)
_BANNED_PHRASES = re.compile(
    r"\b(as an AI|everything is correct and optimal|great job[!]?|excellent[!]?|"
    r"certainly|perfect[!]?|therefore|thus|hence|utilize|subsequently|"
    r"furthermore|moreover|kindly|please be advised|it is imperative|"
    r"I would like to|in conclusion|it's important to note|lets delve|let's delve)\b",
    re.I,
)
_HOWEVER = re.compile(r"\bhowever\b", re.I)
_IN_ORDER_TO = re.compile(r"\bin order to\b", re.I)
_FILLER_OPENERS = re.compile(
    r"^\s*(so,?\s+|well,?\s+|okay so,?\s+|alright so,?\s+|now,?\s+)",
    re.I,
)
_EM_DASH = re.compile(r"\s*[—–]\s*")


def to_spoken_utterance(text: str, *, max_chars: int = 420) -> str:
    """Sanitize model text into TTS-safe conversational speech."""
    if not text:
        return ""
    out = text.strip()
    # Drop accidental JSON / markdown scaffolding.
    if out.startswith("{") and "utterance" in out:
        return ""
    out = _BULLET_LINE.sub("", out)
    out = _NUMBERED.sub("", out)
    out = _HEADING.sub("", out)
    out = _BOLD_ITALIC.sub("", out)
    out = _JSONISH.sub("", out)
    out = out.replace('"', "")
    out = _EM_DASH.sub(". ", out)
    out = _PRAISE_OPENERS.sub("", out)
    out = _BANNED_PHRASES.sub("", out)
    out = _HOWEVER.sub("but", out)
    out = _IN_ORDER_TO.sub("to", out)
    out = _FILLER_OPENERS.sub("", out)
    out = _MULTI_SPACE.sub(" ", out).strip()
    # Prefer one or two sentences for TTS unless genuinely longer.
    if len(out) > max_chars:
        cut = out[:max_chars]
        stop = max(cut.rfind("."), cut.rfind("?"), cut.rfind("!"))
        out = cut[: stop + 1] if stop >= 40 else cut.rsplit(" ", 1)[0]
    return out.strip()
