import { createFileRoute } from '@tanstack/react-router'

// ElevenLabs voice IDs:
// Rachel  – calm, professional newscaster female: 21m00Tcm4TlvDq8ikWAM
// Adam    – deep, authoritative male:              pNInz6obpgDQGcFmaJgB
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID ?? '21m00Tcm4TlvDq8ikWAM' // Rachel

const ELEVENLABS_API_BASE = 'https://api.elevenlabs.io/v1/text-to-speech'

// Bengali Unicode block: U+0980–U+09FF
const BENGALI_RE = /[\u0980-\u09FF]/

// Maximum characters (ElevenLabs free tier ~ 10 000 chars/month)
const MAX_CHARS = 3000

export const Route = createFileRoute('/api/elevenlabs-tts')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.ELEVENLABS_API_KEY
        if (!apiKey) {
          return new Response(
            JSON.stringify({ error: 'ELEVENLABS_API_KEY is not set' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } },
          )
        }

        let text: string
        try {
          const body = await request.json()
          text = String(body.text ?? '').trim()
        } catch {
          return new Response(
            JSON.stringify({ error: 'Invalid JSON body' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } },
          )
        }

        if (!text) {
          return new Response(
            JSON.stringify({ error: 'text is required' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } },
          )
        }

        // Truncate to stay within quota
        if (text.length > MAX_CHARS) {
          text = text.slice(0, MAX_CHARS) + '…'
        }

        // Detect Bengali: eleven_multilingual_v2 supports Bengali;
        // eleven_turbo_v2_5 is English-only and will garble Bengali text
        const isBengali = BENGALI_RE.test(text)
        const modelId = isBengali ? 'eleven_multilingual_v2' : 'eleven_turbo_v2_5'
        const apiUrl = `${ELEVENLABS_API_BASE}/${VOICE_ID}`

        try {
          const elResp = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'xi-api-key': apiKey,
              'Content-Type': 'application/json',
              Accept: 'audio/mpeg',
            },
            body: JSON.stringify({
              text,
              model_id: modelId,
              voice_settings: {
                stability: 0.50,
                similarity_boost: 0.82,
                // style only applied for English (multilingual ignores it)
                ...(isBengali ? {} : { style: 0.30 }),
                use_speaker_boost: true,
              },
            }),
          })

          if (!elResp.ok) {
            const errText = await elResp.text()
            console.error('[ElevenLabs TTS] API error:', elResp.status, errText)
            return new Response(
              JSON.stringify({ error: `ElevenLabs error: ${elResp.status}`, detail: errText }),
              { status: elResp.status, headers: { 'Content-Type': 'application/json' } },
            )
          }

          // Stream the audio back to the client
          const audioBuffer = await elResp.arrayBuffer()
          return new Response(audioBuffer, {
            status: 200,
            headers: {
              'Content-Type': 'audio/mpeg',
              'Cache-Control': 'no-store',
            },
          })
        } catch (err) {
          console.error('[ElevenLabs TTS] Fetch error:', err)
          return new Response(
            JSON.stringify({ error: 'Failed to reach ElevenLabs API' }),
            { status: 502, headers: { 'Content-Type': 'application/json' } },
          )
        }
      },
    },
  },
})
