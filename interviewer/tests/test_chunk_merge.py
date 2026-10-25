from __future__ import annotations

from codezero_interviewer.tts.chunk_merge import merge_speakable_chunks, word_count


def test_word_count() -> None:
    assert word_count("hello world") == 2


def test_first_sentence_unmerged() -> None:
    sents = [
        "What is your approach so far?",
        "Walk me through the hash map idea briefly.",
        "Which step dominates?",
    ]
    out = merge_speakable_chunks(sents, min_words=8, max_words=25)
    assert out[0] == sents[0]
    assert len(out) >= 2


def test_does_not_merge_into_question() -> None:
    out = merge_speakable_chunks(
        ["Ready?", "Let's talk complexity next."],
        min_words=8,
        first_unmerged=False,
    )
    assert out[0] == "Ready?"
