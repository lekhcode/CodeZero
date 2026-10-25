"""Configurable interviewer voice identity — provider IDs stay out of business logic."""

from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Any


@dataclass(frozen=True, slots=True)
class VoiceProfile:
    """Provider-agnostic voice settings — warm Indian-English neural default."""

    assistant_name: str = "Kiran"
    locale: str = "en-IN"
    preferred_voice_names: tuple[str, ...] = (
        "en-IN-NeerjaNeural",
        "Microsoft Zira",
        "Zira",
        "Google US English",
        "Samantha",
        "Microsoft Aria",
    )
    preferred_langs: tuple[str, ...] = ("en-IN", "en-US", "en-GB", "en")
    rate: float = 1.0
    pitch: float = 1.0
    volume: float = 1.0
    voice_id: str | None = "en-IN-NeerjaNeural"
    engine: str = "edge"  # edge | browser | sapi
    use_pronunciation_lexicon: bool = True
    prefer_female: bool = True

    def to_public_dict(self) -> dict[str, Any]:
        d = asdict(self)
        d["preferred_voice_names"] = list(self.preferred_voice_names)
        d["preferred_langs"] = list(self.preferred_langs)
        return d


DEFAULT_VOICE_PROFILE = VoiceProfile()
