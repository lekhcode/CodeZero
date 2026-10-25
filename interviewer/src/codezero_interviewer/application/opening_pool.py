"""Varied opening templates — random per session, no immediate repeats."""

from __future__ import annotations

import random

from codezero_interviewer.application.context_store import SessionContext
from codezero_interviewer.domain.enums import InterviewMode


def pick_opening(ctx: SessionContext, mode: InterviewMode) -> tuple[str, str]:
    """Returns (objective, utterance)."""
    title = ctx.problem.title
    topic = ctx.problem.topics[0] if ctx.problem.topics else "the constraints"
    diff = ctx.problem.difficulty

    name = (ctx.candidate_first_name or "").strip()
    hello = f"{name}, " if name else ""

    if mode == InterviewMode.LEARNING:
        pool = [
            (
                "Confirm I/O understanding",
                f"{hello}let's start with {title}. In your own words, what's the input and what should we return?",
            ),
            (
                "Confirm I/O understanding",
                f"For {title}, how would you explain the problem to a teammate in one sentence?",
            ),
            (
                "Confirm I/O understanding",
                f"Quick warm-up on {title}: what does a correct answer look like?",
            ),
        ]
    else:
        pool = [
            (
                "Establish problem understanding",
                f"{hello}alright — {title}. What's the core requirement you're solving for?",
            ),
            (
                "Establish problem understanding",
                f"How are you thinking about {title} so far?",
            ),
            (
                f"Probe via {topic}",
                f"Looking at {title}, where might {str(topic).lower()} fit into your approach?",
            ),
            (
                "Establish problem understanding",
                f"{title} is {diff}. What constraint do you want to respect first?",
            ),
            (
                "Establish problem understanding",
                f"Before coding {title}, what's your first instinct for the approach?",
            ),
            (
                "Establish problem understanding",
                f"Okay, {title}. How are you reading the problem so far?",
            ),
            (
                "Establish problem understanding",
                f"Let's dig into {title}. What feels ambiguous, if anything?",
            ),
            (
                f"Probe via {topic}",
                f"For {title}, would you lean on {str(topic).lower()}, or something else?",
            ),
            (
                "Establish problem understanding",
                f"Start us off on {title}: what's the smallest example you'd reason about?",
            ),
            (
                "Establish problem understanding",
                f"Got {title} open. What are you optimizing for — clarity or asymptotic speed?",
            ),
        ]

    fresh = [p for p in pool if p[1] not in ctx.used_openers]
    choice = random.choice(fresh or pool)
    ctx.used_openers.append(choice[1])
    ctx.used_openers = ctx.used_openers[-12:]
    return choice
