import type { Context } from '@netlify/functions'
import { GoogleGenAI } from '@google/genai'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

export default async (req: Request, _context: Context) => {
  try {
    const { articleText, title, language } = await req.json()

    if (!articleText || typeof articleText !== 'string') {
      return Response.json({ error: 'articleText is required' }, { status: 400 })
    }

    const isBengali = language === 'bn-IN'
    const langNote = isBengali
      ? 'IMPORTANT: Write all questions, options, and explanations in Bengali script (বাংলা).'
      : ''

    const prompt = `You are a senior news editor for "The Daily Barta". Based on the following article draft, generate 3 multiple-choice fact-checking questions to test a junior editor's accuracy and attention to detail.

Article Title: ${title}

Article:
${articleText.slice(0, 3000)}

Return ONLY a valid JSON object (no markdown, no code blocks) with this exact structure:
{
  "questions": [
    {
      "question": "A clear question about the article content",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct": 0,
      "explanation": "Brief explanation of why this is the correct answer (1-2 sentences)"
    }
  ]
}

Rules:
- Generate exactly 3 questions
- Each question must have exactly 4 options
- "correct" is the 0-indexed position of the correct answer (0, 1, 2, or 3)
- Questions must be answerable ONLY from the article content — no outside knowledge needed
- Keep options concise (under 12 words each)
- Explanations should reference the article directly

${langNote}`

    const response = await ai.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: prompt,
    })

    const text = response.text ?? ''
    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
    const parsed = JSON.parse(cleaned)

    // Validate structure
    if (!Array.isArray(parsed.questions) || parsed.questions.length === 0) {
      throw new Error('Invalid quiz structure returned by AI')
    }

    return Response.json(parsed)
  } catch (err) {
    console.error('Quiz generation error:', err)
    return Response.json({ error: String(err) }, { status: 500 })
  }
}

export const config = {
  path: '/api/quiz',
}
