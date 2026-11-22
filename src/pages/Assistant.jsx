import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Mic, MicOff, Send, Sparkles, Volume2, ImagePlus, X, Trash2, Square } from 'lucide-react'
import { useStore } from '../lib/store'
import { ruleAnswer, aiAnswer } from '../lib/assistant'
import { diagnose } from '../lib/knowledge'
import { compressImage } from '../lib/db'
import { PageHeader, Select, useConfirm } from '../components/ui'
import { clsx, uid } from '../lib/utils'

const SUGGEST_OWNER = ['How did Farm A do this month?', 'Top expenses for Farm B', 'Create a monthly report for Farm B', 'Compare my farms', 'Projection to December', 'Which items are low in stock?', 'How do I control fall armyworm?', 'How much should I feed my tilapia?', 'What should I plant after maize?', 'Goat vaccination schedule']
const SUGGEST_WORKER = ['What are my tasks?', 'How do I control fall armyworm?', 'Fertilizer for maize', 'How much should I feed my tilapia?', 'Goat is coughing, what to do?', 'Which items are low in stock?']

export default function Assistant() {
  const { state, user, setChat, online, visibleFarms } = useStore()
  const loc = useLocation()
  const [farmId, setFarmId] = useState(loc.state?.farmId || '')
  const key = user.id
  const [msgs, setMsgs] = useState(() => state.chats[key] || [])
  const [text, setText] = useState('')
  const [img, setImg] = useState(null)
  const [busy, setBusy] = useState(false)
  const [listening, setListening] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const recRef = useRef(null)
  const endRef = useRef(null)
  const fileRef = useRef(null)
  const confirm = useConfirm()
  const useAI = !!state.settings.apiKey && online
  const SR = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)

  useEffect(() => { setChat(key, msgs) }, [msgs]) // eslint-disable-line
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs, busy])

  const ask = async (q) => {
    const question = (q ?? text).trim()
    if (!question && !img) return
    const userMsg = { id: uid(), role: 'user', text: question || '📷 Photo', img }
    const history = [...msgs]
    setMsgs((m) => [...m, userMsg])
    setText('')
    const photo = img
    setImg(null)
    setBusy(true)
    let reply
    try {
      if (useAI) {
        reply = { text: await aiAnswer(state, user, history, question, photo), ai: true }
      } else {
        await new Promise((r) => setTimeout(r, 350))
        if (photo) reply = { text: `📷 Photo check (offline helper):\n\n${diagnose(question)}\n\nTip: add a Claude AI key in Settings to get the photo itself analysed.` }
        else reply = ruleAnswer(state, user, question, farmId)
      }
    } catch (e) {
      const fallback = ruleAnswer(state, user, question, farmId)
      reply = { ...fallback, text: fallback.text + `\n\n(AI not available: ${e.message}. Used the built-in assistant.)` }
    }
    setMsgs((m) => [...m, { id: uid(), role: 'assistant', ...reply }])
    setBusy(false)
  }

  const toggleMic = () => {
    if (!SR) return alertNoVoice()
    if (listening) { recRef.current?.stop(); return }
    const rec = new SR()
    rec.lang = 'en-ZM'
    rec.interimResults = true
    rec.continuous = false
    let final = ''
    rec.onresult = (e) => {
      let interim = ''
      for (const r of e.results) (r.isFinal ? (final = r[0].transcript) : (interim += r[0].transcript))
      setText(final || interim)
    }
    rec.onend = () => { setListening(false); if (final) ask(final) }
    rec.onerror = () => setListening(false)
    recRef.current = rec
    setListening(true)
    rec.start()
  }
  const alertNoVoice = () => setMsgs((m) => [...m, { id: uid(), role: 'assistant', text: 'Voice input is not supported in this browser. Please use Google Chrome on Android, or type your question.' }])

  const speak = (t) => {
    if (!('speechSynthesis' in window)) return
    if (speaking) { speechSynthesis.cancel(); setSpeaking(false); return }
    const u = new SpeechSynthesisUtterance(t.replace(/[•➜📄💡🏆📈🔴🟠📅🟢⚠️📦]/gu, ''))
    u.lang = 'en-GB'
    u.rate = 0.95
    u.onend = () => setSpeaking(false)
    setSpeaking(true)
    speechSynthesis.speak(u)
  }

  const pickImg = async (e) => {
    const f = e.target.files?.[0]
    if (f) setImg(await compressImage(f, 900, 0.7))
    e.target.value = ''
  }
  const clear = async () => {
    if (await confirm({ title: 'Clear chat?', message: 'Delete all messages in this chat?', confirmText: 'Clear' })) setMsgs([])
  }

  const suggestions = user.role === 'owner' ? SUGGEST_OWNER : SUGGEST_WORKER
  return (
    <div className="flex flex-col min-h-[calc(100vh-180px)] lg:min-h-[calc(100vh-120px)]">
      <PageHeader title="Zozo Assistant" subtitle={useAI ? '✨ Smart AI mode (Claude)' : online ? 'Built-in assistant · works offline' : 'Offline mode · built-in assistant'} right={msgs.length > 0 && <button onClick={clear} className="h-11 w-11 rounded-xl bg-white border flex items-center justify-center text-gray-500" aria-label="Clear chat"><Trash2 size={18} /></button>} />
      {visibleFarms.length > 1 && (
        <div className="mb-3"><Select value={farmId} onChange={setFarmId} options={visibleFarms.map((f) => ({ value: f.id, label: 'Talking about: ' + f.name }))} placeholder="Talking about: All farms" /></div>
      )}

      <div className="flex-1 space-y-3 mb-3">
        {msgs.length === 0 && (
          <div className="text-center py-6">
            <div className="mx-auto h-16 w-16 rounded-full bg-earth text-white flex items-center justify-center mb-3"><Sparkles size={32} /></div>
            <h2 className="text-xl font-bold">How can I help you today?</h2>
            <p className="text-gray-500 mb-4">Ask about your farms or any farming question. Tap 🎤 to speak.</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {suggestions.map((s) => <button key={s} onClick={() => ask(s)} className="chip-off hover:bg-farm-pale">{s}</button>)}
            </div>
          </div>
        )}
        {msgs.map((m) => (
          <div key={m.id} className={clsx('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
            <div className={clsx('max-w-[88%] rounded-2xl px-4 py-3 shadow-sm', m.role === 'user' ? 'bg-farm text-white rounded-br-md' : 'bg-white rounded-bl-md')}>
              {m.img && <img src={m.img} alt="" className="rounded-xl mb-2 max-h-48" />}
              <div className="whitespace-pre-line text-[15px] leading-relaxed break-words">{m.text}</div>
              {m.actions?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {m.actions.map((a) => <Link key={a.to} to={a.to} className="btn-light btn-sm">{a.label}</Link>)}
                </div>
              )}
              {m.role === 'assistant' && (
                <button onClick={() => speak(m.text)} className="mt-1 text-xs text-gray-400 flex items-center gap-1" aria-label="Read aloud">
                  {speaking ? <Square size={12} /> : <Volume2 size={14} />} {speaking ? 'Stop' : 'Read aloud'}{m.ai ? ' · AI' : ''}
                </button>
              )}
            </div>
          </div>
        ))}
        {busy && <div className="bg-white rounded-2xl px-4 py-3 w-20 shadow-sm flex gap-1"><span className="dot">●</span><span className="dot" style={{ animationDelay: '.2s' }}>●</span><span className="dot" style={{ animationDelay: '.4s' }}>●</span></div>}
        <div ref={endRef} />
      </div>

      <div className="sticky bottom-20 lg:bottom-4 bg-page pt-2">
        {img && (
          <div className="relative inline-block mb-2">
            <img src={img} alt="" className="h-20 rounded-xl" />
            <button onClick={() => setImg(null)} className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-black/70 text-white flex items-center justify-center" aria-label="Remove photo"><X size={14} /></button>
          </div>
        )}
        <form onSubmit={(e) => { e.preventDefault(); ask() }} className="flex gap-2 items-end">
          <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={pickImg} />
          <button type="button" onClick={() => fileRef.current.click()} className="h-12 w-12 shrink-0 rounded-xl bg-white border flex items-center justify-center text-gray-600" aria-label="Attach photo"><ImagePlus size={22} /></button>
          <input className="input flex-1" value={text} onChange={(e) => setText(e.target.value)} placeholder={listening ? 'Listening...' : 'Type your question...'} />
          <button type="button" onClick={toggleMic} className={clsx('h-12 w-12 shrink-0 rounded-xl flex items-center justify-center', listening ? 'bg-red-600 text-white animate-pulse' : 'bg-white border text-farm')} aria-label="Voice input">{listening ? <MicOff size={22} /> : <Mic size={22} />}</button>
          <button className="h-12 w-12 shrink-0 rounded-xl bg-farm text-white flex items-center justify-center disabled:opacity-50" disabled={busy || (!text.trim() && !img)} aria-label="Send"><Send size={20} /></button>
        </form>
      </div>
    </div>
  )
}
