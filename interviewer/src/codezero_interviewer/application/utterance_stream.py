"""Incremental JSON utterance extraction + speakable sentence chunking.

Used while Ollama streams `format:json` so TTS can start before the full
decision object is complete — without sending broken words to speech.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field


_SENTENCE_END = re.compile(r"(?<=[.!?])(?:\s+|$)")
_UTTERANCE_KEY = re.compile(r'"utterance"\s*:\s*"')
_TONE_KEY = re.compile(
    r'"tone"\s*:\s*"(neutral|encouraging|curious|probing|reassuring|wrapping_up)"'
)


@dataclass
class SpeakableChunker:
    """Buffers text and emits complete speakable sentences."""

    # Prefer full clauses over tiny fragments (smoother TTS intonation).
    min_chars: int = 28
    max_chars: int = 200
    _buf: str = ""

    def push(self, text: str) -> list[str]:
        if not text:
            return []
        self._buf += text
        return self._drain(final=False)

    def flush(self) -> list[str]:
        return self._drain(final=True)

    def _drain(self, *, final: bool) -> list[str]:
        out: list[str] = []
        while True:
            m = _SENTENCE_END.search(self._buf)
            if not m:
                break
            end = m.start() + 1  # keep punctuation
            candidate = self._buf[:end].strip()
            rest = self._buf[m.end() :]
            # Skip tiny fragments unless flushing.
            if len(candidate) < self.min_chars and not final:
                break
            if candidate:
                out.append(candidate)
            self._buf = rest

        if final and self._buf.strip():
            out.append(self._buf.strip())
            self._buf = ""
        elif not final and len(self._buf) >= self.max_chars:
            cut = self._buf.rfind(" ")
            if cut >= self.min_chars:
                out.append(self._buf[:cut].strip())
                self._buf = self._buf[cut + 1 :]
        return [c for c in out if c]


@dataclass
class JsonUtteranceExtractor:
    """Pulls the string value of JSON key \"utterance\" from a streaming buffer."""

    _buf: str = ""
    _phase: str = "seek"  # seek | value | done
    _escape: bool = False
    _utterance: str = ""
    _tone: str = "neutral"
    _raw_all: str = ""
    chunker: SpeakableChunker = field(default_factory=SpeakableChunker)

    def push(self, delta: str) -> list[str]:
        if not delta:
            return []

        self._raw_all += delta
        self._maybe_tone(self._raw_all)
        if self._phase == "done":
            return []

        self._buf += delta
        chunks: list[str] = []

        if self._phase == "seek":
            m = _UTTERANCE_KEY.search(self._buf)
            if not m:
                # Cap seek buffer so we don't grow unbounded on malformed streams.
                if len(self._buf) > 8000:
                    self._buf = self._buf[-4000:]
                return []
            self._phase = "value"
            after = self._buf[m.end() :]
            self._buf = ""
            return self._consume_value(after)

        if self._phase == "value":
            return self._consume_value(delta)

        return chunks

    def _maybe_tone(self, text: str) -> None:
        m = _TONE_KEY.search(text)
        if m:
            self._tone = m.group(1)

    def _consume_value(self, text: str) -> list[str]:
        newly = ""
        i = 0
        while i < len(text):
            ch = text[i]
            if self._escape:
                mapping = {"n": "\n", "t": "\t", "r": "\r", '"': '"', "\\": "\\", "/": "/"}
                newly += mapping.get(ch, ch)
                self._escape = False
            elif ch == "\\":
                self._escape = True
            elif ch == '"':
                self._phase = "done"
                i += 1
                break
            else:
                newly += ch
            i += 1

        out: list[str] = []
        if newly:
            self._utterance += newly
            out.extend(self.chunker.push(newly))
        if self._phase == "done":
            out.extend(self.chunker.flush())
            # Keep remainder after closing quote for full JSON assembly.
            if i < len(text):
                self._buf += text[i:]
        return out

    def flush(self) -> list[str]:
        if self._phase == "value":
            return self.chunker.flush()
        return []

    @property
    def full_utterance(self) -> str:
        return self._utterance.strip()

    @property
    def tone(self) -> str:
        return self._tone
