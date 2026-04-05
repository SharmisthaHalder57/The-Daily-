import { useState, useEffect } from 'react'

interface Clue {
  num: number
  clue: string
  answer: string
}

interface CrosswordData {
  grid: string[][]
  clues: {
    across: Clue[]
    down: Clue[]
  }
}

export default function MiniCrossword() {
  const [data, setData] = useState<CrosswordData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  
  // 3x3 array of user inputs
  const [answers, setAnswers] = useState<string[][]>([
    ['', '', ''],
    ['', '', ''],
    ['', '', '']
  ])
  const [solved, setSolved] = useState(false)

  useEffect(() => {
    fetch('/api/gemini-crossword')
      .then(res => res.json())
      .then(res => {
        setData(res)
        setLoading(false)
      })
      .catch(() => {
        setError(true)
        setLoading(false)
      })
  }, [])

  const handleChange = (r: number, c: number, val: string) => {
    if (solved) return
    const char = val.slice(-1).toUpperCase()
    const newAnswers = [...answers]
    newAnswers[r] = [...newAnswers[r]]
    newAnswers[r][c] = char
    setAnswers(newAnswers)

    // Check win condition
    if (data) {
      let won = true
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          if (newAnswers[i][j] !== data.grid[i][j].toUpperCase()) {
            won = false
          }
        }
      }
      if (won) setSolved(true)
    }
  }

  if (loading) {
    return (
      <div className="border-[3px] border-[var(--rule)] p-4 bg-[var(--newsprint)] h-64 flex items-center justify-center">
        <p className="headline-serif text-[var(--ink-faint)] italic uppercase tracking-widest text-xs font-bold animate-pulse">
          Generating Daily Puzzle...
        </p>
      </div>
    )
  }

  // Also validate inner structure — Gemini may return valid JSON with undefined fields
  if (error || !data || !Array.isArray(data.grid) || !data.clues) return null
  const acrossClues = Array.isArray(data.clues.across) ? data.clues.across : []
  const downClues = Array.isArray(data.clues.down) ? data.clues.down : []

  return (
    <div className="border-[3px] border-[var(--rule)] p-4 bg-[var(--newsprint)] shadow-sm">
      <div className="text-center mb-3">
        <h3 className="headline-serif font-black uppercase tracking-[0.1em] text-lg text-[var(--ink)]">Mini Crossword</h3>
        <p className="text-[10px] body-serif uppercase tracking-widest text-[var(--ink-faint)]">Powered by Gemini AI</p>
        <hr className="rule-thick mt-2" />
      </div>

      <div className="flex flex-col xl:flex-row gap-4 items-center xl:items-start justify-center">
        {/* The Grid */}
        <div className="grid grid-cols-3 gap-0 border-2 border-[var(--ink)] bg-[var(--ink)] w-[150px] shrink-0 mx-auto">
          {data.grid.map((row, r) => (
            (Array.isArray(row) ? row : []).map((_, c) => {
              const num = r === 0 && c === 0 ? 1 : r === 0 && c === 1 ? 2 : r === 0 && c === 2 ? 3 : r === 1 && c === 0 ? 4 : r === 2 && c === 0 ? 5 : null
              return (
                <div key={`${r}-${c}`} className="relative aspect-square bg-[var(--newsprint)]">
                  {num && <span className="absolute top-0.5 left-0.5 text-[8px] font-bold text-[var(--ink)]">{num}</span>}
                  <input
                    type="text"
                    value={answers[r][c]}
                    onChange={(e) => handleChange(r, c, e.target.value)}
                    disabled={solved}
                    className={`w-full h-full text-center text-xl headline-serif font-bold uppercase focus:outline-none focus:bg-[var(--newsprint-dark)] transition-colors ${
                      solved ? 'bg-[#e8f5e9] text-[#2e7d32]' : 'text-[var(--ink)] bg-transparent'
                    }`}
                  />
                </div>
              )
            })
          ))}
        </div>

        {/* Clues */}
        <div className="flex-1 text-xs body-serif space-y-3 pb-2 w-full">
          <div>
            <h4 className="font-bold uppercase tracking-wider border-b border-[var(--rule-light)] mb-1 pb-0.5">Across</h4>
            <ul className="space-y-0.5 mt-1">
              {acrossClues.map((clue, i) => (
                <li key={`a-${i}`}><span className="font-bold">{clue.num}.</span> {clue.clue}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-bold uppercase tracking-wider border-b border-[var(--rule-light)] mb-1 pb-0.5">Down</h4>
            <ul className="space-y-0.5 mt-1">
              {downClues.map((clue, i) => (
                <li key={`d-${i}`}><span className="font-bold">{clue.num}.</span> {clue.clue}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {solved && (
        <div className="mt-3 text-center p-2 border border-[#2e7d32] bg-[#e8f5e9] text-[#2e7d32] font-bold uppercase tracking-widest text-xs">
          Puzzle Solved!
        </div>
      )}
    </div>
  )
}
