from __future__ import annotations

import argparse
import asyncio
import uuid

from codezero_interviewer.domain.entities import ProblemContext
from codezero_interviewer.domain.events import InterviewEvent, InterviewEventType
from codezero_interviewer.infrastructure.factory import build_orchestrator


SAMPLE_PROBLEM = ProblemContext(
    slug="rectangle-area",
    title="Rectangle Area",
    difficulty="MEDIUM",
    statement=(
        "Given the coordinates of two rectilinear rectangles in a 2D plane, "
        "return the total area covered by the two rectangles."
    ),
    constraints="Coordinates are integers within a reasonable range.",
    examples=[
        {
            "input": "ax1=-3, ay1=0, ax2=3, ay2=4, bx1=0, by1=-1, bx2=9, by2=2",
            "output": "45",
        }
    ],
    topics=["Math", "Geometry"],
)


async def _run(text: str) -> None:
    orch = build_orchestrator()
    session_id = str(uuid.uuid4())
    orch.open_session(session_id, SAMPLE_PROBLEM)

    started = await orch.handle(
        InterviewEvent(type=InterviewEventType.INTERVIEW_STARTED, session_id=session_id)
    )
    print("--- after interview.started ---")
    if started:
        print(f"state={started.state.value} ui={started.ui_state.value}")
        print(f"interviewer: {started.utterance}")

    answered = await orch.handle(
        InterviewEvent(
            type=InterviewEventType.CANDIDATE_TURN_FINALIZED,
            session_id=session_id,
            payload={"text": text},
        )
    )
    print("--- after candidate turn ---")
    if answered:
        print(f"state={answered.state.value} ui={answered.ui_state.value}")
        print(f"decision={answered.decision.decision.value}")
        print(f"interviewer: {answered.utterance}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Text smoke test for CodeZero interviewer")
    parser.add_argument(
        "--say",
        default=(
            "We have two rectangles given by bottom-left and top-right corners. "
            "I would compute each area and subtract the overlap."
        ),
        help="Candidate utterance",
    )
    args = parser.parse_args()
    asyncio.run(_run(args.say))


if __name__ == "__main__":
    main()
