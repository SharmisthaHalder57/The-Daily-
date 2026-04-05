import { useState, useEffect } from 'react'
import { X, ChevronRight, RotateCcw, CheckCircle2, XCircle } from 'lucide-react'

interface Question {
  question: string
  options: string[]
  correct: number
  explanation: string
}

interface Props {
  title: string
  articleText: string
  language?: string
  onClose: () => void
}

const LETTERS = ['A', 'B', 'C', 'D']

export default function NewsQuiz({ title, articleText, language, onClose }: Props) {
  const [questions, setQuestions] = useState<Question[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Current question index, selected answer, collected answer correctness
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [answers, setAnswers] = useState<boolean[]>([])
  const [finished, setFinished] = useState(false)

  useEffect(() => {
    fetch('/api/quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ articleText, title, language }),
    })
      .then(async (r) => {
        if (!r.ok) {
          const msg = await r.text()
          throw new Error(msg || 'Quiz generation failed')
        }
        return r.json()
      })
      .then((data) => {
        if (!Array.isArray(data.questions)) throw new Error('Unexpected response format')
        setQuestions(data.questions)
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const q = questions?.[current]
  const totalQ = questions?.length ?? 3

  const handleSelect = (idx: number) => {
    if (selected !== null || !q) return
    setSelected(idx)
  }

  const handleNext = () => {
    if (selected === null || !q) return
    const correct = selected === q.correct
    const newAnswers = [...answers, correct]
    setAnswers(newAnswers)

    if (current + 1 >= (questions?.length ?? 0)) {
      setFinished(true)
    } else {
      setCurrent((c) => c + 1)
      setSelected(null)
    }
  }

  const handleRetry = () => {
    setCurrent(0)
    setSelected(null)
    setAnswers([])
    setFinished(false)
  }

  const score = answers.filter(Boolean).length

  return (
    <div className="mt-3 border border-[var(--rule)] bg-[var(--newsprint-dark)] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
      {/* Quiz header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--rule-light)] bg-[var(--newsprint)]">
        <div className="flex items-center gap-2">
          <span className="text-sm">📝</span>
          <span className="headline-serif text-xs font-black uppercase tracking-wider">
            Reader's Quiz
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-[var(--ink-faint)] hover:text-[var(--ink)] transition-colors p-0.5"
          aria-label="Close quiz"
        >
          <X size={13} />
        </button>
      </div>

      <div className="p-4">
        {/* ── Loading ── */}
        {loading && (
          <div className="text-center py-8">
            <p className="text-xs body-serif italic text-[var(--ink-faint)] animate-pulse">
              ⠸ Setting type for your quiz…
            </p>
            <p className="text-[10px] body-serif text-[var(--ink-faint)] mt-1 uppercase tracking-widest">
              Gemini is reading the article
            </p>
          </div>
        )}

        {/* ── Error ── */}
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

        {/* ── Active Question ── */}
        {!loading && !error && questions && !finished && q && (
          <div>
            {/* Progress bar */}
            <div className="flex gap-1 mb-4">
              {questions.map((_, i) => (
                <div
                  key={i}
                  className={`h-0.5 flex-1 transition-all duration-300 ${
                    i < answers.length
                      ? answers[i]
                        ? 'bg-emerald-600'
                        : 'bg-[var(--red-accent)]'
                      : i === current
                        ? 'bg-[var(--ink)]'
                        : 'bg-[var(--rule-light)]'
                  }`}
                />
              ))}
            </div>

            <p className="text-[10px] uppercase tracking-widest body-serif text-[var(--ink-faint)] mb-2 font-bold">
              Question {current + 1} of {totalQ}
            </p>

            <p className="text-sm body-serif font-bold mb-4 leading-snug">{q.question}</p>

            {/* Options */}
            <div className="space-y-2 mb-4">
              {q.options.map((opt, i) => {
                let baseClass =
                  'w-full text-left flex items-start gap-2 border px-3 py-2 text-xs body-serif transition-all duration-150'

                if (selected === null) {
                  baseClass += ' border-[var(--rule-light)] hover:border-[var(--rule)] hover:bg-[var(--newsprint)] cursor-pointer'
                } else if (i === q.correct) {
                  baseClass += ' border-emerald-600 bg-emerald-50 text-emerald-800 font-bold cursor-default'
                } else if (i === selected) {
                  baseClass += ' border-[var(--red-accent)] bg-red-50 text-[var(--red-accent)] cursor-default'
                } else {
                  baseClass += ' border-[var(--rule-light)] opacity-40 cursor-default'
                }

                return (
                  <button
                    key={i}
                    className={baseClass}
                    onClick={() => handleSelect(i)}
                    disabled={selected !== null}
                  >
                    <span className="font-black shrink-0 w-4">{LETTERS[i]}.</span>
                    <span>{opt}</span>
                    {selected !== null && i === q.correct && (
                      <CheckCircle2 size={13} className="ml-auto shrink-0 text-emerald-600 mt-0.5" />
                    )}
                    {selected !== null && i === selected && selected !== q.correct && (
                      <XCircle size={13} className="ml-auto shrink-0 text-[var(--red-accent)] mt-0.5" />
                    )}
                  </button>
                )
              })}
            </div>

            {/* Explanation after answer */}
            {selected !== null && (
              <div
                className={`p-2.5 text-xs body-serif italic mb-4 border-l-2 leading-relaxed ${
                  selected === q.correct
                    ? 'border-emerald-600 bg-emerald-50/50 text-emerald-900'
                    : 'border-[var(--red-accent)] bg-red-50/50 text-red-900'
                }`}
              >
                <span className="font-black not-italic mr-1">
                  {selected === q.correct ? '✓ Correct.' : '✗ Incorrect.'}
                </span>
                {q.explanation}
              </div>
            )}

            {/* Next / Finish button */}
            {selected !== null && (
              <button
                onClick={handleNext}
                className="flex items-center gap-1 bg-[var(--ink)] text-[var(--newsprint)] text-xs font-bold uppercase tracking-widest body-serif px-4 py-1.5 hover:opacity-80 transition-opacity"
              >
                {current + 1 >= (questions?.length ?? 0) ? 'See Results' : 'Next Question'}
                <ChevronRight size={12} />
              </button>
            )}
          </div>
        )}

        {/* ── Final Score ── */}
        {!loading && !error && finished && (
          <div className="text-center py-4">
            <p className="text-4xl mb-2">
              {score === 3 ? '🏆' : score === 2 ? '🎯' : score === 1 ? '📚' : '📖'}
            </p>

            <p className="headline-serif text-3xl font-black mb-1">
              {score}/{answers.length}
            </p>

            <hr className="rule-thin my-3 max-w-[120px] mx-auto" />

            <p className="text-sm body-serif font-bold italic mb-0.5">
              {score === 3
                ? 'Perfect Score!'
                : score === 2
                  ? 'Well Read!'
                  : score === 1
                    ? 'Good Effort'
                    : 'Try Again?'}
            </p>
            <p className="text-xs body-serif text-[var(--ink-faint)] mb-4 italic">
              {score === 3
                ? 'You absorbed every word of this story.'
                : score === 2
                  ? 'A thorough reader — nearly perfect.'
                  : score === 1
                    ? 'You caught some key facts. Read it again?'
                    : 'Give this article another pass before retrying.'}
            </p>

            {/* Per-question result dots */}
            <div className="flex gap-2 justify-center mb-4">
              {answers.map((correct, i) => (
                <div
                  key={i}
                  className={`w-6 h-6 flex items-center justify-center text-[10px] font-black border ${
                    correct
                      ? 'border-emerald-600 text-emerald-700 bg-emerald-50'
                      : 'border-[var(--red-accent)] text-[var(--red-accent)] bg-red-50'
                  }`}
                  title={`Q${i + 1}: ${correct ? 'Correct' : 'Wrong'}`}
                >
                  {correct ? '✓' : '✗'}
                </div>
              ))}
            </div>

            <div className="flex gap-2 justify-center">
              <button
                onClick={handleRetry}
                className="flex items-center gap-1.5 border border-[var(--rule)] text-xs body-serif font-bold uppercase tracking-widest px-4 py-1.5 hover:bg-[var(--newsprint)] transition-colors"
              >
                <RotateCcw size={10} />
                Retry
              </button>
              <button
                onClick={onClose}
                className="flex items-center gap-1.5 bg-[var(--ink)] text-[var(--newsprint)] text-xs font-bold uppercase tracking-widest body-serif px-4 py-1.5 hover:opacity-80 transition-opacity"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
