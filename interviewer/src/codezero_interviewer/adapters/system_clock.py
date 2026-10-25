from __future__ import annotations

from datetime import datetime, timezone

from codezero_interviewer.ports.clock import IClock


class SystemClock(IClock):
    def now(self) -> datetime:
        return datetime.now(timezone.utc)
