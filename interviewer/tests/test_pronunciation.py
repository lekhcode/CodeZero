from __future__ import annotations

from codezero_interviewer.application.pronunciation import default_lexicon, rewrite_for_speech
from codezero_interviewer.application.spoken_style import to_spoken_utterance


def test_hashmap_and_api_rewrites() -> None:
    default_lexicon.cache_clear()
    out = rewrite_for_speech("Use a hashmap over the HTTP API and SQL store.")
    assert "hash map" in out.lower()
    assert "A P I" in out
    assert "S Q L" in out


def test_complexity_notation() -> None:
    default_lexicon.cache_clear()
    out = rewrite_for_speech("Aim for O(n) time complexity, not O(n^2).")
    assert "order of n" in out.lower()
    assert "order of n squared" in out.lower()


def test_spoken_style_strips_praise_and_markdown() -> None:
    raw = "That's a great answer! Now, can you explain the **time complexity**?"
    out = to_spoken_utterance(raw)
    assert "great answer" not in out.lower()
    assert "**" not in out
    assert "time complexity" in out.lower()
