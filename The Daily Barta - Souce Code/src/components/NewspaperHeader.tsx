import WeatherWidget from './WeatherWidget'

interface Props {
  date: string
  edition: string
}

export default function NewspaperHeader({ date, edition }: Props) {
  return (
    <header className="px-4 pt-6 pb-2 max-w-7xl mx-auto">
      {/* Top rule */}
      <div className="border-t-4 border-[var(--rule)] mb-1" />
      <div className="border-t border-[var(--rule)] mb-4" />

      {/* Masthead */}
      <div className="text-center mb-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] body-serif text-[var(--ink-faint)] mb-1">
          Est. 2025 &nbsp;◆&nbsp; AI-Powered &nbsp;◆&nbsp; Hackathon Edition
        </p>
        <h1 className="masthead-title text-5xl md:text-7xl lg:text-8xl font-bold text-[var(--ink)] leading-none tracking-tight">
          The Daily বার্তা
        </h1>
        <p className="text-sm md:text-base body-serif italic text-[var(--ink-faint)] mt-1 tracking-wide">
          আজকের খবর, আপনার ভাষায়
        </p>
        <p className="text-[10px] uppercase tracking-[0.2em] body-serif text-[var(--ink-faint)] mt-1">
          "All the News That's Fit to Digitize"
        </p>
      </div>

      {/* Info bar — date | weather | edition */}
      <div className="border-t border-b border-[var(--rule)] py-1 flex flex-col sm:flex-row items-center justify-between gap-1 text-[10px] font-bold uppercase tracking-widest body-serif text-[var(--ink-faint)]">
        <span>{date}</span>
        <WeatherWidget />
        <span>{edition}</span>
      </div>
    </header>
  )
}
