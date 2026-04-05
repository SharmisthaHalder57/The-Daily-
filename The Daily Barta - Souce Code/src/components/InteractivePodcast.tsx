import { useState, useRef, useEffect } from 'react'
import { Play, Square, Mic, Send, MessageSquare, BookOpen, CheckCircle, XCircle } from 'lucide-react'
import type { NewsArticle } from '@/types/news'

interface Props {
  article: NewsArticle
  onClose: () => void
}

interface Message {
  role: 'user' | 'ai'
  content: string
}

interface QuizQuestion {
  question: string
  options: string[]
  correct: number
  explanation: string
}

export default function InteractivePodcast({ article, onClose }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [loading, setLoading] = useState(false)
  const [quizMode, setQuizMode] = useState(false)
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([])
  const [quizLoading, setQuizLoading] = useState(false)
  const [currentQIndex, setCurrentQIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Initialization: start by fetching a summary
  useEffect(() => {
    handleSend('Summarize this article for me.')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const speakText = async (text: string) => {
    // Stop any current audio
    if (audioRef.current) {
      audioRef.current.pause()
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }

    try {
      const resp = await fetch('/api/elevenlabs-tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      if (!resp.ok) throw new Error('ElevenLabs failed')

      const blob = await resp.blob()
      const url = URL.createObjectURL(blob)
      setAudioUrl(url)

      const audio = new Audio(url)
      audioRef.current = audio
      await audio.play()
    } catch (err) {
      console.warn('ElevenLabs failed, using browser fallback', err)
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text)
        if (/[\u0980-\u09FF]/.test(text)) {
          utterance.lang = 'bn-IN'
        }
        window.speechSynthesis.speak(utterance)
      }
    }
  }

  const stopAudio = () => {
    if (audioRef.current) audioRef.current.pause()
    if ('speechSynthesis' in window) window.speechSynthesis.cancel()
  }

  const handleSend = async (textOverride?: string) => {
    const text = textOverride ?? inputText
    if (!text.trim()) return

    const newMessages: Message[] = [...messages, { role: 'user', content: text }]
    setMessages(newMessages)
    if (!textOverride) setInputText('')
    setLoading(true)

    try {
      const resp = await fetch('/api/article-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleText: article.fullArticle,
          title: article.title,
          language: /[\u0980-\u09FF]/.test(article.fullArticle ?? '') ? 'bn-IN' : 'en-US',
          messages: newMessages.slice(-5) // Send last 5 for context
        }),
      })

      if (!resp.ok) throw new Error('Failed to generate response')
      const data = await resp.json()
      
      setMessages([...newMessages, { role: 'ai', content: data.reply }])
      speakText(data.reply)

    } catch (err) {
      console.error(err)
      setMessages([...newMessages, { role: 'ai', content: 'Oops... I ran into an error generating my response.' }])
    } finally {
      setLoading(false)
    }
  }

  const handleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert("Voice input is not supported in this browser.")
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = /[\u0980-\u09FF]/.test(article.fullArticle ?? '') ? 'bn-IN' : 'en-US'
    recognition.start()

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      setInputText(transcript)
    }
  }

  const loadQuiz = async () => {
    stopAudio()
    setQuizLoading(true)
    setQuizMode(true)
    try {
      const resp = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleText: article.fullArticle,
          title: article.title,
          language: /[\u0980-\u09FF]/.test(article.fullArticle ?? '') ? 'bn-IN' : 'en-US'
        }),
      })
      if (!resp.ok) throw new Error('Failed to generate quiz')
      const data = await resp.json()
      setQuizQuestions(data.questions)
      setCurrentQIndex(0)
      setSelectedAnswer(null)
    } catch(err) {
      console.error(err)
      alert("Failed to create quiz")
    } finally {
      setQuizLoading(false)
    }
  }

  return (
    <div className="bg-[var(--newsprint)] border border-[var(--ink)] mt-2 shadow-xl p-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold body-serif text-lg">🧠 Editorial Assistant</h3>
        <button onClick={() => { stopAudio(); onClose() }} className="text-[var(--ink-faint)] hover:text-red-500">✕ Close</button>
      </div>

      <div className="flex gap-2 mb-3">
        <button 
          onClick={() => setQuizMode(false)}
          className={`px-3 py-1 text-xs border ${!quizMode ? 'bg-[var(--ink)] text-[var(--newsprint)]' : 'border-[var(--rule)]'}`}
        >
          <MessageSquare size={12} className="inline mr-1" /> Discussion
        </button>
        <button 
          onClick={loadQuiz}
          className={`px-3 py-1 text-xs border ${quizMode ? 'bg-[var(--ink)] text-[var(--newsprint)]' : 'border-[var(--rule)]'}`}
        >
          <BookOpen size={12} className="inline mr-1" /> Fact Check
        </button>
      </div>

      <hr className="rule-thin mb-3" />

      {!quizMode ? (
        <div className="flex flex-col h-[300px]">
          <div className="flex-1 overflow-y-auto space-y-4 pr-2 text-sm body-serif mb-2 scrollbar-thin">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`p-2 max-w-[80%] border ${m.role === 'user' ? 'bg-[var(--ink)] text-[var(--newsprint)]' : 'bg-white/50 border-[var(--rule-light)]'}`}>
                  <strong>{m.role === 'user' ? 'You' : 'Assistant'}:</strong>
                  <p className="mt-1">{m.content}</p>
                </div>
              </div>
            ))}
            {loading && <div className="text-xs text-center text-gray-500">Assistant is thinking...</div>}
          </div>

          <div className="flex items-center gap-2 mt-auto">
             <button onClick={stopAudio} className="p-2 border hover:bg-gray-200" title="Stop Audio">
               <Square size={16} />
             </button>
             <button onClick={handleVoiceInput} className="p-2 border hover:bg-red-100" title="Voice Input">
               <Mic size={16} className="text-red-600" />
             </button>
             <input 
                type="text" 
                className="flex-1 border p-2 text-sm bg-transparent"
                placeholder="Ask a question..."
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
             />
             <button onClick={() => handleSend()} className="p-2 border bg-[var(--ink)] text-white hover:bg-gray-800">
               <Send size={16} />
             </button>
          </div>
        </div>
      ) : (
        <div className="min-h-[300px]">
          {quizLoading ? (
             <div className="flex items-center justify-center p-10 text-sm">Generating Quiz...</div>
          ) : quizQuestions.length > 0 ? (
             <div className="space-y-4 relative">
                <div className="text-xs font-bold tracking-widest uppercase mb-1">
                  Question {currentQIndex + 1} of {quizQuestions.length}
                </div>
                <p className="font-bold text-[var(--ink)]">{quizQuestions[currentQIndex].question}</p>
                
                <div className="space-y-2">
                  {quizQuestions[currentQIndex].options.map((opt, idx) => {
                    const isSelected = selectedAnswer === idx;
                    const isCorrect = quizQuestions[currentQIndex].correct === idx;
                    let style = 'border-[var(--rule-light)] hover:border-[var(--ink)]';
                    
                    if (selectedAnswer !== null) {
                      if (isCorrect) style = 'border-green-500 bg-green-50 text-green-800 font-bold';
                      else if (isSelected) style = 'border-red-500 bg-red-50 text-red-800';
                    }

                    return (
                      <button 
                        key={idx}
                        disabled={selectedAnswer !== null}
                        onClick={() => setSelectedAnswer(idx)}
                        className={`w-full text-left p-3 border text-sm body-serif transition-colors ${style}`}
                      >
                        {opt}
                        {selectedAnswer !== null && isCorrect && <CheckCircle size={14} className="inline float-right text-green-600" />}
                        {selectedAnswer !== null && isSelected && !isCorrect && <XCircle size={14} className="inline float-right text-red-600" />}
                      </button>
                    )
                  })}
                </div>

                {selectedAnswer !== null && (
                  <div className="mt-3 p-3 bg-[var(--newsprint-dark)] text-sm italic border-l-2 border-[var(--ink)]">
                    {quizQuestions[currentQIndex].explanation}
                  </div>
                )}

                <div className="flex justify-end pt-3">
                   {selectedAnswer !== null && currentQIndex < quizQuestions.length - 1 && (
                     <button 
                       onClick={() => { setSelectedAnswer(null); setCurrentQIndex(curr => curr + 1) }}
                       className="px-4 py-2 bg-[var(--ink)] text-white text-sm"
                     >
                       Next Question →
                     </button>
                   )}
                   {selectedAnswer !== null && currentQIndex === quizQuestions.length - 1 && (
                     <button 
                       onClick={() => setQuizMode(false)}
                       className="px-4 py-2 bg-[var(--red-accent)] text-white text-sm"
                     >
                       Finish Audit
                     </button>
                   )}
                </div>
             </div>
          ) : (
             <div className="text-center p-10 text-sm">Failed to load quiz.</div>
          )}
        </div>
      )}
    </div>
  )
}
