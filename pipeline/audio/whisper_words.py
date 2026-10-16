"""Word-level timestamps for the voiceover: faster-whisper, any language (the model comes from config/languages.json).

Usage: python3 whisper_words.py <audio> <model> <language> [prompt]
Prints JSON: [{"w": "word", "start": 1.23, "end": 1.56}, ...]
"""
import json
import subprocess
import sys

import numpy as np

from faster_whisper import WhisperModel


def main():
    audio, model_name, language = sys.argv[1:4]
    prompt = sys.argv[4] if len(sys.argv) > 4 else None
    # Decode with ffmpeg (16 kHz mono float) — avoids PyAV version issues.
    pcm = subprocess.run(
        ["ffmpeg", "-nostdin", "-v", "error", "-i", audio, "-f", "s16le", "-ac", "1", "-ar", "16000", "-"],
        check=True, capture_output=True,
    ).stdout
    samples = np.frombuffer(pcm, np.int16).astype(np.float32) / 32768.0
    model = WhisperModel(model_name, device="cpu", compute_type="int8")
    segments, _ = model.transcribe(
        samples,
        language=language,
        word_timestamps=True,
        initial_prompt=prompt,
        vad_filter=False,
        beam_size=5,
        condition_on_previous_text=True,
    )
    words = [
        {"w": w.word.strip(), "start": round(w.start, 3), "end": round(w.end, 3)}
        for seg in segments
        for w in (seg.words or [])
        if w.word.strip()
    ]
    json.dump(words, sys.stdout, ensure_ascii=False)


if __name__ == "__main__":
    main()
