#!/usr/bin/env python3
"""
Hubble - Gemini-backed clinical coder for NAMASTE <-> ICD-11.

Turns a free-text clinical note (English, Hindi, or any Indian language) into
dual-coded output: a NAMASTE code plus its ICD-11 TM2 and Biomedicine codes.

The model is given a real system prompt via Gemini's `system_instruction`
field - not a "pretend you are..." line glued onto the user turn. The two roles
stay separate: the system prompt carries the rules and the reference catalogue,
the user turn carries only the doctor's note.

Anti-hallucination: the model may only *rank* NAMASTE codes. Every code it
returns is re-resolved against the CSV catalogue, and anything not found there
is dropped before output. A fabricated code can never reach the caller.

Usage
-----
    python hubble_ai.py "patient has fever and dry cough for three days"
    python hubble_ai.py --dry-run "..."      # show the prompts, make no API call
    python hubble_ai.py --serve 8791         # run as a local proxy for the web UI

Zero third-party dependencies - standard library only.
"""

from __future__ import annotations

import csv
import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

# --------------------------------------------------------------------------
# Config
# --------------------------------------------------------------------------

# Prefer the environment variable. The inline key is a demo fallback only -
# rotate it after the hackathon and delete this literal before publishing.
API_KEY = os.environ.get(
    "GEMINI_API_KEY",
    "GEMINI_API_KEY_HERE",
)

MODEL = os.environ.get("GEMINI_MODEL", "gemini-flash-lite-latest")
ENDPOINT = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent"

DATA_DIR = Path(__file__).parent / "Images"
TIMEOUT_SECONDS = 45


# --------------------------------------------------------------------------
# Catalogue - the single source of truth for every code we emit
# --------------------------------------------------------------------------

def load_catalogue() -> dict:
    """Join the three CSVs into {namaste_code: {...}}."""
    terms, mappings, icd_titles = {}, {}, {}

    with open(DATA_DIR / "namaste_100_dataset.csv", encoding="utf-8-sig") as fh:
        for row in csv.DictReader(fh):
            terms[row["NAMASTE_Code"]] = row

    with open(DATA_DIR / "namaste_icd11_100_mapping.csv", encoding="utf-8-sig") as fh:
        for row in csv.DictReader(fh):
            mappings[row["NAMASTE_Code"]] = row

    with open(DATA_DIR / "icd11_100_dataset.csv", encoding="utf-8-sig") as fh:
        for row in csv.DictReader(fh):
            icd_titles[row["ICD11_Code"]] = row["Title"]

    catalogue = {}
    for code, term in terms.items():
        mapping = mappings.get(code, {})
        tm2 = mapping.get("ICD11_TM2_Code", "")
        bio = mapping.get("ICD11_Biomedicine_Code", "")
        catalogue[code] = {
            "namaste_code": code,
            "traditional_term": term["Traditional_Term"],
            "english_translation": term["English_Translation"],
            "medical_system": term["Medical_System"],
            "category": term["Category"],
            "tm2_code": tm2,
            "tm2_title": icd_titles.get(tm2, ""),
            "icd_code": bio,
            "icd_title": icd_titles.get(bio, ""),
            "mapping_type": mapping.get("Mapping_Type", ""),
            "dataset_confidence": float(mapping.get("Confidence_Score") or 0),
        }
    return catalogue


def format_catalogue(catalogue: dict) -> str:
    """One compact line per code - this is what the model may pick from."""
    return "\n".join(
        f"{e['namaste_code']} | {e['traditional_term']} | {e['english_translation']} "
        f"| {e['medical_system']} | {e['category']} | TM2:{e['tm2_code']} "
        f"| ICD11:{e['icd_code']} {e['icd_title']}"
        for e in catalogue.values()
    )


# --------------------------------------------------------------------------
# The system prompt
# --------------------------------------------------------------------------

