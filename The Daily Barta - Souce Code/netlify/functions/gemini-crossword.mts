import type { Context } from '@netlify/functions'
import { GoogleGenAI } from '@google/genai'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

// Static fallback crossword — shows if Gemini is unavailable
const FALLBACK = {
  grid: [
    ['N', 'E', 'T'],
    ['E', 'R', 'A'],
    ['W', 'S', 'T'],
  ],
  clues: {
    across: [
      { num: 1, clue: 'Internet, informally', answer: 'NET' },
      { num: 2, clue: 'Historical period', answer: 'ERA' },
      { num: 3, clue: 'Journalist\'s beat', answer: 'WST' },
    ],
    down: [
      { num: 1, clue: 'Recent; brand new', answer: 'NEW' },
      { num: 2, clue: 'Journalist\'s workplace', answer: 'ERS' },
      { num: 3, clue: 'Trio count', answer: 'TAT' },
    ],
  },
}

export default async (_req: Request, _context: Context) => {
  try {
    const prompt = `You are a NYT Crossword editor. Generate a 3x3 mini crossword.
Return ONLY a valid JSON object (no markdown, no code blocks) with this exact structure:
{
  "grid": [
    ["L", "E", "T"],
    ["O", "R", "E"],
    ["W", "A", "N"]
  ],
  "clues": {
    "across": [
      { "num": 1, "clue": "Allow", "answer": "LET" },
      { "num": 2, "clue": "Mineral extract", "answer": "ORE" },
      { "num": 3, "clue": "Pale", "answer": "WAN" }
    ],
    "down": [
      { "num": 1, "clue": "Not high", "answer": "LOW" },
      { "num": 2, "clue": "Ages and ages", "answer": "ERA" },
      { "num": 3, "clue": "Number after nine", "answer": "TEN" }
    ]
  }
}
Generate a NEW, valid 3x3 crossword about news or journalism. The letters must intersect perfectly — every cell belongs to both one Across and one Down word.`

    const response = await ai.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: [prompt],          // ← must be an array
    })

    const text = response.text ?? ''
    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
    const parsed = JSON.parse(cleaned)

    // Validate the structure before returning
    if (
      !Array.isArray(parsed.grid) ||
      parsed.grid.length !== 3 ||
      !parsed.clues?.across ||
      !parsed.clues?.down
    ) {
      console.warn('[Crossword] Gemini returned invalid structure, using fallback')
      return Response.json(FALLBACK)
    }

    return Response.json(parsed)
  } catch (err) {
    console.error('[Crossword] Gemini error, using fallback:', err)
    // Always return a working crossword — never 500
    return Response.json(FALLBACK)
  }
}

export const config = {
  path: '/api/gemini-crossword',
}
