/**
 * PrintEdition.tsx
 * ─────────────────────────────────────────────────────────────
 * A print-ONLY component that renders a true broadsheet newspaper
 * layout (TOI / Telegraph style).
 *
 * Hidden on screen; appears ONLY when window.print() is triggered.
 * ─────────────────────────────────────────────────────────────
 */

import type { NewsArticle } from '@/types/news'

interface Props {
  articles: NewsArticle[]
}

function getDate() {
  return new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatParagraphs(text: string) {
  return (text ?? '').split(/\n\n+/).filter(Boolean)
}

/** Single-article column block used in the multi-column grid */
function ArticleBlock({ article, large = false }: { article: NewsArticle; large?: boolean }) {
  const paras = formatParagraphs(article.fullArticle)

  return (
    <div className={`np-article-block ${large ? 'np-article-large' : ''}`}>
      {/* Category label */}
      <div className="np-category-label">{article.category.toUpperCase()}</div>

      {/* Headline */}
      <h2 className={large ? 'np-headline-large' : 'np-headline'}>{article.title}</h2>

      {/* Byline */}
      <div className="np-byline">
        By The Daily বার্তা AI Correspondent &nbsp;|&nbsp;{' '}
        {new Date(article.processedAt).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })}
      </div>

      <div className="np-rule-thin" />

      {/* Lead / summary */}
      <p className="np-lead">{article.summary}</p>

      {/* Photo — shown for all articles if image exists */}
      {article.imageUrl && (
        <div className="np-photo-block">
          <img
            src={article.imageUrl}
            alt={article.title}
            className="np-photo"
          />
          <div className="np-photo-caption">
            ◆ {article.suggestedImageQuery || article.title}
          </div>
        </div>
      )}

      {/* Body paragraphs */}
      <div className="np-body">
        {paras.map((p, i) => (
          <p key={i} className={i === 0 ? 'np-drop-cap' : ''}>
            {p}
          </p>
        ))}
      </div>

      {/* Key points */}
      {(article.highlights ?? []).length > 0 && (
        <div className="np-highlights">
          <div className="np-highlights-label">KEY POINTS</div>
          <ul>
            {(article.highlights ?? []).map((h, i) => (
              <li key={i}>{h}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default function PrintEdition({ articles }: Props) {
  if (articles.length === 0) return null

  const breaking = articles.filter(a => a.priority === 'Breaking')
  const high     = articles.filter(a => a.priority === 'High')
  const medium   = articles.filter(a => a.priority === 'Medium')
  const low      = articles.filter(a => a.priority === 'Low')

  const date    = getDate()
  const edition = `Vol. 1, No. ${articles.length}`

  return (
    <div id="print-edition" className="np-root">

      {/* ═══════════════════ MASTHEAD ═══════════════════ */}
      <header className="np-masthead">
        <div className="np-masthead-top">
          <div className="np-masthead-meta-left">
            <div>{edition}</div>
            <div>Established 2025</div>
          </div>
          <div className="np-masthead-title">The Daily বার্তা</div>
          <div className="np-masthead-meta-right">
            <div>{date}</div>
            <div>₹5.00 / Free (Digital)</div>
          </div>
        </div>
        <div className="np-rule-double" />
        <div className="np-masthead-tagline">
          AI-Powered Journalism &nbsp;◆&nbsp; Bilingual Edition &nbsp;◆&nbsp; Hackathon 2025
        </div>
        <div className="np-rule-thick" />
      </header>

      {/* ═══════════════════ BREAKING NEWS ═══════════════════ */}
      {breaking.length > 0 && (
        <section className="np-section-breaking">
          <div className="np-section-label-breaking">⬛ BREAKING NEWS</div>
          {breaking.map(a => (
            <div key={a.id} className="np-breaking-story">
              <div className="np-breaking-headline">{a.title}</div>
              <div className="np-byline">
                EXCLUSIVE &nbsp;|&nbsp; By The Daily বার্তা Correspondent
              </div>
              <div className="np-rule-thin" />
              {a.imageUrl && (
                <div className="np-breaking-photo-wrap">
                  <img src={a.imageUrl} alt={a.title} className="np-breaking-photo" />
                  <span className="np-photo-caption">
                    ◆ {a.suggestedImageQuery || a.title}
                  </span>
                </div>
              )}
              <div className="np-breaking-body">
                <p className="np-lead">{a.summary}</p>
                {formatParagraphs(a.fullArticle).map((p, i) => (
                  <p key={i} className={i === 0 ? 'np-drop-cap' : ''}>{p}</p>
                ))}
              </div>
            </div>
          ))}
          <div className="np-rule-double" />
        </section>
      )}

      {/* ═══════════════════ TOP STORIES (High) ═══════════════════ */}
      {high.length > 0 && (
        <section className="np-section">
          <div className="np-section-label">▪ TOP STORIES</div>
          <div className="np-grid-high">
            {high.map(a => (
              <ArticleBlock key={a.id} article={a} large />
            ))}
          </div>
          <div className="np-rule-thick" />
        </section>
      )}

      {/* ═══════════════════ IN THE NEWS (Medium + Low) ═══════════════════ */}
      {(medium.length > 0 || low.length > 0) && (
        <section className="np-section">
          <div className="np-section-label">▪ IN THE NEWS</div>
          <div className="np-grid-cols">
            {[...medium, ...low].map(a => (
              <ArticleBlock key={a.id} article={a} />
            ))}
          </div>
        </section>
      )}

      {/* ═══════════════════ NEWSPAPER FOOTER ═══════════════════ */}
      <footer className="np-footer">
        <div className="np-rule-double" />
        <div className="np-footer-content">
          <span>The Daily বার্তা &nbsp;◆&nbsp; AI-Powered Journalism</span>
          <span>{date}</span>
          <span>Hackathon Edition 2025 &nbsp;◆&nbsp; Powered by Gemini &amp; ElevenLabs</span>
        </div>
      </footer>

    </div>
  )
}
