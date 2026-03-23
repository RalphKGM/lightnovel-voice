'use client'
import { useState } from 'react'

// ── Emotion color palette ──────────────────────────────────────────────────
const EMOTION_COLORS = {
  neutral:    '#8b9cb0',
  happy:      '#f0c040',
  sad:        '#6090c0',
  angry:      '#e05040',
  fearful:    '#a060c0',
  surprised:  '#40c0b0',
  cold:       '#80b0d0',
  warm:       '#e09060',
  trembling:  '#c080a0',
  whispering: '#7090a0',
  shouting:   '#e06030',
}

// ── Preset voice descriptions for quick assignment ────────────────────────
const VOICE_PRESETS = [
  'warm gentle young male voice',
  'cool calm young female voice',
  'deep steady mature male voice',
  'bright cheerful young female voice',
  'cold distant female voice',
  'gruff weathered male voice',
  'soft whispering female voice',
  'energetic young male voice',
]

const API = 'http://localhost:3000'

export default function Home() {
  const [text, setText] = useState('')
  const [segments, setSegments] = useState([])
  const [voices, setVoices] = useState({})          // { characterName: voiceDescription }
  const [audioFiles, setAudioFiles] = useState([])
  const [currentIndex, setCurrentIndex] = useState(null)
  const [phase, setPhase] = useState('input')        // input | parsed | generating | playing
  const [error, setError] = useState('')
  const [loadingMsg, setLoadingMsg] = useState('')

  // ── Get unique characters from parsed segments ───────────────────────────
  const characters = [...new Set(
    segments
      .filter(s => s.type === 'dialogue' && s.character)
      .map(s => s.character)
  )]

  // ── Step 1: Parse the pasted text ────────────────────────────────────────
  async function handleParse() {
    if (!text.trim()) return
    setError('')
    setLoadingMsg('Parsing characters and dialogue...')
    setPhase('loading')

    try {
      const res = await fetch(`${API}/parse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setSegments(data.segments)

      // Pre-fill voices for each detected character
      const initialVoices = {}
      const uniqueChars = [...new Set(data.segments.filter(s => s.character).map(s => s.character))]
      uniqueChars.forEach((c, i) => {
        initialVoices[c] = VOICE_PRESETS[i % VOICE_PRESETS.length]
      })
      setVoices(initialVoices)
      setPhase('parsed')
    } catch (e) {
      setError(e.message)
      setPhase('input')
    }
    setLoadingMsg('')
  }

  // ── Step 2: Generate audio with Qwen3-TTS ────────────────────────────────
  async function handleGenerate() {
    setError('')
    setLoadingMsg('Generating voices with Qwen3-TTS... (this takes a minute)')
    setPhase('generating')

    try {
      const res = await fetch(`${API}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ segments, voices }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setAudioFiles(data.audioFiles)
      setPhase('playing')
    } catch (e) {
      setError(e.message)
      setPhase('parsed')
    }
    setLoadingMsg('')
  }

  // ── Play audio sequentially ───────────────────────────────────────────────
  function playSegment(index) {
    const af = audioFiles[index]
    if (!af) return
    setCurrentIndex(index)
    const audio = new Audio(`${API}${af.url}`)
    audio.play()
    audio.onended = () => {
      if (index + 1 < audioFiles.length) playSegment(index + 1)
      else setCurrentIndex(null)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <main style={styles.page}>
      <div style={styles.container}>

        {/* Header */}
        <header style={styles.header}>
          <div style={styles.logoRow}>
            <span style={styles.logoIcon}>◈</span>
            <h1 style={styles.title}>LightNovel<span style={styles.titleAccent}>Voice</span></h1>
          </div>
          <p style={styles.subtitle}>AI-powered full-cast audiobook from any text</p>
        </header>

        {/* Error */}
        {error && <div style={styles.error}>⚠ {error}</div>}

        {/* Loading */}
        {loadingMsg && (
          <div style={styles.loadingBar}>
            <span style={styles.spinner}>◌</span> {loadingMsg}
          </div>
        )}

        {/* ── Phase: Input ─────────────────────────────────────────── */}
        {(phase === 'input' || phase === 'loading') && (
          <section style={styles.card}>
            <label style={styles.label}>Paste your chapter text</label>
            <textarea
              style={styles.textarea}
              placeholder={`The rain fell heavily that night.\n"I can't believe you did that," Rimuru said, his voice trembling.\n"It was necessary," Shizu replied coldly.`}
              value={text}
              onChange={e => setText(e.target.value)}
              rows={12}
            />
            <button
              style={phase === 'loading' ? styles.btnDisabled : styles.btn}
              onClick={handleParse}
              disabled={phase === 'loading'}
            >
              {phase === 'loading' ? 'Parsing...' : '→ Parse Chapter'}
            </button>
          </section>
        )}

        {/* ── Phase: Parsed — assign voices ────────────────────────── */}
        {(phase === 'parsed' || phase === 'generating') && (
          <>
            {/* Voice assignment panel */}
            {characters.length > 0 && (
              <section style={styles.card}>
                <h2 style={styles.cardTitle}>🎭 Assign Voices</h2>
                <p style={styles.hint}>Describe each character's voice in plain English. Qwen3-TTS understands these.</p>
                <div style={styles.voiceGrid}>
                  {characters.map(char => (
                    <div key={char} style={styles.voiceRow}>
                      <span style={styles.charName}>{char}</span>
                      <input
                        style={styles.voiceInput}
                        value={voices[char] || ''}
                        onChange={e => setVoices(v => ({ ...v, [char]: e.target.value }))}
                        placeholder="e.g. warm gentle young male voice"
                      />
                    </div>
                  ))}
                </div>
                <button
                  style={phase === 'generating' ? styles.btnDisabled : styles.btnAccent}
                  onClick={handleGenerate}
                  disabled={phase === 'generating'}
                >
                  {phase === 'generating' ? '⏳ Generating audio...' : '⬡ Generate Audio'}
                </button>
              </section>
            )}

            {/* Segments preview */}
            <section style={styles.card}>
              <div style={styles.cardTitleRow}>
                <h2 style={styles.cardTitle}>📖 Parsed Segments</h2>
                <span style={styles.badge}>{segments.length} segments</span>
              </div>
              <div style={styles.segmentList}>
                {segments.map((seg, i) => (
                  <div key={i} style={{
                    ...styles.segment,
                    borderLeft: `3px solid ${seg.type === 'narration' ? '#445566' : (EMOTION_COLORS[seg.emotion] || '#8b9cb0')}`
                  }}>
                    <div style={styles.segMeta}>
                      {seg.type === 'narration'
                        ? <span style={styles.tagNarration}>narration</span>
                        : <>
                            <span style={styles.tagChar}>{seg.character}</span>
                            {seg.emotion && (
                              <span style={{ ...styles.tagEmotion, color: EMOTION_COLORS[seg.emotion] || '#8b9cb0' }}>
                                {seg.emotion}
                              </span>
                            )}
                          </>
                      }
                    </div>
                    <p style={styles.segText}>{seg.text}</p>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {/* ── Phase: Playing ───────────────────────────────────────── */}
        {phase === 'playing' && (
          <section style={styles.card}>
            <h2 style={styles.cardTitle}>🎧 Playback</h2>
            <div style={styles.playControls}>
              <button style={styles.btnPlay} onClick={() => playSegment(0)}>
                ▶ Play All
              </button>
              <button style={styles.btnSmall} onClick={() => { setPhase('parsed'); setAudioFiles([]) }}>
                ↩ Re-assign voices
              </button>
            </div>
            <div style={styles.segmentList}>
              {audioFiles.map((af, i) => (
                <div key={i} style={{
                  ...styles.segment,
                  ...styles.segmentPlayable,
                  ...(currentIndex === i ? styles.segmentActive : {}),
                }}
                  onClick={() => playSegment(i)}
                >
                  <div style={styles.segMeta}>
                    <span style={styles.playIcon}>{currentIndex === i ? '▶' : '○'}</span>
                    <span style={styles.tagChar}>{af.character}</span>
                  </div>
                  <p style={styles.segText}>{af.text}</p>
                </div>
              ))}
            </div>
          </section>
        )}

      </div>
    </main>
  )
}

// ── Styles ─────────────────────────────────────────────────────────────────
const styles = {
  page: {
    minHeight: '100vh',
    background: '#0d1117',
    color: '#c8d0dc',
    fontFamily: '"Crimson Pro", "Georgia", serif',
    padding: '2rem 1rem',
  },
  container: {
    maxWidth: 760,
    margin: '0 auto',
  },
  header: {
    marginBottom: '2.5rem',
    textAlign: 'center',
  },
  logoRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.6rem',
    marginBottom: '0.4rem',
  },
  logoIcon: {
    fontSize: '1.8rem',
    color: '#7eb8d4',
  },
  title: {
    fontSize: '2.2rem',
    fontWeight: 700,
    margin: 0,
    color: '#e0e8f0',
    letterSpacing: '-0.02em',
  },
  titleAccent: {
    color: '#7eb8d4',
  },
  subtitle: {
    fontSize: '0.95rem',
    color: '#6070808',
    color: '#607080',
    margin: 0,
    fontStyle: 'italic',
  },
  card: {
    background: '#161c24',
    border: '1px solid #2a3445',
    borderRadius: 8,
    padding: '1.5rem',
    marginBottom: '1.5rem',
  },
  cardTitle: {
    fontSize: '1rem',
    fontWeight: 600,
    color: '#a8b8c8',
    margin: '0 0 1rem 0',
    fontFamily: '"Courier New", monospace',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  },
  cardTitleRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '1rem',
  },
  badge: {
    fontSize: '0.75rem',
    background: '#2a3445',
    color: '#7eb8d4',
    padding: '2px 8px',
    borderRadius: 12,
    fontFamily: 'monospace',
  },
  label: {
    display: 'block',
    fontSize: '0.85rem',
    color: '#7eb8d4',
    marginBottom: '0.6rem',
    fontFamily: 'monospace',
    letterSpacing: '0.05em',
  },
  hint: {
    fontSize: '0.8rem',
    color: '#50607a',
    margin: '-0.5rem 0 1rem 0',
    fontStyle: 'italic',
  },
  textarea: {
    width: '100%',
    background: '#0d1117',
    border: '1px solid #2a3445',
    borderRadius: 6,
    color: '#c8d0dc',
    fontSize: '0.95rem',
    lineHeight: 1.7,
    padding: '0.8rem',
    resize: 'vertical',
    fontFamily: '"Crimson Pro", Georgia, serif',
    boxSizing: 'border-box',
    outline: 'none',
  },
  btn: {
    marginTop: '1rem',
    background: '#1e2d40',
    border: '1px solid #3a5068',
    borderRadius: 6,
    color: '#7eb8d4',
    cursor: 'pointer',
    fontSize: '0.9rem',
    padding: '0.6rem 1.4rem',
    fontFamily: 'monospace',
    letterSpacing: '0.05em',
    transition: 'background 0.15s',
  },
  btnAccent: {
    marginTop: '1rem',
    background: '#1a3040',
    border: '1px solid #7eb8d4',
    borderRadius: 6,
    color: '#7eb8d4',
    cursor: 'pointer',
    fontSize: '0.9rem',
    padding: '0.6rem 1.4rem',
    fontFamily: 'monospace',
    letterSpacing: '0.05em',
  },
  btnDisabled: {
    marginTop: '1rem',
    background: '#161c24',
    border: '1px solid #2a3445',
    borderRadius: 6,
    color: '#445566',
    cursor: 'not-allowed',
    fontSize: '0.9rem',
    padding: '0.6rem 1.4rem',
    fontFamily: 'monospace',
  },
  btnPlay: {
    background: '#203040',
    border: '1px solid #7eb8d4',
    borderRadius: 6,
    color: '#acd8f0',
    cursor: 'pointer',
    fontSize: '1rem',
    padding: '0.6rem 1.8rem',
    fontFamily: 'monospace',
  },
  btnSmall: {
    background: 'transparent',
    border: '1px solid #2a3445',
    borderRadius: 6,
    color: '#607080',
    cursor: 'pointer',
    fontSize: '0.8rem',
    padding: '0.4rem 1rem',
    fontFamily: 'monospace',
  },
  playControls: {
    display: 'flex',
    gap: '0.8rem',
    alignItems: 'center',
    marginBottom: '1.2rem',
  },
  voiceGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.6rem',
    marginBottom: '1rem',
  },
  voiceRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.8rem',
  },
  charName: {
    minWidth: 90,
    fontSize: '0.85rem',
    color: '#7eb8d4',
    fontFamily: 'monospace',
  },
  voiceInput: {
    flex: 1,
    background: '#0d1117',
    border: '1px solid #2a3445',
    borderRadius: 5,
    color: '#c8d0dc',
    fontSize: '0.85rem',
    padding: '0.4rem 0.7rem',
    fontFamily: '"Crimson Pro", serif',
    outline: 'none',
  },
  segmentList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    maxHeight: 420,
    overflowY: 'auto',
  },
  segment: {
    background: '#0d1117',
    borderLeft: '3px solid #2a3445',
    borderRadius: '0 5px 5px 0',
    padding: '0.6rem 0.9rem',
  },
  segmentPlayable: {
    cursor: 'pointer',
    transition: 'background 0.1s',
  },
  segmentActive: {
    background: '#1a2535',
    borderLeftColor: '#7eb8d4',
  },
  segMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '0.3rem',
  },
  tagNarration: {
    fontSize: '0.7rem',
    color: '#445566',
    fontFamily: 'monospace',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  tagChar: {
    fontSize: '0.75rem',
    color: '#7eb8d4',
    fontFamily: 'monospace',
    fontWeight: 600,
  },
  tagEmotion: {
    fontSize: '0.7rem',
    fontFamily: 'monospace',
    opacity: 0.85,
  },
  segText: {
    fontSize: '0.9rem',
    margin: 0,
    lineHeight: 1.55,
    color: '#a8b8c0',
  },
  playIcon: {
    fontSize: '0.7rem',
    color: '#7eb8d4',
    fontFamily: 'monospace',
  },
  error: {
    background: '#2a1418',
    border: '1px solid #8b3030',
    borderRadius: 6,
    color: '#e08080',
    fontSize: '0.85rem',
    padding: '0.7rem 1rem',
    marginBottom: '1rem',
    fontFamily: 'monospace',
  },
  loadingBar: {
    background: '#161e2c',
    border: '1px solid #2a3c50',
    borderRadius: 6,
    color: '#7eb8d4',
    fontSize: '0.85rem',
    padding: '0.7rem 1rem',
    marginBottom: '1rem',
    fontFamily: 'monospace',
  },
  spinner: {
    display: 'inline-block',
    animation: 'spin 1s linear infinite',
  },
}