SYSTEM_PROMPT_TEMPLATE = """\
You are Hubble, a clinical terminology coder for India's dual-coding system, \
which pairs AYUSH traditional medicine (NAMASTE) with WHO ICD-11.

YOUR TASK
Given a doctor's free-text note, identify each distinct codable clinical
condition and match it to the single best NAMASTE code from the catalogue below.

THE NOTE MAY BE IN ANY LANGUAGE
English, Hindi, Tamil, Telugu, Kannada, Malayalam, Bengali, Gujarati, Punjabi,
or transliterated Sanskrit/Ayurvedic terminology. Detect the language yourself;
never assume English. Traditional terms (Jwara, Kasa, Prameha, Amlapitta ...)
often appear inline in an otherwise English note - treat them as clinical terms,
not as words to translate away.

HARD RULES
1. Use ONLY namaste_code values that appear verbatim in the CATALOGUE. Never
   invent, guess, extrapolate, or reformat a code. If no catalogue entry fits a
   condition, omit that condition entirely rather than forcing a near match.
2. One code per distinct condition. Do not emit the same code twice.
3. `confidence` reflects how well the wording maps onto the catalogue entry -
   not how common the disease is. Use the full 0.0-1.0 range honestly: an exact
   term match is around 0.95, a broad symptomatic inference around 0.5.
4. `surface` must quote the exact substring of the note that triggered the
   match, copied verbatim in the note's original script.
5. `reason` is one short clinical sentence in English, 18 words maximum.
6. You are a coding aid, not a diagnostician. Code only what the note states.
   Never infer unstated conditions, and never suggest treatment.

OUTPUT CONTRACT
Return a single JSON object and nothing else - no markdown fence, no prose:

{{
  "detected_language": "<language name in English>",
  "processed_text": "<one-sentence English summary of the note>",
  "matches": [
    {{
      "namaste_code": "<code copied from the catalogue>",
      "confidence": <number between 0 and 1>,
      "surface": "<exact phrase from the note>",
      "reason": "<18 words or fewer>"
    }}
  ]
}}

If the note contains no codable condition, return the object with "matches": [].

CATALOGUE ({count} codes - the complete set of permitted namaste_code values)
namaste_code | traditional term | english | system | category | TM2 | ICD-11
{catalogue}
"""


def build_system_prompt(catalogue: dict) -> str:
    return SYSTEM_PROMPT_TEMPLATE.format(
        count=len(catalogue),
        catalogue=format_catalogue(catalogue),
    )


# --------------------------------------------------------------------------
# Gemini call
# --------------------------------------------------------------------------

class GeminiError(RuntimeError):
    pass


def call_gemini(system_prompt: str, user_text: str, temperature: float = 0.2) -> dict:
    """POST to Gemini with a real system_instruction. Returns parsed JSON."""
    if not API_KEY:
        raise GeminiError("No API key. Set GEMINI_API_KEY.")

    payload = {
        # This is the system prompt proper - a separate role from the user turn.
        "system_instruction": {"parts": [{"text": system_prompt}]},
        "contents": [{"role": "user", "parts": [{"text": user_text}]}],
        "generationConfig": {
            "temperature": temperature,
            "responseMimeType": "application/json",
        },
    }

    request = urllib.request.Request(
        ENDPOINT,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            # Header, not a URL query param - keeps the key out of logs/history.
            "x-goog-api-key": API_KEY,
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=TIMEOUT_SECONDS) as response:
            body = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", "replace")[:400]
        raise GeminiError(f"HTTP {exc.code} from Gemini: {detail}") from exc
    except urllib.error.URLError as exc:
        raise GeminiError(f"Could not reach Gemini: {exc.reason}") from exc

    candidates = body.get("candidates") or []
    if not candidates:
        blocked = body.get("promptFeedback", {}).get("blockReason")
        raise GeminiError(f"No candidates returned (blockReason={blocked})")

    parts = candidates[0].get("content", {}).get("parts") or []
    text = "".join(p.get("text", "") for p in parts).strip()
    if not text:
        raise GeminiError("Gemini returned an empty response")

    # responseMimeType should prevent fences, but strip them defensively.
    if text.startswith("```"):
        text = text.split("\n", 1)[-1].rsplit("```", 1)[0].strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError as exc:
        raise GeminiError(f"Model did not return valid JSON: {text[:200]}") from exc


# --------------------------------------------------------------------------
# Domain entry point
# --------------------------------------------------------------------------

def code_clinical_note(note: str, catalogue: dict | None = None) -> dict:
    """Code a note, then resolve every returned code against the catalogue."""
    catalogue = catalogue if catalogue is not None else load_catalogue()
    raw = call_gemini(build_system_prompt(catalogue), note)

    resolved, rejected = [], []
    seen = set()

    for match in raw.get("matches", []):
        code = (match.get("namaste_code") or "").strip()
        entry = catalogue.get(code)
        if entry is None:
            # The model named a code that does not exist - drop it.
            rejected.append(code)
            continue
        if code in seen:
            continue
        seen.add(code)
        resolved.append({
            **entry,
            "confidence": match.get("confidence"),
            "surface": match.get("surface", ""),
            "reason": match.get("reason", ""),
        })

    return {
        "original_text": note,
        "detected_language": raw.get("detected_language", "Unknown"),
        "processed_text": raw.get("processed_text", ""),
        "matches": resolved,
        "rejected_codes": rejected,
        "model": MODEL,
    }


