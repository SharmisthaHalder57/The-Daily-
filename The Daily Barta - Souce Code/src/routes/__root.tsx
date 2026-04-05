import { HeadContent, Scripts, createRootRoute, Link } from '@tanstack/react-router'

import '../styles.css'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'The Daily বার্তা' },
      { name: 'description', content: 'AI-powered newspaper — আজকের খবর, আপনার ভাষায়' },
    ],
    links: [{ rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen bg-[#e8e8e8] text-[var(--ink)] relative sm:p-6 lg:p-10 font-serif">
        <div className="max-w-7xl mx-auto bg-[var(--newsprint)] newspaper-sheet relative flex flex-col min-h-screen sm:min-h-[calc(100vh-3rem)]">
        <nav className="sticky top-0 z-40 bg-[var(--newsprint)] border-b-[3px] border-[var(--rule)] text-[10px] md:text-xs font-bold uppercase tracking-widest body-serif">
          <div className="max-w-7xl mx-auto px-4 flex gap-4 py-1 overflow-x-auto">
            <Link to="/" className="hover:underline whitespace-nowrap [&.active]:border-b-2 [&.active]:border-current py-1">
              Front Page
            </Link>
            <span className="text-[var(--rule-light)]">|</span>
            <Link to="/categories" className="hover:underline whitespace-nowrap [&.active]:border-b-2 [&.active]:border-current py-1">
              Categories
            </Link>
            <span className="text-[var(--rule-light)]">|</span>
            <Link to="/archive" className="hover:underline whitespace-nowrap [&.active]:border-b-2 [&.active]:border-current py-1">
              Archive
            </Link>
            <span className="text-[var(--rule-light)]">|</span>
            <Link to="/about" className="hover:underline whitespace-nowrap [&.active]:border-b-2 [&.active]:border-current py-1">
              About
            </Link>
          </div>
        </nav>
        {children}
        </div>
        <Scripts />
      </body>
    </html>
  )
}
