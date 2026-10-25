"""Benchmark local TTS + write pronunciation WAV samples.

Does NOT download neural models. Uses Windows SAPI (System.Speech) via PowerShell.

  codezero-interviewer-voice-bench
"""

from __future__ import annotations

import json
import statistics
import time
from pathlib import Path

from codezero_interviewer.adapters.sapi_tts import SapiTtsAdapter, wav_duration_s
from codezero_interviewer.application.pronunciation import default_lexicon, rewrite_for_speech
from codezero_interviewer.domain.voice_profile import VoiceProfile
from codezero_interviewer.infrastructure.config import InterviewerSettings


def main() -> None:
    settings = InterviewerSettings()
    out_dir = Path(settings.voice_samples_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    lexicon = default_lexicon()
    profile = VoiceProfile(
        assistant_name=settings.assistant_name,
        locale=settings.voice_locale,
        rate=settings.voice_rate,
        pitch=settings.voice_pitch,
        voice_id=settings.voice_id,
        engine="sapi",
    )
    tts = SapiTtsAdapter(profile)

    print("=== Local voice inventory (SAPI / System.Speech) ===")
    try:
        voices = tts.list_voices()
    except RuntimeError as exc:
        print(str(exc))
        return
    for v in voices:
        print(f"  - {v['name']}  ({v['id']})")
    en_in = [
        v
        for v in voices
        if "en-IN" in v.get("id", "")
        or "en_IN" in v.get("id", "")
        or "en-IN" in v.get("locale", "")
        or "India" in v.get("name", "")
    ]
    print(f"en-IN voices installed: {len(en_in)}")
    if not en_in:
        print(
            "NOTE: No Windows en-IN voice pack detected. Offline samples use installed "
            "en-US voices + pronunciation lexicon. Browser playback still prefers en-IN "
            "when Chrome/Edge exposes Google/Microsoft Indian English voices."
        )

    latencies: list[float] = []
    rows: list[dict] = []
    phrases = list(lexicon.evaluation_phrases)
    # Warm-up
    warm = out_dir / "_warmup.wav"
    tts.synthesize_to_wav("Warm up.", warm)

    for i, phrase in enumerate(phrases):
        spoken = rewrite_for_speech(phrase)
        path = out_dir / f"sample_{i:02d}.wav"
        t0 = time.perf_counter()
        synth_s = tts.synthesize_to_wav(phrase, path)
        wall = time.perf_counter() - t0
        dur = wav_duration_s(path) if path.exists() else 0.0
        latencies.append(synth_s)
        row = {
            "index": i,
            "phrase": phrase,
            "spoken": spoken,
            "wav": str(path),
            "synth_s": round(synth_s, 3),
            "wall_s": round(wall, 3),
            "audio_duration_s": round(dur, 3),
            "rtf": round(synth_s / dur, 3) if dur > 0 else None,
        }
        rows.append(row)
        print(
            f"[{i:02d}] synth={synth_s:.3f}s audio={dur:.3f}s | {phrase!r} -> {spoken!r}"
        )

    report = {
        "engine": "sapi/System.Speech",
        "assistant": profile.assistant_name,
        "locale_target": profile.locale,
        "voice_id": profile.voice_id,
        "voices_available": voices,
        "en_in_voices": en_in,
        "samples_dir": str(out_dir),
        "p50_synth_s": round(statistics.median(latencies), 3) if latencies else None,
        "p95_synth_s": round(sorted(latencies)[max(0, int(0.95 * (len(latencies) - 1)))], 3)
        if latencies
        else None,
        "mean_synth_s": round(statistics.mean(latencies), 3) if latencies else None,
        "samples": rows,
        "limitations": [
            "No Piper/en-IN neural model downloaded (keeps ₹0 + avoids silent large downloads).",
            "Offline SAPI on this machine may be en-US only; lexicon improves technical terms.",
            "Live interview uses browser TTS for streaming + barge-in; SAPI is for samples/preview.",
        ],
    }
    report_path = out_dir / "benchmark_report.json"
    report_path.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(f"\nReport: {report_path}")
    print(
        f"synth latency p50={report['p50_synth_s']}s p95={report['p95_synth_s']}s "
        f"mean={report['mean_synth_s']}s"
    )


if __name__ == "__main__":
    main()
