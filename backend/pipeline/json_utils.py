"""
Utilities for turning model text into stable JSON strings.
"""

from __future__ import annotations

import json
from typing import Any


def compact_json(data: Any) -> str:
    """Return consistently formatted JSON for storage and UI rendering."""
    return json.dumps(data, indent=2, ensure_ascii=False)


def extract_json_payload(raw_text: str) -> Any:
    """
    Parse a model response as JSON, accepting common wrappers such as
    markdown code fences or explanatory text around the object.
    """
    text = (raw_text or "").strip()
    if not text:
        raise ValueError("AI provider returned an empty response")

    if text.startswith("```"):
        lines = text.splitlines()
        if lines and lines[0].lstrip().startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip().startswith("```"):
            lines = lines[:-1]
        text = "\n".join(lines).strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    candidate = _find_balanced_json(text)
    if candidate is None:
        raise ValueError("AI provider response did not contain a JSON object")

    return json.loads(candidate)


def require_keys(payload: Any, required_keys: list[str], stage_name: str) -> dict[str, Any]:
    """Validate that a stage returned a JSON object with the expected keys."""
    if not isinstance(payload, dict):
        raise ValueError(f"{stage_name} must return a JSON object")

    missing = [key for key in required_keys if key not in payload]
    if missing:
        raise ValueError(f"{stage_name} response is missing keys: {', '.join(missing)}")

    return payload


def error_payload(stage_name: str, message: str) -> str:
    """Structured error output for failed stages."""
    return compact_json({
        "summary": f"{stage_name.title()} failed",
        "error": message,
        "status": "failed",
    })


def _find_balanced_json(text: str) -> str | None:
    """Find the first balanced JSON object or array in a larger text blob."""
    starts = [idx for idx in (text.find("{"), text.find("[")) if idx != -1]
    if not starts:
        return None

    start = min(starts)
    opening = text[start]
    closing = "}" if opening == "{" else "]"
    depth = 0
    in_string = False
    escaped = False

    for index in range(start, len(text)):
        char = text[index]

        if in_string:
            if escaped:
                escaped = False
            elif char == "\\":
                escaped = True
            elif char == '"':
                in_string = False
            continue

        if char == '"':
            in_string = True
        elif char == opening:
            depth += 1
        elif char == closing:
            depth -= 1
            if depth == 0:
                return text[start:index + 1]

    return None
