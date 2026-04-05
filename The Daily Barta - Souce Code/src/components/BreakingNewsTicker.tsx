interface Props {
  headlines: string[]
}

export default function BreakingNewsTicker({ headlines }: Props) {
  if (headlines.length === 0) return null

  // Triple headlines so the scroll never looks empty
  const repeated = [...headlines, ...headlines, ...headlines]

  return (
    <div
      className="top-0 left-0 right-0 z-50 bg-[var(--breaking-bg)] text-white overflow-hidden py-1.5 shadow-md"
      role="marquee"
      aria-label="Breaking news ticker"
    >
      <div className="flex items-center">
        {/* LIVE label with pulsing dot */}
        <span className="shrink-0 flex items-center gap-1.5 bg-white text-[var(--red-accent)] font-black uppercase text-[11px] tracking-widest px-3 py-0.5 mx-2 body-serif">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--red-accent)] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--red-accent)]" />
          </span>
          Breaking
        </span>

        {/* Scrolling headlines */}
        <div className="overflow-hidden flex-1 relative">
          <p className="ticker-content body-serif text-sm font-medium whitespace-nowrap">
            {repeated.map((h, i) => (
              <span key={i}>
                {h}
                <span className="mx-4 opacity-50">◆</span>
              </span>
            ))}
          </p>
        </div>
      </div>
    </div>
  )
}
