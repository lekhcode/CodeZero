"""Merge short speakable sentences into ~1–2 sentence chunks for smoother TTS."""

from __future__ import annotations

import re

_WORD = re.compile(r"\S+")


def word_count(text: str) -> int:
    return len(_WORD.findall(text))


def merge_speakable_chunks(
    sentences: list[str],
    *,
    min_words: int = 8,
    max_words: int = 25,
    first_unmerged: bool = True,
) -> list[str]:
    """
    Merge consecutive short sentences.
    If first_unmerged=True, emit the first complete sentence immediately (latency).
    Never merge a following sentence into a chunk that already ends with '?'.
    """
    cleaned = [s.strip() for s in sentences if s and s.strip()]
    if not cleaned:
        return []

    out: list[str] = []
    if first_unmerged:
        out.append(cleaned[0])
        rest = cleaned[1:]
    else:
        rest = cleaned

    buf = ""
    for sent in rest:
        if not buf:
            buf = sent
            continue
        if buf.rstrip().endswith("?"):
            out.append(buf)
            buf = sent
            continue
        combined_words = word_count(buf) + word_count(sent)
        if word_count(buf) < min_words and combined_words <= max_words:
            buf = f"{buf} {sent}"
        else:
            out.append(buf)
            buf = sent
    if buf:
        out.append(buf)
    return out
