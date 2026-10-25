from __future__ import annotations

from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class InterviewerSettings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="CODEZERO_INTERVIEWER_",
        env_file=".env",
        extra="ignore",
    )

    ollama_base_url: str = "http://127.0.0.1:11434"
    ollama_model: str = "qwen3:4b-instruct"
    ollama_num_ctx: int = 4096
    ollama_timeout_s: float = 120.0
    default_mode: str = "standard"
    # Local JSON snapshots so reconnect / process restart keeps the same session.
    session_store_dir: str = str(
        Path.home() / ".codezero" / "interviewer" / "sessions"
    )
    session_persist: bool = True
    # Voice identity (Kiran) — Edge neural TTS default; browser fallback on FE.
    assistant_name: str = "Kiran"
    voice_locale: str = "en-IN"
    voice_engine: str = "edge"  # edge | browser | sapi
    voice_id: str | None = "en-IN-NeerjaNeural"
    voice_rate: float = 1.0
    voice_pitch: float = 1.0
    voice_samples_dir: str = str(
        Path.home() / ".codezero" / "interviewer" / "voice_samples"
    )
    tts_cache_dir: str = str(Path.home() / ".codezero" / "interviewer" / "tts_cache")
    tts_timeout_s: float = 4.0
    tts_provider: str = "edge"
