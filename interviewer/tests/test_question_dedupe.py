from __future__ import annotations

from codezero_interviewer.application.question_dedupe import QuestionDeduper


def test_paraphrase_detected() -> None:
    d = QuestionDeduper()
    prior = ["What time complexity are you aiming for?"]
    assert d.is_near_duplicate(
        "Can you explain the time complexity of your approach?", prior
    )


def test_distinct_topics_allowed() -> None:
    d = QuestionDeduper()
    prior = ["What time complexity are you aiming for?"]
    assert not d.is_near_duplicate(
        "Which edge case would you check first for empty input?", prior
    )


def test_exact_repeat() -> None:
    d = QuestionDeduper()
    q = "How does a Hash Table-oriented approach fit the constraints here?"
    assert d.is_near_duplicate(q, [q])
