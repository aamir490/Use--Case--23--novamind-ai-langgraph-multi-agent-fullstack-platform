import { Code2, FileText, Globe, ImageIcon, MessageSquare, Mic, MicOff, Paperclip, Presentation, Send, X, Zap } from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'
import sendMessage from '../features/sendMessage'
import { useDispatch, useSelector } from 'react-redux'
import { addMessage, setArtifacts, setIsLoading, setMessages } from '../redux/messageSlice'
import { createConversation } from '../features/createConversation'
import { addConversation, setConvTitle, setSelectedConversation } from '../redux/conversationSlice'
import { updateConversation } from '../features/updateConversation'

function ChatInput() {
  const [value, setValue] = useState("")
  const [selectedAgent, setSelectedAgent] = useState("Auto")
  const { selectedConversation } = useSelector(state => state.conversation)
  const { messages, isLoading } = useSelector(state => state.message)
  const [selectedFile, setSelectedFile] = useState(null)
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef(null)
  const fileRef = useRef(null)
  const dispatch = useDispatch()

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) return
    const recognition = new SpeechRecognition()
    recognition.lang = "en-US"
    recognition.interimResults = true
    recognition.continuous = true
    recognition.onresult = (event) => {
      let transcript = ""
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript
      }
      setValue(transcript)
    }
    recognition.onend = () => setListening(false)
    recognitionRef.current = recognition
  }, [])

  const toggleMic = () => {
    if (!recognitionRef.current) { alert("Speech recognition not supported"); return }
    if (listening) { recognitionRef.current.stop(); setListening(false) }
    else { recognitionRef.current.start(); setListening(true) }
  }

  const handleSendMessage = async () => {
    dispatch(setIsLoading(true))
    let conversation = selectedConversation
    if (!conversation) {
      dispatch(setMessages([]))
      const conv = await createConversation()
      dispatch(setSelectedConversation(conv))
      dispatch(addConversation(conv))
      conversation = conv
    }
    if (conversation.title === "New Chat") {
      await updateConversation({ id: conversation?._id, title: value.trim() })
      dispatch(setConvTitle({ conversationId: conversation?._id, title: value.slice(0, 40) }))
    }
    const formData = new FormData()
    formData.append("prompt", value.trim())
    formData.append("conversationId", conversation?._id)
    formData.append("agent", selectedAgent.toLowerCase())
    if (selectedFile) formData.append("file", selectedFile)

    dispatch(addMessage({ role: "user", content: value.trim() }))
    setValue("")
    const data = await sendMessage(formData)
    dispatch(setIsLoading(false))
    setSelectedFile(null)
    dispatch(setArtifacts(data.artifacts || []))
    dispatch(addMessage({ role: "assistant", content: data?.answer, images: data?.images }))
  }

  const agents = [
    { id: "auto",    icon: Zap,          label: "Auto"    },
    { id: "chat",    icon: MessageSquare, label: "Chat"    },
    { id: "coding",  icon: Code2,         label: "Coding"  },
    { id: "pdf",     icon: FileText,      label: "PDF"     },
    { id: "ppt",     icon: Presentation,  label: "PPT"     },
    { id: "vision",  icon: ImageIcon,     label: "Vision"  },
    { id: "search",  icon: Globe,         label: "Search"  },
  ]

  const canSend = value.trim() && !isLoading

  return (
    <div className='w-full px-3 md:px-5 py-4 shrink-0'
      style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: '#0a0c11' }}>

      {/* ── Outer glow wrapper ───────────────────────────────── */}
      <div className='flex flex-col gap-0 rounded-2xl transition-all duration-200 input-glow'
        style={{
          background: 'linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}>

        {/* ── Agent pills row ──────────────────────────────────── */}
        <div className='flex items-center gap-1.5 px-4 pt-3.5 pb-2 flex-wrap'>
          {agents.map((agent) => {
            const isActive = selectedAgent === agent.label
            const Icon = agent.icon
            return (
              <button
                key={agent.id}
                onClick={() => setSelectedAgent(agent.label)}
                className='flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-all duration-150 cursor-pointer'
                style={isActive ? {
                  background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                  border: '1px solid transparent',
                  color: '#fff',
                  boxShadow: '0 0 12px rgba(99,102,241,0.4), 0 2px 6px rgba(0,0,0,0.3)',
                } : {
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  color: '#64748b',
                }}
              >
                <Icon size={12} style={{ color: isActive ? '#fff' : '#475569' }} />
                {agent.label}
              </button>
            )
          })}
        </div>

        {/* ── File preview ─────────────────────────────────────── */}
        {selectedFile && (
          <div className='px-4 pb-2'>
            <div className='inline-flex items-center gap-2.5 rounded-xl px-3 py-2'
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              {selectedFile?.type === "application/pdf"
                ? <FileText size={16} className="text-red-400 shrink-0" />
                : selectedFile.type.startsWith("image/") && (
                  <img src={URL.createObjectURL(selectedFile)} className="h-10 w-10 rounded-lg object-cover shrink-0" alt="preview" />
                )}
              <div>
                <p className='text-[12px] font-medium text-slate-200'>{selectedFile?.name}</p>
                <p className='text-[10px] text-slate-600'>{Math.ceil(selectedFile.size / 1024)} KB</p>
              </div>
              <button className='ml-1 flex items-center justify-center w-5 h-5 rounded-full hover:bg-white/[0.08] transition-colors'
                onClick={() => { setSelectedFile(null); fileRef.current.value = "" }}>
                <X size={12} className='text-slate-500 hover:text-slate-300' />
              </button>
            </div>
          </div>
        )}

        {/* ── Textarea ─────────────────────────────────────────── */}
        <textarea
          placeholder='Ask anything...'
          onChange={(e) => setValue(e.target.value)}
          value={value}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && canSend) { e.preventDefault(); handleSendMessage() } }}
          className="w-full bg-transparent outline-none resize-none text-[14px] leading-relaxed [scrollbar-width:none] [&::-webkit-scrollbar]:hidden px-4 pb-2"
          style={{ color: '#e2e8f0', caretColor: '#818cf8' }}
          rows={3}
        />

        {/* ── Bottom action bar ────────────────────────────────── */}
        <div className='flex items-center justify-between px-3 pb-3'>
          <div className='flex items-center gap-1'>
            {/* Attach */}
            <input type="file" accept='.pdf,image/*' hidden ref={fileRef}
              onChange={(e) => { const f = e.target.files[0]; if (f) setSelectedFile(f) }} />
            <button
              onClick={() => fileRef.current.click()}
              className='flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-150 cursor-pointer'
              style={{ background: 'transparent', border: '1px solid transparent', color: '#475569' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#94a3b8' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.color = '#475569' }}
            >
              <Paperclip size={15} />
            </button>

            {/* Mic */}
            <button
              onClick={toggleMic}
              className='flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-150 cursor-pointer'
              style={listening ? {
                background: 'rgba(239,68,68,0.15)',
                border: '1px solid rgba(239,68,68,0.3)',
                color: '#f87171',
                boxShadow: '0 0 10px rgba(239,68,68,0.2)',
              } : {
                background: 'transparent',
                border: '1px solid transparent',
                color: '#475569',
              }}
            >
              {listening ? <Mic size={15} /> : <MicOff size={15} />}
            </button>
          </div>

          {/* Hint */}
          <span className='text-[10px] text-slate-700 hidden md:block'>
            Enter to send · Shift+Enter for new line
          </span>

          {/* Send */}
          <button
            disabled={!canSend}
            onClick={handleSendMessage}
            className='flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 cursor-pointer'
            style={canSend ? {
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              boxShadow: '0 0 14px rgba(99,102,241,0.45)',
              border: 'none',
            } : {
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.06)',
              cursor: 'not-allowed',
            }}
          >
            <Send size={14} style={{ color: canSend ? '#fff' : '#334155' }} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default ChatInput
