import sys
import json
import torch
import soundfile as sf
from qwen_tts import Qwen3TTSModel

if len(sys.argv) < 2:
    print("Usage: python tts.py <jobs_file.json>", file=sys.stderr)
    sys.exit(1)

jobs_file = sys.argv[1]
with open(jobs_file, 'r') as f:
    jobs = json.load(f)

print(f"TTS: Processing {len(jobs)} segments...")

device = "cpu"
print(f"Device: {device}")

model = Qwen3TTSModel.from_pretrained(
    "Qwen/Qwen3-TTS-12Hz-0.6B-CustomVoice",
    device_map=device,
    dtype=torch.float32,
)

print("Model loaded!")

SPEAKERS = ["Vivian", "Davis", "Brian", "Ethan"]

speaker_assignments = {}
speaker_index = 0

for job in jobs:
    index = job["index"]
    text = job["text"]
    emotion = job["emotion"]
    character = job.get("character", "narrator") or "narrator"
    output_file = job["output_file"]

    if character.lower() in ("narrator", "narration"):
        speaker = "Davis"
    elif character in speaker_assignments:
        speaker = speaker_assignments[character]
    else:
        speaker = SPEAKERS[speaker_index % len(SPEAKERS)]
        speaker_assignments[character] = speaker
        speaker_index += 1

    instruct = f"Speak in a {emotion} tone"

    print(f"  [{index}] {character} ({speaker}) — {emotion}: {text[:50]}")

    try:
        wavs, sr = model.generate_custom_voice(
            text=text,
            language="English",
            speaker=speaker,
            instruct=instruct,
        )
        sf.write(output_file, wavs[0], sr)
        print(f"       Saved: {output_file}")
    except Exception as e:
        print(f"       Failed segment {index}: {e}", file=sys.stderr)

print("Done!")