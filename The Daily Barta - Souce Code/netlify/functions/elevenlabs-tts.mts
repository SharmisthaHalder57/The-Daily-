import type { Context } from '@netlify/functions'

// News anchor voice ID from ElevenLabs
const DEFAULT_VOICE_ID = 'ErXwobaYiN019PkySvjV' // Antoni - professional male voice

export default async (req: Request, _context: Context) => {
  try {
    const { text, voiceId = DEFAULT_VOICE_ID } = await req.json()

    if (!text || typeof text !== 'string') {
      return Response.json({ error: 'text is required' }, { status: 400 })
    }

    const apiKey = process.env.ELEVENLABS_API_KEY
    if (!apiKey) {
      return Response.json(
        { error: 'ElevenLabs API key not configured. Set ELEVENLABS_API_KEY env var.' },
        { status: 500 }
      )
    }

    const ttsResponse = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          Accept: 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
        },
        body: JSON.stringify({
          text: text.slice(0, 5000), // ElevenLabs limit
          model_id: 'eleven_turbo_v2_5',
          voice_settings: {
            stability: 0.55,
            similarity_boost: 0.75,
            style: 0.2,
            use_speaker_boost: true,
          },
        }),
      }
    )

    if (!ttsResponse.ok) {
      const errText = await ttsResponse.text()
      return Response.json({ error: `TTS failed: ${errText}` }, { status: ttsResponse.status })
    }

    const audioBuffer = await ttsResponse.arrayBuffer()
    return new Response(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': String(audioBuffer.byteLength),
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    console.error('ElevenLabs TTS error:', err)
    return Response.json({ error: String(err) }, { status: 500 })
  }
}

export const config = {
  path: '/api/elevenlabs-tts',
}
