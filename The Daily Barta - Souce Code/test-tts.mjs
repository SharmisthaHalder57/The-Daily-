import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.ELEVENLABS_API_KEY;
if (!apiKey) {
  console.log('No API key');
  process.exit(1);
}

async function testTTS() {
  const text = 'নমস্কার, আমি আপনার খবর পড়ছি।';
  console.log('Testing TTS for Bengali:', text);
  
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/ErXwobaYiN019PkySvjV`,
    {
      method: 'POST',
      headers: {
        Accept: 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_turbo_v2_5',
        voice_settings: {
          stability: 0.55,
          similarity_boost: 0.75,
          style: 0.2,
          use_speaker_boost: true,
        },
      }),
    }
  );

  console.log('Status:', response.status);
  
  if (!response.ok) {
    console.error('Error detail:', await response.text());
  } else {
    console.log('Success!', response.headers.get('content-type'));
  }
}

testTTS();
