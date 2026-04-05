import { useState, useEffect } from 'react'
import { X, AlertTriangle, ShieldCheck, TrendingUp, Search } from 'lucide-react'

interface BiasReport {
  biasScore: number
  leaning: string
  analysis: string
  loadedWords: string[]
}

interface Props {
  title: string
  articleText: string
  language?: string
  onClose: () => void
}

export default function BiasAnalysis({ title, articleText, language, onClose }: Props) {
  const [report, setReport] = useState<BiasReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/bias-detect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ articleText, title, language }),
    })
      .then(async (r) => {
        if (!r.ok) {
          const msg = await r.text()
          throw new Error(msg || 'Bias detection failed')
        }
        return r.json()
      })
      .then((data) => {
        setReport(data)
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Determine color based on score
  const getScoreColor = (score: number) => {
    if (score <= 20) return 'text-emerald-600' // Objective
    if (score <= 50) return 'text-amber-600'   // Slight bias
    if (score <= 75) return 'text-orange-600'  // Biased
    return 'text-[var(--red-accent)]'          // Highly Biased
  }

  const getMeterColor = (score: number) => {
    if (score <= 20) return 'bg-emerald-600' // Objective
    if (score <= 50) return 'bg-amber-600'   // Slight bias
    if (score <= 75) return 'bg-orange-600'  // Biased
    return 'bg-[var(--red-accent)]'          // Highly Biased
  }

  const getIcon = (score: number) => {
    if (score <= 20) return <ShieldCheck className="text-emerald-600" size={24} />
    if (score <= 60) return <TrendingUp className="text-amber-600" size={24} />
    return <AlertTriangle className="text-[var(--red-accent)]" size={24} />
  }

  return (
    <div className="mt-3 border border-[var(--rule)] bg-[#fdfbf7] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--rule)] bg-[#ece9e2]">
        <div className="flex items-center gap-2">
          <Search size={14} className="text-[var(--ink)]" />
          <span className="headline-serif text-xs font-black uppercase tracking-widest text-[var(--ink)]">
            Editorial Bias Audit
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-[var(--ink-faint)] hover:text-[var(--ink)] transition-colors p-0.5"
          aria-label="Close bias report"
        >
          <X size={13} />
        </button>
      </div>

      <div className="p-4">
        {/* Loading */}
        {loading && (
          <div className="text-center py-8">
            <p className="text-xs body-serif italic text-[var(--ink-faint)] animate-pulse">
              ⠸ Auditing article for bias…
            </p>
            <p className="text-[10px] body-serif text-[var(--ink-faint)] mt-1 uppercase tracking-widest">
              Gemini is analyzing the text tone
            </p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="text-center py-6">
            <p className="text-2xl mb-2">⚠️</p>
            <p className="text-xs body-serif text-[var(--red-accent)] mb-3">{error}</p>
            <button
              onClick={onClose}
             className="text-xs body-serif font-bold uppercase tracking-widest border border-[var(--rule)] px-3 py-1.5 hover:bg-[var(--newsprint)] transition-colors"
            >
              Close
            </button>
          </div>
        )}

        {/* Report */}
        {!loading && !error && report && (
          <div className="flex flex-col gap-4">
            
            {/* Top Stat Row */}
            <div className="flex items-start md:items-center gap-4 border-b border-dashed border-[var(--rule-light)] pb-4">
              <div className="flex-shrink-0 text-center border border-[var(--rule-light)] bg-white p-3 min-w-[100px]">
                <div className="mb-1 flex justify-center">{getIcon(report.biasScore)}</div>
                <div className={`headline-serif text-3xl font-black ${getScoreColor(report.biasScore)} leading-none`}>
                  {report.biasScore}<span className="text-sm text-[var(--ink-faint)]">/100</span>
                </div>
                <div className="text-[9px] uppercase tracking-widest font-bold text-[var(--ink-faint)] mt-1">
                  Bias Score
                </div>
              </div>

              <div className="flex-1">
                <p className="text-sm font-bold uppercase tracking-wider mb-1 headline-serif">Leaning / Stance</p>
                <div className="inline-block bg-[var(--ink)] text-[var(--newsprint)] px-2 py-1 text-xs font-black uppercase tracking-widest body-serif">
                  {report.leaning}
                </div>
                
                <div className="mt-3 w-full bg-gray-200 h-2">
                  <div 
                    className={`h-full ${getMeterColor(report.biasScore)} transition-all duration-1000`} 
                    style={{ width: `${Math.max(5, report.biasScore)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[9px] uppercase tracking-widest text-[var(--ink-faint)] mt-1 font-bold body-serif">
                  <span>0 (Neutral)</span>
                  <span>100 (Biased)</span>
                </div>
              </div>
            </div>

            {/* Analysis Text */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[var(--ink-faint)] mb-1 body-serif">
                Editor's Notes
              </p>
              <p className="text-sm body-serif italic leading-relaxed text-[var(--ink)] border-l-2 border-[var(--rule)] pl-3">
                "{report.analysis}"
              </p>
            </div>

            {/* Loaded Words */}
            {(report.loadedWords ?? []).length > 0 && (
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[var(--ink-faint)] mb-2 body-serif">
                  Loaded / Charged Language Found
                </p>
                <div className="flex flex-wrap gap-2">
                  {(report.loadedWords ?? []).map((word, idx) => (
                    <span 
                      key={idx} 
                      className="px-2 py-0.5 border border-[var(--red-accent)] bg-red-50 text-[var(--red-accent)] text-xs font-bold body-serif"
                    >
                      {word}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
          </div>
        )}
      </div>
    </div>
  )
}
