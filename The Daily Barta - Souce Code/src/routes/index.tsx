import { useState, useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import NewspaperHeader from '@/components/NewspaperHeader'
import BreakingNewsTicker from '@/components/BreakingNewsTicker'
import NewsInput from '@/components/NewsInput'
import ArticleCard from '@/components/ArticleCard'
import MiniCrossword from '@/components/MiniCrossword'
import PrintEdition from '@/components/PrintEdition'
import type { NewsArticle, GeminiResponse } from '@/types/news'

export const Route = createFileRoute('/')({
  component: FrontPage,
})

const ARCHIVE_KEY = 'barta-articles'

function loadArchive(): NewsArticle[] {
  try {
    const raw = localStorage.getItem(ARCHIVE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    // Filter out any legacy/malformed articles missing required fields
    return parsed.filter(
      (a) =>
        a &&
        typeof a.id === 'string' &&
        typeof a.title === 'string' &&
        typeof a.priority === 'string'
    )
  } catch {
    return []
  }
}

function saveArchive(articles: NewsArticle[]) {
  localStorage.setItem(ARCHIVE_KEY, JSON.stringify(articles))
}

function SkeletonArticle({ wide }: { wide?: boolean }) {
  return (
    <div className={`border border-[var(--rule-light)] overflow-hidden ${wide ? '' : ''}`}>
      <div className="skeleton bg-[var(--newsprint-dark)]" style={{ aspectRatio: '16/9' }} />
      <div className="p-4 space-y-2">
        <div className="skeleton h-6 w-4/5 bg-[var(--newsprint-dark)] rounded-sm" />
        <div className="skeleton h-4 w-3/5 bg-[var(--newsprint-dark)] rounded-sm" />
        <div className="skeleton h-3 w-full bg-[var(--newsprint-dark)] rounded-sm" />
        <div className="skeleton h-3 w-full bg-[var(--newsprint-dark)] rounded-sm" />
        <div className="skeleton h-3 w-2/3 bg-[var(--newsprint-dark)] rounded-sm" />
      </div>
    </div>
  )
}

function getDate() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function FrontPage() {
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load from localStorage on mount
  useEffect(() => {
    setArticles(loadArchive())
  }, [])

  const handleSubmit = async (rawText: string, imageBase64?: string, language?: string) => {
    setLoading(true)
    setError(null)
    try {
      const resp = await fetch('/api/gemini-parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawNews: rawText, imageBase64, language }),
      })
      if (!resp.ok) {
        const err = await resp.json()
        throw new Error(err.error || 'Parse failed')
      }
      const data: GeminiResponse = await resp.json()

      const article: NewsArticle = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        ...data,
        rawInput: rawText,
        processedAt: new Date().toISOString(),
        ...(imageBase64 ? { imageUrl: imageBase64 } : {})
      }

      const updated = [article, ...articles]
      setArticles(updated)
      saveArchive(updated)
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  const removeArticle = (id: string) => {
    const updated = articles.filter((a) => a.id !== id)
    setArticles(updated)
    saveArchive(updated)
  }

  const breaking = articles.filter((a) => a.priority === 'Breaking')
  const high = articles.filter((a) => a.priority === 'High')
  const medium = articles.filter((a) => a.priority === 'Medium')
  const low = articles.filter((a) => a.priority === 'Low')

  return (
    <>
      <div className="w-full print:hidden">
      {/* ── Breaking ticker pinned at the very top ── */}
      {breaking.length > 0 && (
        <BreakingNewsTicker headlines={breaking.map((a) => a.title)} />
      )}

      <NewspaperHeader
        date={getDate()}
        edition={`Vol. 1, No. ${Math.max(1, articles.length)}`}
      />

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* ── Breaking stories — above the fold, before the input ── */}
        {breaking.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <span className="priority-breaking text-[10px] font-black uppercase tracking-widest px-2 py-1 body-serif animate-pulse">
                🔴 Breaking News
              </span>
              <hr className="flex-1 rule-thick" />
              <span className="text-[9px] uppercase tracking-widest font-bold body-serif text-[var(--ink-faint)]">
                {breaking.length} {breaking.length === 1 ? 'story' : 'stories'}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {breaking.map((a) => (
                <ArticleCard key={a.id} article={a} onRemove={() => removeArticle(a.id)} />
              ))}
            </div>
          </section>
        )}

        {/* Input */}
        <NewsInput onSubmit={handleSubmit} loading={loading} />

        {error && (
          <div className="border-l-4 border-[var(--red-accent)] bg-red-50 p-3 mb-4 text-sm body-serif text-[var(--red-accent)]">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="mb-6">
            <p className="text-xs uppercase tracking-widest body-serif text-[var(--ink-faint)] mb-3 font-bold">
              ⠸ Typesetting your story…
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2"><SkeletonArticle wide /></div>
              <SkeletonArticle />
            </div>
          </div>
        )}

        {articles.length === 0 && !loading && (
          <div className="text-center py-16 border border-dashed border-[var(--rule-light)]">
            <p className="text-4xl mb-3">📰</p>
            <p className="headline-serif text-2xl font-bold mb-1">No stories yet</p>
            <p className="text-sm body-serif italic text-[var(--ink-faint)]">
              Paste a raw news story above and send it to press.
            </p>
          </div>
        )}


        {high.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <hr className="flex-1 rule-thick" />
              <span className="headline-serif text-xs font-black uppercase tracking-[0.2em]">
                Top Stories
              </span>
              <hr className="flex-1 rule-thick" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {high.map((a) => (
                <ArticleCard key={a.id} article={a} onRemove={() => removeArticle(a.id)} />
              ))}
            </div>
          </section>
        )}

        {/* Medium priority — 3 columns */}
        {medium.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <hr className="flex-1 rule-thin" />
              <span className="headline-serif text-xs font-bold uppercase tracking-[0.2em] text-[var(--ink-faint)]">
                In The News
              </span>
              <hr className="flex-1 rule-thin" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {medium.map((a) => (
                <ArticleCard key={a.id} article={a} onRemove={() => removeArticle(a.id)} />
              ))}
            </div>
          </section>
        )}

        {/* Low priority — 4 columns */}
        {low.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <hr className="flex-1 rule-thin" />
              <span className="headline-serif text-xs font-bold uppercase tracking-[0.2em] text-[var(--ink-faint)]">
                Also Today
              </span>
              <hr className="flex-1 rule-thin" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {low.map((a) => (
                <ArticleCard key={a.id} article={a} onRemove={() => removeArticle(a.id)} />
              ))}
            </div>
          </section>
        )}

        {/* Entertainment & Crossword */}
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <hr className="flex-1 rule-thin" />
            <span className="headline-serif text-xs font-bold uppercase tracking-[0.2em] text-[var(--ink-faint)]">
              Daily Amusements
            </span>
            <hr className="flex-1 rule-thin" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 hidden lg:flex items-center justify-center border border-[var(--rule-light)] bg-[#1a1a1a] min-h-[250px] relative overflow-hidden group">
               {/* 
                 Notice: Save the uploaded image as 'ad.jpg' inside the public/ directory 
               */}
               <img 
                 src="/ad.jpg" 
                 alt="Government College Of Engineering and Leather Technology" 
                 className="w-full h-full object-cover opacity-85 group-hover:opacity-100 transition-opacity grayscale hover:grayscale-0 duration-500"
               />
               <div className="absolute top-2 left-2 bg-black/60 text-white text-[9px] uppercase tracking-widest px-2 py-0.5">
                 Sponsored Advertisement
               </div>
            </div>
            <div className="lg:col-span-1">
              <MiniCrossword />
            </div>
          </div>
        </section>

        {/* ── PDF Download + Page Footer ── */}
        <div className="mt-8 border-t-2 border-double border-[var(--rule)] pt-4">

          {/* Download Button — only shown when articles exist */}
          {articles.length > 0 && (
            <div className="flex justify-center mb-5 pdf-download-btn">
              <button
                onClick={() => {
                  // Expand a short delay so print dialog opens after re-render
                  setTimeout(() => window.print(), 100)
                }}
                className="group flex items-center gap-2.5 bg-[var(--ink)] text-[var(--newsprint)] px-6 py-2.5 body-serif font-bold uppercase tracking-widest text-xs hover:bg-[var(--ink-light)] active:scale-95 transition-all duration-150 shadow-md"
                title="Opens print dialog — choose 'Save as PDF' as destination"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="group-hover:translate-y-0.5 transition-transform"
                  aria-hidden="true"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Download Today's Edition as PDF
              </button>
            </div>
          )}
          {articles.length > 0 && (
            <p className="text-center text-[9px] uppercase tracking-widest body-serif text-[var(--ink-faint)] mb-4 pdf-download-btn">
              In print dialog, set destination to <strong>"Save as PDF"</strong> for best results
            </p>
          )}

          <footer className="page-footer">
            <p>The Daily বার্তা &nbsp;◆&nbsp; AI-Powered Journalism &nbsp;◆&nbsp; Hackathon Edition 2025</p>
            <p className="mt-0.5">Powered by Gemini &amp; ElevenLabs &nbsp;◆&nbsp; Deployed on Netlify</p>
            <p className="mt-0.5">Page 1 of 1</p>
          </footer>
        </div>

      </main>
      </div>

      {/* ── Newspaper-style print edition (hidden on screen, visible only during print) ── */}
      <PrintEdition articles={articles} />

    </>
  )
}
