# lightnovel-voice

An AI-powered light novel reader that voices narration and character dialogue with distinct, emotionally aware voices — turning a flat text file into something that feels like a full cast production.

## what im aiming for

Upload a light novel chapter. The AI reads it, figures out who is talking and how they feel, assigns each character a distinct voice, and plays it back as if a full cast recorded it. The narrator gets one voice. Rimuru gets another. Each character's emotional state — trembling, cold, whispering, shouting — is reflected in how the voice sounds, not just what it says.

Eventually: ambient sound effects layered underneath. Rain when it rains. Thunder when it strikes. Silence when it matters.

## flow

```
Upload text (EPUB, PDF, or paste)
        |
GPT-4o-mini parses it into segments:
- narration blocks
- dialogue blocks (character + emotion)
        |
Qwen3-TTS generates audio per segment
with the right voice and emotional tone
        |
Segments stitched together
        |
Play it back in the browser
```

## stack

| Layer | Technology |
|---|---|
| Frontend | Next.js + Tailwind CSS |
| Backend | Node.js + Express |
| Text parsing | GPT-4o-mini |
| Voice generation | Qwen3-TTS (open source, Apache 2.0) |
| Audio processing | ffmpeg |
| File parsing | epub.js, pdf-parse |

## qwen3-tts

Qwen3-TTS is an open-source TTS model released by Alibaba's Qwen team in January 2026. It supports voice cloning from 3 seconds of reference audio, emotion and tone control through natural language descriptions, and outperforms ElevenLabs on standard benchmarks. It is free to use commercially under Apache 2.0. This means character voices can be cloned from actual anime voice actor samples, giving characters voices that fans already associate with them.

## status

- [x] Text parser — GPT-4o-mini correctly identifies narration, dialogue, character names, and emotions
- [ ] Voice generation Qwen3-TTS integration
- [ ] Audio stitching ffmpeg pipeline
- [ ] Frontend player character voice picker, playback controls
- [ ] File upload EPUB and PDF support
- [ ] Character registry persistent voice assignments per book

## my scope for now

Paste raw text, pick voices for up to 3 characters, generate and play audio. No file upload yet. No storage. Just prove the concept works end to end.
