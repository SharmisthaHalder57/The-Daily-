import { createFileRoute } from '@tanstack/react-router'
import NewspaperHeader from '@/components/NewspaperHeader'

export const Route = createFileRoute('/about')({
  component: AboutPage,
})

function getDate() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function AboutPage() {
  return (
    <div className="min-h-screen bg-[var(--newsprint)] dark:bg-[#0f0f0f]">
      <NewspaperHeader date={getDate()} edition="About This Project" />

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="text-center mb-6">
          <h2 className="headline-serif text-3xl font-black dark:text-[#f0e8d8]">About The Daily বার্তা</h2>
          <hr className="rule-double mt-3" />
        </div>

        <div className="space-y-6 article-text dark:text-[#c8bca8]">
          <section>
            <h3 className="headline-serif text-xl font-bold mb-2 dark:text-[#f0e8d8]">The Story</h3>
            <hr className="rule-thin mb-3" />
            <p>
              <strong className="dateline">NEW DELHI, 2025 —</strong> The Daily বার্তা (বার্তা meaning "news" or
              "message" in Bengali) is an AI-powered newspaper platform built for the hackathon. It transforms raw,
              unformatted news from any source — wire reports, social media posts, press releases — into beautifully
              formatted, column-based newspaper layouts with importance ranking, audio narration, and multilingual
              spirit.
            </p>
            <p>
              The name pays homage to the rich tradition of Bengali journalism while embracing the cutting edge of
              artificial intelligence. The subtitle <em>আজকের খবর, আপনার ভাষায়</em> — "Today's news, in your
              language" — reflects our commitment to accessible, human-readable journalism.
            </p>
          </section>

          <div className="pull-quote dark:border-[#555] dark:text-[#d4ccb8]">
            "All the News That's Fit to Digitize" — The Daily বার্তা motto
          </div>

          <section>
            <h3 className="headline-serif text-xl font-bold mb-2 dark:text-[#f0e8d8]">How It Works</h3>
            <hr className="rule-thin mb-3" />
            <p>
              Paste any raw news text into the submission form on the Front Page. Our Gemini-powered backend
              analyzes the content and returns a fully structured article: headline, category, priority ranking,
              importance score, simple-language summary, expanded full text, and key highlights.
            </p>
            <p>
              Articles are automatically arranged in a classic broadsheet layout — breaking news spans the full
              width with large headlines, high-priority stories occupy dual columns, and minor news fills a
              four-column grid at the bottom, just like a real newspaper's front page.
            </p>
            <p>
              Each article features a <strong>Read Aloud</strong> button powered by ElevenLabs — click it and a
              professional news anchor voice reads the article to you.
            </p>
          </section>

          <section>
            <h3 className="headline-serif text-xl font-bold mb-2 dark:text-[#f0e8d8]">Technology</h3>
            <hr className="rule-thin mb-3" />
            <ul className="space-y-1.5">
              {[
                ['Google Gemini', 'AI-powered news parsing, summarization, and priority classification'],
                ['ElevenLabs', 'Neural text-to-speech for news anchor audio narration'],
                ['Unsplash', 'Contextual photography matched to article topics'],
                ['TanStack Start', 'Full-stack React framework with file-based routing'],
                ['Netlify', 'Deployment, serverless functions, and AI Gateway'],
                ['Tailwind CSS 4', 'Newspaper-inspired utility-first styling'],
              ].map(([tech, desc]) => (
                <li key={tech} className="flex gap-2">
                  <span className="text-[var(--red-accent)] font-black shrink-0">◆</span>
                  <span>
                    <strong className="headline-serif">{tech}</strong> — {desc}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h3 className="headline-serif text-xl font-bold mb-2 dark:text-[#f0e8d8]">Setup &amp; API Keys</h3>
            <hr className="rule-thin mb-3" />
            <p>
              To run this project locally, create a <code className="bg-[var(--newsprint-dark)] dark:bg-[#222] px-1">.env</code> file in the project root with the following keys:
            </p>
            <pre className="bg-[var(--newsprint-dark)] dark:bg-[#1a1a1a] border border-[var(--rule-light)] dark:border-[#333] p-3 text-xs font-mono overflow-x-auto mt-2 mb-2">
{`# Required for AI news parsing (via Netlify AI Gateway)
GEMINI_API_KEY=your_key_here

# Required for text-to-speech narration
ELEVENLABS_API_KEY=your_key_here`}
            </pre>
            <p>
              Images are sourced from Unsplash's public photo URL — no API key required for basic usage.
            </p>
          </section>

          <section>
            <h3 className="headline-serif text-xl font-bold mb-2 dark:text-[#f0e8d8]">Features</h3>
            <hr className="rule-thin mb-3" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                '📰 Classic broadsheet newspaper layout',
                '🤖 Gemini AI news parsing & formatting',
                '🔊 ElevenLabs audio narration',
                '🎙️ Voice input via microphone',
                '📸 Auto-matched article photography',
                '⚡ Breaking news scrolling ticker',
                '🗂️ Browse news by category',
                '🗄️ localStorage article archive',
                '🌙 Dark / Night edition mode',
                '📱 Fully responsive design',
                '⭐ Importance scoring (1–10)',
                '🔴 Priority color-coding system',
              ].map((f) => (
                <div key={f} className="flex gap-2 text-sm">
                  <span className="shrink-0">{f.split(' ')[0]}</span>
                  <span>{f.split(' ').slice(1).join(' ')}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <footer className="page-footer dark:border-[#333] dark:text-[#555] mt-8">
          <p>The Daily বার্তা &nbsp;◆&nbsp; Built for a Hackathon &nbsp;◆&nbsp; 2025</p>
        </footer>
      </main>
    </div>
  )
}
