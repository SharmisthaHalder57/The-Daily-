import type { Context } from '@netlify/functions'
import { GoogleGenAI } from '@google/genai'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

export default async (req: Request, _context: Context) => {
  try {
    const { rawNews, imageBase64, language } = await req.json()

    if (!rawNews || typeof rawNews !== 'string') {
      return Response.json({ error: 'rawNews is required' }, { status: 400 })
    }

    const isBengali = language === 'bn-IN'

    const prompt = `You are a professional newspaper editor. Take the following raw news and format it into a structured newspaper article. Return ONLY a valid JSON object (no markdown, no code blocks) with these exact fields:
- title: string (catchy headline${isBengali ? ' IN BENGALI SCRIPT' : ''})
- category: one of "Politics", "Sports", "Tech", "Entertainment", "World", "Business", "Science", "Health", "Culture", "Other"
- priority: one of "Breaking", "High", "Medium", "Low"
- importanceScore: number 1-10
- summary: string (simple everyday language, 2-3 sentences${isBengali ? ' IN BENGALI SCRIPT' : ''})
- fullArticle: string (newspaper style, 3-4 paragraphs separated by \\n\\n${isBengali ? ' IN BENGALI SCRIPT' : ''})
- highlights: array of 3-5 key point strings${isBengali ? ' IN BENGALI SCRIPT' : ''}
- suggestedImageQuery: string (short descriptive query for image search in English)
- columnSize: one of "full" (for Breaking), "half" (for High), "quarter" (for Medium/Low)

${isBengali ? 'IMPORTANT: YOU MUST WRITE THE ARTICLE (title, summary, fullArticle, highlights) ENTIRELY IN BENGALI LANGUAGE/SCRIPT. Do not use English for the article content.' : ''}

Raw news: ${rawNews}`

    let apiContents: any[] = [prompt]

    if (imageBase64) {
      const mime = imageBase64.split(';')[0].split(':')[1];
      const data = imageBase64.split(',')[1];
      apiContents = [
        prompt,
        {
          inlineData: {
            data: data,
            mimeType: mime
          }
        }
      ]
    }

    const response = await ai.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: apiContents,
    })

    const text = response.text ?? ''

    // Strip markdown code fences if present
    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
    const parsed = JSON.parse(cleaned)

    return Response.json(parsed)
  } catch (err) {
    console.error('Gemini parse error:', err)
    return Response.json({ error: String(err) }, { status: 500 })
  }
}

export const config = {
  path: '/api/gemini-parse',
}
