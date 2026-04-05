import { useState, useRef } from 'react'
import { Volume2, VolumeX, Square, Scale } from 'lucide-react'
import type { NewsArticle } from '@/types/news'
import BiasAnalysis from './BiasAnalysis'
import InteractivePodcast from './InteractivePodcast'

interface Props {
  article: NewsArticle
  onRemove?: () => void
}

const PRIORITY_COLORS: Record<string, string> = {
  Breaking: 'priority-breaking',
  High: 'priority-high',
  Medium: 'priority-medium',
  Low: 'priority-low',
}

const UNSPLASH_FALLBACKS: Record<string, string> = {
  Politics: 'capitol-building-government',
  Sports: 'sports-stadium-athletes',
  Tech: 'technology-computer-modern',
  Entertainment: 'theater-entertainment-lights',
  World: 'world-globe-earth',
  Business: 'business-finance-office',
  Science: 'science-laboratory-research',
  Health: 'health-medicine-hospital',
  Culture: 'culture-art-museum',
  Other: 'newspaper-press-journalism',
}

export default function ArticleCard({ article, onRemove }: Props) {
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [audioLoading, setAudioLoading] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [imgError, setImgError] = useState(false)
  const [expanded, setExpanded] = useState(article.columnSize === 'full')
  const [biasOpen, setBiasOpen] = useState(false)
  const [podcastOpen, setPodcastOpen] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const priorityClass = PRIORITY_COLORS[article.priority] ?? 'priority-low'
  const isBreaking = article.priority === 'Breaking'

  const imageQuery = article.suggestedImageQuery || UNSPLASH_FALLBACKS[article.category] || 'newspaper'
  const unsplashUrl = `https://source.unsplash.com/featured/800x400?${encodeURIComponent(imageQuery)}`
  const imgSrc = article.imageUrl || (imgError ? `https://picsum.photos/seed/${article.id}/800/400` : unsplashUrl)

  const handleReadAloud = async () => {
    if (playing) {
      handleStop()
      return
    }

    if (audioUrl && audioRef.current) {
      audioRef.current.play()
      setPlaying(true)
      return
    }

    setAudioLoading(true)
    try {
      const text = `${article.title}. ${article.summary} ${article.fullArticle}`
      let useFallback = false;

      try {
        const resp = await fetch('/api/elevenlabs-tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        })
        if (!resp.ok) throw new Error(await resp.text())
        const blob = await resp.blob()
        const url = URL.createObjectURL(blob)
        setAudioUrl(url)

        const audio = new Audio(url)
        audioRef.current = audio
        audio.onended = () => setPlaying(false)
        audio.onerror = () => setPlaying(false)
        await audio.play()
        setPlaying(true)
      } catch (err) {
        console.warn(`ElevenLabs TTS error: ${err}. Falling back to browser TTS.`);
        useFallback = true;
      }

      if (useFallback) {
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel() // Stop any previous speech
          const utterance = new SpeechSynthesisUtterance(text)
          if (/[\u0980-\u09FF]/.test(text)) {
            utterance.lang = 'bn-IN'
          }
          utterance.onend = () => setPlaying(false)
          utterance.onerror = () => setPlaying(false)
          window.speechSynthesis.speak(utterance)
          setPlaying(true)
        } else {
          alert('TTS error and your browser does not support default Web Speech.')
        }
      }
    } finally {
      setAudioLoading(false)
    }
  }


  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    setPlaying(false)
  }

  const paragraphs = (article.fullArticle ?? '').split(/\n\n+/).filter(Boolean)
  const previewParagraphs = expanded ? paragraphs : paragraphs.slice(0, 2)

  const date = new Date(article.processedAt)
  const dateStr = date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <article
      className={`bg-[var(--newsprint)] border border-[var(--rule-light)] overflow-hidden article-hover ${isBreaking ? 'ring-2 ring-[var(--red-accent)]' : ''
        }`}
    >
      {/* Article image */}
      {!imgError ? (
        <div className="relative overflow-hidden" style={{ aspectRatio: '16/9' }}>
          <img
            src={imgSrc}
            alt={article.title}
            className="article-image w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          <div className="absolute top-2 left-2 flex gap-1.5">
            <span className={`${priorityClass} text-[10px] font-black uppercase tracking-widest px-2 py-0.5 body-serif`}>
              {article.priority}
            </span>
            <span className="bg-[var(--newsprint)] text-[var(--ink)] text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 body-serif category-badge">
              {article.category}
            </span>
          </div>
        </div>
      ) : (
        <div className="flex gap-1.5 p-2">
          <span className={`${priorityClass} text-[10px] font-black uppercase tracking-widest px-2 py-0.5 body-serif`}>
            {article.priority}
          </span>
          <span className="bg-[var(--newsprint-dark)] text-[var(--ink)] text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 body-serif category-badge">
            {article.category}
          </span>
        </div>
      )}

      <div className="p-4">
        {/* Headline */}
        <h2 className={`headline-serif font-black leading-tight mb-2 ${isBreaking ? 'text-2xl md:text-3xl text-[var(--ink)]' : 'text-xl'
          }`}>
          {article.title}
        </h2>

        <hr className="rule-thin mb-2" />

        {/* Dateline + importance */}
        <div className="flex items-center justify-between mb-3">
          <span className="dateline">{dateStr}</span>
          <span className="bg-[var(--ink)] text-[var(--newsprint)] text-[10px] font-bold px-1.5 py-0.5 body-serif" title="Importance score">
            {article.importanceScore}/10
          </span>
        </div>

        {/* Summary */}
        <p className="text-sm font-bold body-serif mb-3 leading-snug italic">
          {article.summary}
        </p>

        <hr className="rule-thin mb-3" />

        {/* Highlights */}
        {(article.highlights ?? []).length > 0 && (
          <ul className="mb-3 space-y-1">
            {(article.highlights ?? []).map((h, i) => (
              <li key={i} className="flex gap-2 text-xs body-serif">
                <span className="text-[var(--red-accent)] font-black shrink-0">◆</span>
                <span>{h}</span>
              </li>
            ))}
          </ul>
        )}

        <hr className="rule-thin mb-3" />

        {/* Full article */}
        <div className={`article-text drop-cap ${isBreaking ? 'newspaper-cols-2' : ''}`}>
          {previewParagraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        {!expanded && paragraphs.length > 2 && (
          <button
            onClick={() => setExpanded(true)}
            className="text-xs text-[var(--ink-faint)] italic body-serif hover:underline mt-1"
          >
            Continued… ▼ Read full story
          </button>
        )}

        {expanded && (
          <p className="continued mt-2">— End of report</p>
        )}

        <hr className="rule-thin mt-3 mb-3" />

        {/* Actions */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleReadAloud}
              disabled={audioLoading}
              className={`audio-btn flex items-center gap-1.5 border px-2.5 py-1 transition-colors text-xs ${playing
                  ? 'border-[var(--red-accent)] text-[var(--red-accent)]'
                  : 'border-[var(--rule-light)] hover:border-[var(--rule)] text-[var(--ink)]'
                } disabled:opacity-40`}
              title="Read aloud via ElevenLabs"
            >
              {audioLoading ? (
                <span className="animate-spin text-xs">⠸</span>
              ) : playing ? (
                <VolumeX size={12} />
              ) : (
                <Volume2 size={12} />
              )}
              {audioLoading ? 'Loading…' : playing ? 'Pause' : '🔊 Read Aloud'}
            </button>
            {playing && (
              <button
                onClick={handleStop}
                className="audio-btn border border-[var(--rule-light)] px-2 py-1 text-xs flex items-center gap-1 hover:border-[var(--rule)] text-[var(--ink)]"
              >
                <Square size={10} fill="currentColor" /> Stop
              </button>
            )}
            <button
              onClick={() => setBiasOpen((o) => !o)}
              className={`audio-btn flex items-center gap-1.5 border px-2.5 py-1 transition-colors text-xs ${biasOpen
                  ? 'border-[var(--ink)] text-[var(--ink)] bg-[var(--newsprint-dark)]'
                  : 'border-[var(--rule-light)] hover:border-[var(--rule)] text-[var(--ink)]'
                }`}
              title="Analyze article for bias"
            >
              <Scale size={12} />
              {biasOpen ? 'Close Audit' : '⚖️ Bias Audit'}
            </button>
            <button
              onClick={() => setPodcastOpen((o) => !o)}
              className={`audio-btn flex items-center gap-1.5 border px-2.5 py-1 transition-colors text-xs ${podcastOpen
                  ? 'border-[var(--ink)] text-[var(--ink)] bg-[var(--newsprint-dark)]'
                  : 'border-[var(--rule-light)] hover:border-[var(--rule)] text-[var(--ink)]'
                }`}
              title="Open Editorial Assistant"
            >
              🧠 Editorial AI
            </button>
          </div>
          {onRemove && (
            <button
              onClick={onRemove}
              className="text-[10px] text-[var(--ink-faint)] uppercase tracking-widest body-serif hover:text-[var(--red-accent)] transition-colors"
            >
              ✕ Remove
            </button>
          )}
        </div>

        {biasOpen && (
          <BiasAnalysis
            title={article.title}
            articleText={`${article.summary}\n\n${article.fullArticle}`}
            language={/[\u0980-\u09FF]/.test(article.fullArticle ?? '') ? 'bn-IN' : 'en-US'}
            onClose={() => setBiasOpen(false)}
          />
        )}
        
        {podcastOpen && (
          <InteractivePodcast 
            article={article} 
            onClose={() => setPodcastOpen(false)} 
          />
        )}
      </div>
    </article>
  )
}
