# Interviewer voice pipeline (Kiran)

Production path for in-app AI interviewer speech. UI, judge, and sandbox are unchanged.

## Architecture

```
Mic (browser)
  → Web Speech STT (FE) + energy VAD / optional Silero hook
  → semantic EOT (connector-aware silence)
  → Express POST /sessions/:id/events/stream
  → Python FastAPI orchestrator + Ollama
  → SSE speak_chunk { text, tone }
  → FE AudioTtsQueue → Express POST /tts → Edge TTS (en-IN-NeerjaNeural)
  → HTMLAudioElement playback (browser speechSynthesis fallback)
```

## Phases

| Phase | What shipped |
|-------|----------------|
| 1 | Edge TTS + disk cache, `POST /tts`, `AudioTtsQueue`, voiceProfile v3 (`ttsEngine: neural`) |
| 2 | `tone` on decisions + SSE; FE/BE delivery multipliers |
| 3 | Spoken prompt, opening pool, lexicon, anti-repeat |
| 4 | Backchannel clips while thinking; `first_audio_ms` metric |
| 5 | Energy VAD + Silero adapter stub; semantic EOT; echo barge-in guards |
| 6 | STT port stub (`BrowserSttAdapter` / `sttPort.ts`); this doc + unit tests |

## Key endpoints

- Python `:8100` — `POST /tts`, `POST /sessions/.../events/stream`, `GET /voice/profile`
- Express — `POST /api/v1/interviewer/tts` (auth), stream proxy (auth)

## Fallback

If Edge TTS times out (504) or fails, `AudioTtsQueue` falls back to `speechSynthesis` for that chunk.

## Config

- `CODEZERO_INTERVIEWER_TTS_PROVIDER=edge`
- `CODEZERO_INTERVIEWER_VOICE_ID=en-IN-NeerjaNeural`
- FE localStorage `codezero.interviewer.voiceProfile.v3`

## Latency targets

- First speakable SSE chunk as soon as utterance streams
- First audio: neural prefetch + play; log `first_audio_ms` in the console
