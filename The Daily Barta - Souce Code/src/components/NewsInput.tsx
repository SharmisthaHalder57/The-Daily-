import { useState, useRef } from 'react'
import { Mic, MicOff, Newspaper, Paperclip, X } from 'lucide-react'

interface Props {
  onSubmit: (text: string, imageBase64?: string, language?: string) => void
  loading: boolean
}

export default function NewsInput({ onSubmit, loading }: Props) {
  const [text, setText] = useState('')
  const [recording, setRecording] = useState(false)
  const [lang, setLang] = useState<'en-US' | 'bn-IN'>('en-US')
  const [attachedImage, setAttachedImage] = useState<File | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if ((!text.trim() && !attachedImage) || loading) return
    let payload = text.trim() || 'Photo story'
    
    if (attachedImage) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64data = reader.result as string
        // We'll pass text, image, and language
        onSubmit(payload, base64data, lang)
        setText('')
        setAttachedImage(null)
      }
      reader.readAsDataURL(attachedImage)
    } else {
      onSubmit(payload, undefined, lang)
      setText('')
      setAttachedImage(null)
    }
  }

  const toggleRecording = async () => {
    if (recording) {
      ;(mediaRecorderRef.current as any)?._recognition?.stop()
      mediaRecorderRef.current?.stop()
      setRecording(false)
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      mediaRecorderRef.current = mr
      mr.onstop = () => stream.getTracks().forEach((t) => t.stop())
      mr.start()
      setRecording(true)

      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition()
        recognition.continuous = true
        recognition.interimResults = false
        recognition.lang = lang
        recognition.onresult = (event: any) => {
          let transcript = ''
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) transcript += event.results[i][0].transcript + ' '
          }
          if (transcript) setText((prev) => prev + transcript)
        }
        recognition.start()
        ;(mr as any)._recognition = recognition
      }
    } catch {
      alert('Microphone access denied or not available.')
    }
  }

  return (
    <div className="input-section rounded-sm p-6 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Newspaper size={18} />
        <h2 className="headline-serif text-base font-bold uppercase tracking-wider">
          Submit a News Story
        </h2>
      </div>
      <hr className="rule-thick mb-4" />
      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste raw news text here — wire reports, social media posts, press releases, or dictate via microphone…"
          className="w-full h-36 resize-none border border-[var(--rule-light)] bg-white/80 text-[var(--ink)] p-3 text-sm body-serif focus:outline-none focus:border-[var(--rule)] placeholder-[var(--ink-faint)]"
          disabled={loading}
        />
        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={(!text.trim() && !attachedImage) || loading}
            className="flex-1 bg-[var(--ink)] text-[var(--newsprint)] font-bold uppercase tracking-widest text-xs py-2.5 px-4 body-serif hover:bg-[var(--ink-light)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '⠸ Setting Type…' : '⬡ Send to Press'}
          </button>
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value as any)}
            className="px-2 py-2.5 bg-transparent border border-[var(--rule-light)] hover:border-[var(--rule)] text-[var(--ink)] body-serif text-xs uppercase tracking-widest font-bold transition-colors cursor-pointer outline-none"
            title="Select Language"
          >
            <option value="en-US">English</option>
            <option value="bn-IN">বাংলা</option>
          </select>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2.5 border border-[var(--rule-light)] hover:border-[var(--rule)] text-[var(--ink)] body-serif text-xs uppercase tracking-widest font-bold transition-colors flex items-center justify-center gap-2"
            title="Attach a picture"
          >
            <Paperclip size={16} />
            <span className="hidden sm:inline">Attach Files</span>
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                setAttachedImage(e.target.files[0])
              }
            }}
            accept="image/*" 
            className="hidden" 
          />
          <button
            type="button"
            onClick={toggleRecording}
            className={`px-4 py-2.5 border body-serif text-xs uppercase tracking-widest font-bold transition-colors ${
              recording
                ? 'border-[var(--red-accent)] text-[var(--red-accent)] animate-pulse'
                : 'border-[var(--rule-light)] hover:border-[var(--rule)]'
            }`}
            title={recording ? 'Stop recording' : 'Start voice input'}
          >
            {recording ? <MicOff size={16} /> : <Mic size={16} />}
          </button>
        </div>
        {attachedImage && (
          <div className="flex items-center justify-between bg-[var(--newsprint-dark)] p-2 text-xs body-serif border border-[var(--rule-light)] text-[var(--ink)]">
            <span className="truncate font-bold italic">📎 {attachedImage.name} attached</span>
            <button type="button" onClick={() => setAttachedImage(null)} className="text-[var(--red-accent)] hover:opacity-75" title="Remove attachment">
              <X size={14} />
            </button>
          </div>
        )}
        {recording && (
          <p className="text-[var(--red-accent)] text-xs body-serif italic animate-pulse">
            🔴 Recording… speak your news story, then click stop.
          </p>
        )}
      </form>
    </div>
  )
}
