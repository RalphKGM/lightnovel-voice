require('dotenv').config()
const { parseChapter } = require('./parser')

const sampleText = `
The rain fell heavily that night.

"I can't believe you did that," Rimuru said, his voice trembling.

"It was necessary," Shizu replied coldly.

The silence between them felt like an eternity. Rimuru stared at the floor, unable to meet her eyes.

"I'm sorry," he whispered.

Shizu turned away, her expression unreadable. "Sorry doesn't fix what's broken."

A crack of thunder shook the walls. Rimuru clenched his fists.

"Then tell me what does!" he shouted.
`

async function main() {
  console.log('sending to GPT...\n')
  const segments = await parseChapter(sampleText)
  console.log('parsed segments:\n')
  segments.forEach((seg, i) => {
    if (seg.type === 'narration') {
      console.log(`[${i}] NARRATION: "${seg.text}"`)
    } else {
      console.log(`[${i}] ${seg.character.toUpperCase()} (${seg.emotion}): "${seg.text}"`)
    }
  })
}

main().catch(console.error)