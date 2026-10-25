"""Pronunciation lexicon for Indian English interview TTS (₹0, no cloud)."""

from __future__ import annotations

import json
import re
from dataclasses import dataclass
from functools import lru_cache
from importlib import resources
from pathlib import Path


@dataclass(frozen=True, slots=True)
class LexiconRule:
    pattern: re.Pattern[str]
    say: str


@dataclass(frozen=True, slots=True)
class PronunciationLexicon:
    locale: str
    assistant_name: str
    rules: tuple[LexiconRule, ...]
    evaluation_phrases: tuple[str, ...]

    def rewrite(self, text: str) -> str:
        out = text
        for rule in self.rules:
            out = rule.pattern.sub(rule.say, out)
        # Mild pacing: keep clause breaks speakable without robotic gaps.
        out = re.sub(r"\s*[—–]\s*", ". ", out)
        out = re.sub(r"\s{2,}", " ", out)
        return out.strip()


def _load_from_path(path: Path) -> PronunciationLexicon:
    data = json.loads(path.read_text(encoding="utf-8"))
    rules: list[LexiconRule] = []
    for item in data.get("replacements") or []:
        flags = re.IGNORECASE if "i" in str(item.get("flags", "")) else 0
        rules.append(
            LexiconRule(
                pattern=re.compile(str(item["pattern"]), flags),
                say=str(item["say"]),
            )
        )
    return PronunciationLexicon(
        locale=str(data.get("locale", "en-IN")),
        assistant_name=str(data.get("assistant_name", "Kiran")),
        rules=tuple(rules),
        evaluation_phrases=tuple(str(p) for p in (data.get("evaluation_phrases") or [])),
    )


@lru_cache(maxsize=1)
def default_lexicon() -> PronunciationLexicon:
    # Prefer packaged data next to repo; fall back to wheel-less path.
    candidates = [
        Path(__file__).resolve().parents[3] / "data" / "pronunciation_lexicon.json",
        Path(__file__).resolve().parents[2] / "data" / "pronunciation_lexicon.json",
    ]
    for path in candidates:
        if path.is_file():
            return _load_from_path(path)
    # Minimal embedded fallback if data file is missing.
    return PronunciationLexicon(
        locale="en-IN",
        assistant_name="Kiran",
        rules=(
            LexiconRule(re.compile(r"\bhashmaps?\b", re.I), "hash map"),
            LexiconRule(re.compile(r"\bAPIs?\b", re.I), "A P I"),
            LexiconRule(re.compile(r"\bSQL\b"), "S Q L"),
        ),
        evaluation_phrases=("algorithm", "hashmap", "API, HTTP, SQL"),
    )


def rewrite_for_speech(text: str) -> str:
    return default_lexicon().rewrite(text)
