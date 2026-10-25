"""Semantic-ish near-duplicate detection for interviewer questions.

Uses normalized token Jaccard + containment — no paid embeddings.
"""

from __future__ import annotations

import re
from dataclasses import dataclass

_PUNCT = re.compile(r"[^\w\s]")
_SPACE = re.compile(r"\s+")

# Light stopword set so "what is your approach" ≈ "can you explain your approach"
_STOP = frozenset(
    {
        "a",
        "an",
        "the",
        "to",
        "of",
        "and",
        "or",
        "in",
        "on",
        "for",
        "is",
        "are",
        "be",
        "can",
        "you",
        "your",
        "me",
        "i",
        "we",
        "do",
        "does",
        "did",
        "what",
        "which",
        "how",
        "why",
        "would",
        "could",
        "please",
        "about",
        "this",
        "that",
        "with",
        "from",
        "into",
        "so",
        "as",
        "if",
        "any",
        "also",
        "just",
        "now",
        "then",
        "than",
        "tell",
        "walk",
        "through",
        "explain",
        "describe",
        "ask",
        "question",
    }
)

# Concept stems: map paraphrases of the same ask onto one key.
_CONCEPT_ALIASES: dict[str, str] = {
    "hashmap": "hash_map",
    "hashtable": "hash_map",
    "hash": "hash_map",
    "map": "hash_map",
    "dictionary": "hash_map",
    "bruteforce": "brute_force",
    "naive": "brute_force",
    "complexity": "complexity",
    "runtime": "complexity",
    "time": "complexity",
    "space": "space_complexity",
    "memory": "space_complexity",
    "edge": "edge_case",
    "corner": "edge_case",
    "constraint": "constraints",
    "constraints": "constraints",
    "approach": "approach",
    "algorithm": "approach",
    "solution": "approach",
    "understand": "problem_understanding",
    "understanding": "problem_understanding",
    "clarify": "clarification",
    "clarification": "clarification",
    "assumption": "assumption",
    "assumptions": "assumption",
    "test": "testing",
    "tests": "testing",
    "fail": "failure",
    "failed": "failure",
    "bug": "failure",
}

# Sharing one of these concept keys is enough to treat short questions as duplicates.
_ANCHOR_CONCEPTS = frozenset(
    {
        "complexity",
        "space_complexity",
        "edge_case",
        "problem_understanding",
        "clarification",
        "assumption",
        "hash_map",
        "brute_force",
    }
)


def normalize_question(text: str) -> str:
    t = text.lower().strip()
    t = _PUNCT.sub(" ", t)
    t = _SPACE.sub(" ", t)
    return t.strip()


def content_tokens(text: str) -> set[str]:
    norm = normalize_question(text)
    out: set[str] = set()
    for tok in norm.split():
        if tok in _STOP or len(tok) < 2:
            continue
        out.add(_CONCEPT_ALIASES.get(tok, tok))
    return out


@dataclass(frozen=True, slots=True)
class DedupeResult:
    is_duplicate: bool
    overlap: float
    matched: str | None = None


class QuestionDeduper:
    """Checks whether a new interviewer question was already asked/resolved."""

    def __init__(
        self,
        *,
        overlap_threshold: float = 0.62,
        min_tokens: int = 2,
    ) -> None:
        self.overlap_threshold = overlap_threshold
        self.min_tokens = min_tokens

    def is_near_duplicate(
        self,
        text: str,
        prior: list[str],
        *,
        require_question_mark: bool = True,
    ) -> bool:
        return self.check(text, prior, require_question_mark=require_question_mark).is_duplicate

    def check(
        self,
        text: str,
        prior: list[str],
        *,
        require_question_mark: bool = True,
    ) -> DedupeResult:
        if require_question_mark and "?" not in text:
            return DedupeResult(False, 0.0)
        tokens = content_tokens(text)
        if len(tokens) < self.min_tokens:
            return DedupeResult(False, 0.0)
        norm = normalize_question(text)
        best = 0.0
        matched: str | None = None
        for prev in prior[-16:]:
            prev_n = normalize_question(prev)
            prev_t = content_tokens(prev)
            if not prev_t:
                continue
            if norm == prev_n or norm in prev_n or prev_n in norm:
                return DedupeResult(True, 1.0, prev)
            shared = tokens & prev_t
            overlap = len(shared) / max(len(tokens | prev_t), 1)
            # Same concept cluster (e.g. both about complexity + approach)
            concept_hit = len(shared) >= max(2, self.min_tokens)
            if concept_hit and overlap >= self.overlap_threshold:
                return DedupeResult(True, overlap, prev)
            # Short probes of the same anchor topic (time complexity ≈ complexity ask)
            anchors = shared & _ANCHOR_CONCEPTS
            if anchors and overlap >= 0.28:
                return DedupeResult(True, max(overlap, 0.7), prev)
            if overlap > best:
                best = overlap
                matched = prev
        return DedupeResult(False, best, matched)
