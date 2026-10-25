"""Unit tests for incremental utterance extraction and sentence chunking."""

from __future__ import annotations

from codezero_interviewer.application.utterance_stream import (
    JsonUtteranceExtractor,
    SpeakableChunker,
)


def test_speakable_chunker_emits_on_sentence_boundary() -> None:
    c = SpeakableChunker(min_chars=8, max_chars=80)
    assert c.push("Hello there. ") == ["Hello there."]
    assert c.push("More text without end") == []
    assert c.flush() == ["More text without end"]


def test_speakable_chunker_holds_short_fragments() -> None:
    c = SpeakableChunker(min_chars=16, max_chars=80)
    assert c.push("Hi. ") == []
    assert c.flush() == ["Hi."]


def test_json_extractor_streams_sentences_before_closing_quote() -> None:
    ex = JsonUtteranceExtractor()
    assert ex.push('{"decision":"speak","utterance":"') == []
    chunks: list[str] = []
    chunks.extend(ex.push("What is your approach so far? "))
    chunks.extend(ex.push("Walk me through the complexity of that idea."))
    chunks.extend(ex.push('"}\n'))
    spoken = " ".join(chunks)
    assert "approach" in spoken.lower() or "complexity" in spoken.lower()
    assert "approach" in ex.full_utterance.lower()


def test_json_extractor_handles_escaped_quotes() -> None:
    ex = JsonUtteranceExtractor()
    parts = ex.push('{"utterance":"Say \\"hashmap\\" clearly."}')
    assert any("hashmap" in p for p in parts)
    assert "hashmap" in ex.full_utterance


def test_json_extractor_reads_tone_before_utterance() -> None:
    ex = JsonUtteranceExtractor()
    chunks: list[str] = []
    chunks.extend(ex.push('{"decision":"speak","speak":true,"tone":"curious","utterance":"'))
    assert ex.tone == "curious"
    chunks.extend(ex.push('Why that structure? "}'))
    assert "structure" in " ".join(chunks).lower() or "structure" in ex.full_utterance.lower()
    assert ex.tone == "curious"


def test_json_extractor_ignores_non_utterance_keys() -> None:
    ex = JsonUtteranceExtractor()
    assert ex.push('{"rationale":"internal only. Never speak.","confidence":0.9,') == []
    chunks = ex.push('"utterance":"Ask about edge cases for empty input."}')
    assert any("edge" in c.lower() for c in chunks)
    assert "Never speak" not in ex.full_utterance
