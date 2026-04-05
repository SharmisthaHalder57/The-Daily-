import { useState, useEffect } from 'react'

// WMO Weather code → [label, emoji]
const WMO: Record<number, [string, string]> = {
  0:  ['Clear',          '☀️'],
  1:  ['Mainly Clear',   '🌤️'],
  2:  ['Partly Cloudy',  '⛅'],
  3:  ['Overcast',       '☁️'],
  45: ['Foggy',          '🌫️'],
  48: ['Icy Fog',        '🌫️'],
  51: ['Drizzle',        '🌦️'],
  53: ['Drizzle',        '🌦️'],
  55: ['Heavy Drizzle',  '🌦️'],
  61: ['Rain',           '🌧️'],
  63: ['Rain',           '🌧️'],
  65: ['Heavy Rain',     '🌧️'],
  71: ['Snow',           '❄️'],
  73: ['Snow',           '❄️'],
  75: ['Heavy Snow',     '❄️'],
  77: ['Snow Grains',    '🌨️'],
  80: ['Showers',        '🌦️'],
  81: ['Showers',        '🌦️'],
  82: ['Heavy Showers',  '⛈️'],
  85: ['Snow Showers',   '🌨️'],
  86: ['Snow Showers',   '🌨️'],
  95: ['Thunderstorm',   '⛈️'],
  96: ['Thunderstorm',   '⛈️'],
  99: ['Thunderstorm',   '⛈️'],
}

function decodeWmo(code: number) {
  return WMO[code] ?? ['Unknown', '🌡️']
}

interface WeatherData {
  city: string
  temp: number
  label: string
  emoji: string
  wind: number
}

export default function WeatherWidget() {
  const [data, setData] = useState<WeatherData | null>(null)
  const [phase, setPhase] = useState<'idle' | 'loading' | 'done' | 'denied'>('idle')

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return
    setPhase('loading')

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords
        try {
          // Open-Meteo: free, no API key, CORS-friendly
          const [wRes, gRes] = await Promise.all([
            fetch(
              `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weathercode,windspeed_10m`
            ),
            // Nominatim reverse geocode: free, no key needed
            fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=en`,
              { headers: { 'User-Agent': 'TheDailyBarta/1.0' } }
            ),
          ])
          const wJson = await wRes.json()
          const gJson = await gRes.json()

          const code: number = wJson.current.weathercode
          const [label, emoji] = decodeWmo(code)
          const city =
            gJson.address?.city ||
            gJson.address?.town ||
            gJson.address?.village ||
            gJson.address?.county ||
            'Your Area'

          setData({
            city,
            temp: Math.round(wJson.current.temperature_2m),
            label,
            emoji,
            wind: Math.round(wJson.current.windspeed_10m),
          })
          setPhase('done')
        } catch {
          setPhase('denied')
        }
      },
      () => setPhase('denied'),
      { timeout: 8000, maximumAge: 300_000 }
    )
  }, [])

  if (phase === 'loading') {
    return (
      <span className="text-[10px] body-serif text-[var(--ink-faint)] animate-pulse tracking-widest">
        ⛅ WEATHER…
      </span>
    )
  }

  if (phase !== 'done' || !data) return null

  return (
    <span
      className="flex items-center gap-1 text-[10px] body-serif font-bold uppercase tracking-widest"
      title={`${data.city} · ${data.label} · Wind ${data.wind} km/h`}
    >
      <span className="text-sm leading-none" role="img" aria-label={data.label}>
        {data.emoji}
      </span>
      <span>{data.city}</span>
      <span className="text-[var(--ink-faint)]">·</span>
      <span>{data.temp}°C</span>
      <span className="hidden md:inline text-[var(--ink-faint)]">· {data.label}</span>
    </span>
  )
}
