require('dotenv').config()
const OpenAI = require('openai')

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const SYSTEM_PROMPT = `You are a light novel text parser. Your job is to analyze light novel text and break it into structured segments.

For each segment, identify:
- type: either "narration" or "dialogue"
- text: the actual text content (dialogue without quotes)
- character: (dialogue only) the character speaking — infer from context like "Rimuru said" or "she replied"
- emotion: (dialogue only) the emotional tone — infer from words like "trembling", "coldly", "whispered", "shouted", "laughed"

Emotion must be one of: neutral, happy, sad, angry, fearful, surprised, cold, warm, trembling, whispering, shouting

Rules:
- Narration includes everything that is not spoken dialogue
- If a character is unknown or unnamed, use "narrator" as the character
- Never include dialogue attribution in the text (e.g. remove "he said", "she replied")
- Always return a JSON array, no extra text, no markdown

Example input:
The rain fell heavily that night.
"I can't believe you did that," Rimuru said, his voice trembling.
"It was necessary," Shizu replied coldly.

Example output:
[
  { "type": "narration", "text": "The rain fell heavily that night." },
  { "type": "dialogue", "character": "Rimuru", "emotion": "trembling", "text": "I can't believe you did that." },
  { "type": "dialogue", "character": "Shizu", "emotion": "cold", "text": "It was necessary." }
]`

async function parseChapter(rawText) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Parse this light novel text into segments:\n\n${rawText}\n\nReturn a JSON object with a "segments" array.`,
      },
    ],
    temperature: 0.2,
  })

  const raw = response.choices[0].message.content
  const parsed = JSON.parse(raw)
  return parsed.segments
}

module.exports = { parseChapter }