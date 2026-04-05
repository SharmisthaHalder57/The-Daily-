import { useState, useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import NewspaperHeader from '@/components/NewspaperHeader'
import ArticleCard from '@/components/ArticleCard'
import type { NewsArticle } from '@/types/news'

export const Route = createFileRoute('/categories')({
  component: CategoriesPage,
})

const ALL_CATEGORIES = [
  'All',
  'Politics',
  'Sports',
  'Tech',
  'Entertainment',
  'World',
  'Business',
  'Science',
  'Health',
  'Culture',
  'Other',
] as const

function getDate() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function CategoriesPage() {
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [selected, setSelected] = useState<string>('All')

  useEffect(() => {
    try {
      const raw = localStorage.getItem('barta-articles')
      if (raw) setArticles(JSON.parse(raw))
    } catch {}
  }, [])

  const filtered =
    selected === 'All' ? articles : articles.filter((a) => a.category === selected)

  const counts: Record<string, number> = {}
  for (const a of articles) {
    counts[a.category] = (counts[a.category] || 0) + 1
  }

  return (
    <div className="min-h-screen bg-[var(--newsprint)] dark:bg-[#0f0f0f]">
      <NewspaperHeader date={getDate()} edition="Categories Edition" />

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="text-center mb-6">
          <h2 className="headline-serif text-3xl font-black dark:text-[#f0e8d8]">Browse by Category</h2>
          <hr className="rule-double mt-3" />
        </div>

        {/* Category pills */}
        <div className="flex flex-wrap gap-2 mb-6">
          {ALL_CATEGORIES.map((cat) => {
            const count = cat === 'All' ? articles.length : counts[cat] || 0
            if (cat !== 'All' && count === 0) return null
            return (
              <button
                key={cat}
                onClick={() => setSelected(cat)}
                className={`body-serif text-xs uppercase tracking-widest font-bold px-3 py-1.5 border transition-colors ${
                  selected === cat
                    ? 'bg-[var(--ink)] dark:bg-[#d4ccb8] text-[var(--newsprint)] dark:text-[#0f0f0f] border-[var(--ink)] dark:border-[#d4ccb8]'
                    : 'border-[var(--rule-light)] dark:border-[#444] hover:border-[var(--rule)] dark:hover:border-[#666] text-[var(--ink)] dark:text-[#d4ccb8]'
                }`}
              >
                {cat} {count > 0 && <span className="opacity-60">({count})</span>}
              </button>
            )
          })}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-[var(--rule-light)] dark:border-[#333]">
            <p className="text-4xl mb-2">📂</p>
            <p className="headline-serif text-xl font-bold dark:text-[#f0e8d8]">
              No articles in this category
            </p>
            <p className="text-sm body-serif italic text-[var(--ink-faint)] dark:text-[#666] mt-1">
              Submit news stories on the Front Page to populate the archive.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((a) => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </div>
        )}

        <footer className="page-footer dark:border-[#333] dark:text-[#555] mt-8">
          <p>The Daily বার্তা &nbsp;◆&nbsp; Categories &nbsp;◆&nbsp; All Editions</p>
        </footer>
      </main>
    </div>
  )
}