def to_fhir_bundle(result: dict) -> dict:
    """Dual-coded FHIR R4 Conditions: one problem carrying NAMASTE + TM2 + ICD-11."""
    return {
        "resourceType": "Bundle",
        "type": "collection",
        "entry": [
            {
                "resource": {
                    "resourceType": "Condition",
                    "clinicalStatus": {"coding": [{"code": "active"}]},
                    "code": {
                        "text": m["english_translation"],
                        "coding": [
                            {
                                "system": "https://ayush.gov.in/fhir/CodeSystem/namaste",
                                "code": m["namaste_code"],
                                "display": m["traditional_term"],
                            },
                            {
                                "system": "http://id.who.int/icd/release/11/mms",
                                "code": m["tm2_code"],
                                "display": m["tm2_title"],
                            },
                            {
                                "system": "http://id.who.int/icd/release/11/mms",
                                "code": m["icd_code"],
                                "display": m["icd_title"],
                            },
                        ],
                    },
                }
            }
            for m in result["matches"]
        ],
    }


# --------------------------------------------------------------------------
# Local proxy (keeps the API key server-side, off the browser)
# --------------------------------------------------------------------------

def serve(port: int) -> None:
    from http.server import BaseHTTPRequestHandler, HTTPServer

    catalogue = load_catalogue()

    class Handler(BaseHTTPRequestHandler):
        def _cors(self):
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Access-Control-Allow-Headers", "Content-Type")
            self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")

        def do_OPTIONS(self):
            self.send_response(204)
            self._cors()
            self.end_headers()

        def do_POST(self):
            length = int(self.headers.get("Content-Length", 0))
            try:
                body = json.loads(self.rfile.read(length) or b"{}")
                note = body.get("note") or body.get("diagnosis_text") or ""
                if not note.strip():
                    raise ValueError("Request must include a non-empty 'note'.")
                result = code_clinical_note(note, catalogue)
                result["fhir_bundle"] = to_fhir_bundle(result)
                status, payload = 200, result
            except (ValueError, json.JSONDecodeError) as exc:
                status, payload = 400, {"error": str(exc)}
            except GeminiError as exc:
                status, payload = 502, {"error": str(exc)}

            data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
            self.send_response(status)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self._cors()
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)

        def log_message(self, *args):
            pass  # keep the demo console quiet

    print(f"Hubble AI proxy on http://localhost:{port}  (model: {MODEL})")
    print(f"Catalogue: {len(catalogue)} NAMASTE codes")
    print('POST {"note": "..."}  -  Ctrl+C to stop')
    HTTPServer(("localhost", port), Handler).serve_forever()


# --------------------------------------------------------------------------
# CLI
# --------------------------------------------------------------------------

def main(argv: list) -> int:
    # Windows consoles default to cp1252, which cannot encode Devanagari, Tamil,
    # etc. Without this, printing a Hindi result raises UnicodeEncodeError.
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(encoding="utf-8")
        except (AttributeError, OSError):
            pass

    args = argv[1:]
    if not args:
        print(__doc__)
        return 1

    if args[0] == "--serve":
        serve(int(args[1]) if len(args) > 1 else 8791)
        return 0

    dry_run = args[0] == "--dry-run"
    if dry_run:
        args = args[1:]

    note = " ".join(args).strip()
    if not note:
        print("Please provide a clinical note.", file=sys.stderr)
        return 1

    catalogue = load_catalogue()

    if dry_run:
        print("=" * 70)
        print("SYSTEM PROMPT")
        print("=" * 70)
        print(build_system_prompt(catalogue))
        print("=" * 70)
        print("USER TURN")
        print("=" * 70)
        print(note)
        return 0

    try:
        result = code_clinical_note(note, catalogue)
    except GeminiError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 2

    print(f'Note      : {result["original_text"]}')
    print(f'Language  : {result["detected_language"]}')
    print(f'Summary   : {result["processed_text"]}')
    print(f'Model     : {result["model"]}')
    if result["rejected_codes"]:
        print(f'Rejected  : {result["rejected_codes"]}  (not in catalogue)')
    print("-" * 70)

    if not result["matches"]:
        print("No codable condition found in the catalogue.")
        return 0

    for m in result["matches"]:
        pct = f'{float(m["confidence"] or 0) * 100:.0f}%'
        print(f'{m["traditional_term"]} ({m["english_translation"]})  [{m["medical_system"]}]  {pct}')
        print(f'    trigger  : "{m["surface"]}"')
        print(f'    reason   : {m["reason"]}')
        print(f'    NAMASTE  : {m["namaste_code"]}')
        print(f'    ICD-11   : TM2 {m["tm2_code"]}  |  Bio {m["icd_code"]} {m["icd_title"]}')
        print()

    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
