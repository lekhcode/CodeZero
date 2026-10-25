from __future__ import annotations

import json
import logging
from collections.abc import AsyncIterator, Callable
from typing import Any

import httpx

from codezero_interviewer.ports.llm import ILLMPort, LLMRequest, LLMResponse

logger = logging.getLogger(__name__)


class OllamaLLMAdapter(ILLMPort):
    """Local Ollama chat adapter. `complete` stays blocking; `stream` yields deltas."""

    def __init__(
        self,
        *,
        model: str = "qwen3:4b-instruct",
        base_url: str = "http://127.0.0.1:11434",
        timeout_s: float = 120.0,
        num_ctx: int = 4096,
        is_cancelled: Callable[[str], bool] | None = None,
    ) -> None:
        self.model = model
        self.base_url = base_url.rstrip("/")
        self.timeout_s = timeout_s
        self.num_ctx = num_ctx
        self._is_cancelled = is_cancelled or (lambda _turn_id: False)

    def _payload(self, request: LLMRequest, *, stream: bool) -> dict[str, Any]:
        return {
            "model": self.model,
            "messages": [{"role": m.role, "content": m.content} for m in request.messages],
            "stream": stream,
            "format": "json",
            "options": {
                "temperature": request.temperature,
                "num_predict": request.max_tokens,
                "num_ctx": self.num_ctx,
            },
        }

    async def complete(self, request: LLMRequest) -> LLMResponse:
        if self._is_cancelled(request.turn_id):
            return LLMResponse(text="", turn_id=request.turn_id, cancelled=True)

        async with httpx.AsyncClient(timeout=self.timeout_s) as client:
            try:
                resp = await client.post(
                    f"{self.base_url}/api/chat",
                    json=self._payload(request, stream=False),
                )
                resp.raise_for_status()
            except httpx.HTTPError as exc:
                logger.exception("Ollama request failed")
                return LLMResponse(
                    text=(
                        '{"decision":"speak","speak":true,'
                        '"utterance":"I hit a local model error. '
                        'Please repeat your last point.",'
                        '"confidence":0.1,"rationale":"ollama_http_error",'
                        '"reveal_solution":false}'
                    ),
                    turn_id=request.turn_id,
                    raw={"error": str(exc)},
                )

        if self._is_cancelled(request.turn_id):
            return LLMResponse(text="", turn_id=request.turn_id, cancelled=True)

        data = resp.json()
        message = data.get("message") or {}
        text = str(message.get("content") or "")
        return LLMResponse(text=text, turn_id=request.turn_id, raw=data)

    async def stream(self, request: LLMRequest) -> AsyncIterator[str]:
        """Yield content token deltas from Ollama NDJSON stream."""
        if self._is_cancelled(request.turn_id):
            return

        async with httpx.AsyncClient(timeout=self.timeout_s) as client:
            try:
                async with client.stream(
                    "POST",
                    f"{self.base_url}/api/chat",
                    json=self._payload(request, stream=True),
                ) as resp:
                    resp.raise_for_status()
                    async for line in resp.aiter_lines():
                        if self._is_cancelled(request.turn_id):
                            return
                        if not line.strip():
                            continue
                        try:
                            data = json.loads(line)
                        except json.JSONDecodeError:
                            continue
                        message = data.get("message") or {}
                        content = message.get("content")
                        if content:
                            yield str(content)
                        if data.get("done"):
                            return
            except httpx.HTTPError:
                logger.exception("Ollama stream failed; falling back to complete()")
                full = await self.complete(request)
                if not full.cancelled and full.text:
                    yield full.text
