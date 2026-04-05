import type { Context } from '@netlify/functions'
import { GoogleGenAI } from '@google/genai'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

export default async (req: Request, _context: Context) => {
  try {
    const { articleText, title, messages, language } = await req.json()

    if (!articleText || !messages) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const isBengali = language === 'bn-IN'
    const langInstructions = isBengali
      ? "You MUST respond entirely in the Bengali language (বাংলা)."
      : "You must respond in English."

    // Construct system instructions
    const systemPrompt = `You are an AI Editorial Assistant reviewing a news article.
Your name is "Daily Barta Copilot".
You are helping the editor review, summarize, and analyze this news draft.
Answer their questions based primarily on the provided article. Provide professional, analytical, and objective responses.
Keep your responses conversational and relatively concise (under 100 words per reply) so it plays well over Text-to-Speech audio.
${langInstructions}

Article Context:
Title: ${title}
Text: ${articleText.slice(0, 3000)}`

    // Format chat history for Gemini
    // We treat the system prompt as the first message or use system_instruction if supported
    // For simplicity with generateContent, we'll prepend the system prompt to the user's first message
    
    let promptContents = ''
    
    if (messages.length === 0) {
      promptContents = `${systemPrompt}\n\nUser: Summarize this article for me.`
    } else {
      const historyStr = messages.map((m: any) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n\n')
      promptContents = `${systemPrompt}\n\nChat History:\n${historyStr}\n\nRespond to the last message as the Assistant:`
    }

    const response = await ai.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: promptContents,
    })

    const text = response.text ?? ''

    return Response.json({ reply: text.trim() })
  } catch (err) {
    console.error('Chat error:', err)
    return Response.json({ error: String(err) }, { status: 500 })
  }
}

export const config = {
  path: '/api/article-chat',
}
