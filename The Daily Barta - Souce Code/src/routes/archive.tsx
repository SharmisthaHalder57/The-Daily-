import { useState, useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import NewspaperHeader from '@/components/NewspaperHeader'
import ArticleCard from '@/components/ArticleCard'
import type { NewsArticle } from '@/types/news'

export const Route = createFileRoute('/archive')({
  component: ArchivePage,
})

function getDate() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function ArchivePage() {
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [search, setSearch] = useState('')
  const [confirmClear, setConfirmClear] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('barta-articles')
      if (!raw) return
      const parsed = JSON.parse(raw)
      if (!Array.isArray(parsed)) return
      // Filter out any malformed/legacy articles missing required fields
      setArticles(
        parsed.filter(
          (a: unknown) =>
            a &&
            typeof (a as NewsArticle).id === 'string' &&
            typeof (a as NewsArticle).title === 'string' &&
            typeof (a as NewsArticle).priority === 'string'
        )
      )
    } catch {}
  }, [])

  const handleClear = () => {
    if (!confirmClear) {
      setConfirmClear(true)
      return
    }
    localStorage.removeItem('barta-articles')
    setArticles([])
    setConfirmClear(false)
  }

  const filtered = search.trim()
    ? articles.filter(
        (a) =>
          (a.title ?? '').toLowerCase().includes(search.toLowerCase()) ||
          (a.summary ?? '').toLowerCase().includes(search.toLowerCase()) ||
          (a.category ?? '').toLowerCase().includes(search.toLowerCase())
      )
    : articles

  // Group by date
  const grouped: Record<string, NewsArticle[]> = {}
  for (const a of filtered) {
    const day = new Date(a.processedAt).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    ;(grouped[day] ??= []).push(a)
  }

  return (
    <div className="min-h-screen bg-[var(--newsprint)] dark:bg-[#0f0f0f]">
      <NewspaperHeader date={getDate()} edition="Archive Edition" />

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="text-center mb-6">
          <h2 className="headline-serif text-3xl font-black dark:text-[#f0e8d8]">News Archive</h2>
          <p className="text-sm body-serif italic text-[var(--ink-faint)] dark:text-[#666] mt-1">
            All previously processed stories — stored in your browser
          </p>
          <hr className="rule-double mt-3" />
        </div>

        {/* Search + clear */}
        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search headlines, summaries, categories…"
            className="flex-1 border border-[var(--rule-light)] dark:border-[#444] bg-white/80 dark:bg-[#1a1a1a] text-[var(--ink)] dark:text-[#d4ccb8] px-3 py-2 text-sm body-serif focus:outline-none focus:border-[var(--rule)] dark:focus:border-[#666]"
          />
          {articles.length > 0 && (
            <button
              onClick={handleClear}
              className={`body-serif text-xs uppercase tracking-widest font-bold px-3 py-2 border transition-colors whitespace-nowrap ${
                confirmClear
                  ? 'border-[var(--red-accent)] text-[var(--red-accent)]'
                  : 'border-[var(--rule-light)] dark:border-[#444] text-[var(--ink-faint)] dark:text-[#666] hover:border-[var(--red-accent)] hover:text-[var(--red-accent)]'
              }`}
            >
              {confirmClear ? 'Click again to confirm' : 'Clear Archive'}
            </button>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-[var(--rule-light)] dark:border-[#333]">
            <p className="text-4xl mb-2">🗄️</p>
            <p className="headline-serif text-xl font-bold dark:text-[#f0e8d8]">
              {search ? 'No matching stories found' : 'Archive is empty'}
            </p>
            <p className="text-sm body-serif italic text-[var(--ink-faint)] dark:text-[#666] mt-1">
              {search
                ? 'Try a different search term.'
                : 'Stories you process on the Front Page are saved here automatically.'}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(grouped).map(([day, dayArticles]) => (
              <section key={day}>
                <div className="flex items-center gap-3 mb-3">
                  <hr className="flex-1 rule-thick" />
                  <span className="headline-serif text-xs font-black uppercase tracking-[0.15em] dark:text-[#d4ccb8] whitespace-nowrap">
                    {day}
                  </span>
                  <hr className="flex-1 rule-thick" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {dayArticles.map((a) => (
                    <ArticleCard key={a.id} article={a} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        <footer className="page-footer dark:border-[#333] dark:text-[#555] mt-8">
          <p>
            The Daily বার্তা &nbsp;◆&nbsp; Archive &nbsp;◆&nbsp;{' '}
            {articles.length} article{articles.length !== 1 ? 's' : ''} stored
          </p>
        </footer>
      </main>
    </div>
  )
}
