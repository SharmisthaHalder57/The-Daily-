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
      ? 'IMPORTANT: Write the `leaning` and `analysis` fields entirely in Bengali script (বাংলা). The `loadedWords` should be the exact words extracted from the article.'
      : ''

    const prompt = `You are an expert media bias analyst and fact-checker. Analyze the following news article for political, ideological, personal, or corporate bias from the editor/writer's perspective. Be highly critical of framing, emotional language, loaded words, omitted context, and narrative shaping.

Article Title: ${title}

Article:
${articleText.slice(0, 3000)}

Return ONLY a valid JSON object (no markdown, no code blocks) with this exact structure:
{
  "biasScore": number (0 to 100, where 0 is completely neutral/objective and 100 is extremely biased/propagandistic),
  "leaning": "string (Short classification of the bias, e.g., 'Pro-Government', 'Left-Leaning', 'Sensationalist', 'Anti-Opposition', 'Neutral')",
  "analysis": "string (2-3 sentences explaining exactly how the article is biased. Point out specific framing techniques, loaded adjectives, or missing perspectives.)",
  "loadedWords": ["word1", "word2", "word3"] (List up to 5 specific emotionally charged or biased words found in the text. If neutral, return an empty array.)
}

Rules:
- Be incredibly strict. Even subtle framing should increase the bias score!
- Determine who the article is inherently supporting or attacking.
${langNote}`

    const response = await ai.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: [prompt],
    })

    const text = response.text ?? ''
    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
    const parsed = JSON.parse(cleaned)

    // Validate structure somewhat
    if (typeof parsed.biasScore !== 'number' || !parsed.analysis) {
      throw new Error('Invalid bias analysis structure returned by AI')
    }

    return Response.json(parsed)
  } catch (err) {
    console.error('Bias detection error:', err)
    return Response.json({ error: String(err) }, { status: 500 })
  }
}

export const config = {
  path: '/api/bias-detect',
}
