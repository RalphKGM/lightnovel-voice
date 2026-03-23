require('dotenv').config()
const express = require('express')
const cors = require('cors')
const { exec } = require('child_process')
const path = require('path')
const fs = require('fs')
const { parseChapter } = require('./parser')

const app = express()
app.use(cors())              // allows the frontend to talk to this server
app.use(express.json())

// serve generated audio files so the browser can play them
app.use('/audio', express.static(path.join(__dirname, 'audio_output')))

// make sure the output folder exists
const AUDIO_DIR = path.join(__dirname, 'audio_output')
if (!fs.existsSync(AUDIO_DIR)) fs.mkdirSync(AUDIO_DIR)

// ─── Health check ───────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ status: 'ok' })
})

// ─── POST /parse ────────────────────────────────────────────────
// Input:  { text: "raw novel chapter text" }
// Output: { segments: [ { type, text, character, emotion }, ... ] }
app.post('/parse', async (req, res) => {
  const { text } = req.body

  if (!text || text.trim() === '') {
    return res.status(400).json({ error: 'No text provided' })
  }

  try {
    const segments = await parseChapter(text)
    res.json({ segments })
  } catch (err) {
    console.error('Parse error:', err.message)
    res.status(500).json({ error: 'Failed to parse text' })
  }
})

app.post('/generate', async (req, res) => {
  const { segments, voices } = req.body

  if (!segments || segments.length === 0) {
    return res.status(400).json({ error: 'No segments provided' })
  }

  const jobs = segments.map((seg, i) => ({
    index: i,
    text: seg.text,
    emotion: seg.emotion || 'neutral',
    voice_description: seg.type === 'narration'
      ? 'calm neutral narrator voice'
      : (voices?.[seg.character] || 'neutral voice'),
    output_file: path.join(AUDIO_DIR, `segment_${i}.wav`)
  }))

  const jobsFile = path.join(__dirname, 'tts_jobs.json')
  fs.writeFileSync(jobsFile, JSON.stringify(jobs, null, 2))

  const pythonScript = path.join(__dirname, 'tts.py')
  exec(`"C:\\Users\\Ralph\\AppData\\Local\\Programs\\Python\\Python314\\python.exe" "${pythonScript}" "${jobsFile}"`, { timeout: 300000 }, (error, stdout, stderr) => {
    if (error) {
      console.error('TTS error:', stderr)
      return res.status(500).json({ error: 'TTS generation failed', details: stderr })
    }

    const audioFiles = jobs.map(job => ({
      index: job.index,
      character: segments[job.index].character || 'narrator',
      text: segments[job.index].text,
      url: `/audio/segment_${job.index}.wav`
    }))

    res.json({ audioFiles })
  })
})

app.listen(3000, () => console.log('✅ Server running on http://localhost:3000'))