# Transcribes the voice-over with word timestamps, for timing the cues.
# Usage: python -I transcribe.py <audio> <out.json>
import json
import sys

from faster_whisper import WhisperModel

audio, out = sys.argv[1], sys.argv[2]
model = WhisperModel("small.en", device="cpu", compute_type="int8")
segments, _ = model.transcribe(audio, word_timestamps=True, beam_size=5)

words = []
for seg in segments:
    print(f"[{seg.start:6.2f} – {seg.end:6.2f}] {seg.text.strip()}")
    for w in seg.words:
        words.append({"w": w.word.strip(), "s": round(w.start, 2), "e": round(w.end, 2)})

with open(out, "w") as f:
    json.dump(words, f, indent=0)
