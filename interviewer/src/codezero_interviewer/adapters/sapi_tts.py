"""Local Windows SAPI TTS — offline, ₹0, no GPU.

Uses System.Speech via PowerShell (reliable on Windows servers/CI).
pyttsx3 is optional and not required for samples.
Live interview playback stays on the browser path for barge-in latency.
"""

from __future__ import annotations

import asyncio
import logging
import subprocess
import tempfile
import time
import wave
from collections.abc import AsyncIterator
from pathlib import Path

from codezero_interviewer.application.pronunciation import rewrite_for_speech
from codezero_interviewer.domain.voice_profile import VoiceProfile
from codezero_interviewer.ports.tts import ITTSPort

logger = logging.getLogger(__name__)


_PS_SYNTH = r"""
param([string]$Text, [string]$OutPath, [double]$Rate = 0, [string]$VoiceHint = "")
Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
if ($VoiceHint) {
  $match = $synth.GetInstalledVoices() | Where-Object {
    $_.VoiceInfo.Name -like "*$VoiceHint*" -or $_.VoiceInfo.Culture.Name -like "*$VoiceHint*"
  } | Select-Object -First 1
  if ($match) { $synth.SelectVoice($match.VoiceInfo.Name) }
}
# Rate: -10..10 ; map profile 0.7..1.2 -> approx -3..2
$synth.Rate = [int][Math]::Max(-10, [Math]::Min(10, $Rate))
$synth.SetOutputToWaveFile($OutPath)
$synth.Speak($Text)
$synth.Dispose()
"""


class SapiTtsAdapter(ITTSPort):
    def __init__(self, profile: VoiceProfile | None = None) -> None:
        self._profile = profile or VoiceProfile(engine="sapi")
        self._cancelled: set[str] = set()

    def list_voices(self) -> list[dict[str, str]]:
        ps = (
            "Add-Type -AssemblyName System.Speech; "
            "$s=New-Object System.Speech.Synthesis.SpeechSynthesizer; "
            "$s.GetInstalledVoices() | ForEach-Object { "
            "$_.VoiceInfo.Name + '|' + $_.VoiceInfo.Culture.Name + '|' + $_.VoiceInfo.Gender "
            "}"
        )
        try:
            raw = subprocess.check_output(
                ["powershell", "-NoProfile", "-Command", ps],
                text=True,
                timeout=30,
            )
        except (subprocess.SubprocessError, OSError) as exc:
            logger.warning("Could not list SAPI voices: %s", exc)
            return []
        out: list[dict[str, str]] = []
        for line in raw.splitlines():
            line = line.strip()
            if not line or "|" not in line:
                continue
            name, culture, gender = (line.split("|", 2) + ["", ""])[:3]
            out.append({"id": name, "name": name, "locale": culture, "gender": gender})
        return out

    def _rate_for_sapi(self) -> int:
        # profile.rate 1.0 ≈ SAPI 0; 0.94 ≈ slightly slower
        return int(round((self._profile.rate - 1.0) * 10))

    def _voice_hint(self) -> str:
        if self._profile.voice_id:
            return self._profile.voice_id
        for hint in self._profile.preferred_voice_names:
            return hint
        return ""

    def synthesize_to_wav(self, text: str, path: str | Path) -> float:
        spoken = (
            rewrite_for_speech(text)
            if self._profile.use_pronunciation_lexicon
            else text.strip()
        )
        path = Path(path)
        path.parent.mkdir(parents=True, exist_ok=True)
        t0 = time.perf_counter()
        script = tempfile.NamedTemporaryFile(
            "w", suffix=".ps1", delete=False, encoding="utf-8"
        )
        try:
            script.write(_PS_SYNTH)
            script.close()
            subprocess.run(
                [
                    "powershell",
                    "-NoProfile",
                    "-ExecutionPolicy",
                    "Bypass",
                    "-File",
                    script.name,
                    "-Text",
                    spoken,
                    "-OutPath",
                    str(path),
                    "-Rate",
                    str(self._rate_for_sapi()),
                    "-VoiceHint",
                    self._voice_hint(),
                ],
                check=True,
                timeout=60,
                capture_output=True,
            )
        finally:
            try:
                Path(script.name).unlink(missing_ok=True)
            except OSError:
                pass
        return time.perf_counter() - t0

    async def synthesize(self, text: str, turn_id: str) -> AsyncIterator[bytes]:
        if turn_id in self._cancelled:
            return
        spoken = (
            rewrite_for_speech(text)
            if self._profile.use_pronunciation_lexicon
            else text.strip()
        )
        if not spoken:
            return

        def _render() -> bytes:
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
                tmp_path = Path(tmp.name)
            try:
                self.synthesize_to_wav(spoken, tmp_path)
                return tmp_path.read_bytes()
            finally:
                try:
                    tmp_path.unlink(missing_ok=True)
                except OSError:
                    pass

        data = await asyncio.to_thread(_render)
        if turn_id in self._cancelled:
            return
        yield data

    async def cancel(self, turn_id: str) -> None:
        self._cancelled.add(turn_id)


def wav_duration_s(path: Path) -> float:
    with wave.open(str(path), "rb") as wf:
        return wf.getnframes() / float(wf.getframerate())
