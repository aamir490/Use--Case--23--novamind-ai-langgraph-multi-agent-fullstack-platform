import React, { useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'
import MessageBubble from './MessageBubble'
import LoadingAnimation from './LoadingAnimation'
import { FaGithub, FaLinkedin } from 'react-icons/fa'
import logo from '../assets/novamind_ai_logo.jpg'

function MessageList() {
    const { selectedConversation } = useSelector(state => state.conversation)
    const { messages, isLoading } = useSelector(state => state.message)
    const bottomRef = useRef(null)

    useEffect(() => {
        requestAnimationFrame(() => {
            bottomRef?.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
        })
    }, [messages?.length, isLoading])

    const showWelcome = messages.length === 0 || !selectedConversation

    return (
        <div className='flex-1 overflow-y-auto px-6 py-6 space-y-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden relative'>

            {showWelcome ? (
                <div className="h-full flex flex-col items-center justify-center gap-5 text-center relative">

                    {/* ── Ambient orbs ─────────────────────────────── */}
                    <div className='pointer-events-none select-none absolute inset-0 overflow-hidden'>
                        {/* indigo orb top-left */}
                        <div className='orb absolute w-[420px] h-[420px] -top-24 -left-24 opacity-30'
                            style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.4) 0%, transparent 70%)' }} />
                        {/* violet orb bottom-right */}
                        <div className='orb absolute w-[380px] h-[380px] -bottom-20 -right-20 opacity-25'
                            style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.35) 0%, transparent 70%)', animationDelay: '2.5s' }} />
                        {/* cyan orb center */}
                        <div className='orb absolute w-[260px] h-[260px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-10'
                            style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.5) 0%, transparent 70%)', animationDelay: '1.2s' }} />
                    </div>

                    {/* ── Logo + brand ──────────────────────────────── */}
                    <div className='relative flex flex-col items-center gap-3 z-10'>
                        {/* Glow ring behind logo */}
                        <div className='absolute w-[130px] h-[130px] rounded-full opacity-40'
                            style={{
                                background: 'radial-gradient(circle, rgba(99,102,241,0.5) 0%, transparent 70%)',
                                filter: 'blur(18px)',
                                top: '50%', left: '50%',
                                transform: 'translate(-50%, -50%)',
                            }} />
                        <img
                            src={logo}
                            alt="NovaMind AI"
                            className='w-[120px] h-[120px] object-contain relative z-10'
                            style={{ mixBlendMode: 'lighten' }}
                        />

                        {/* Brand name */}
                        <div className='flex flex-col items-center gap-1'>
                            <h1 className='text-[32px] font-bold tracking-tight leading-none'
                                style={{
                                    background: 'linear-gradient(90deg, #fff 20%, #818cf8 60%, #22d3ee 100%)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    textShadow: 'none',
                                    filter: 'drop-shadow(0 0 18px rgba(129,140,248,0.4))',
                                }}>
                                NovaMind AI
                            </h1>
                            <p className='text-[11px] font-bold tracking-[0.2em] uppercase'
                                style={{ color: '#818cf8', textShadow: '0 0 10px rgba(129,140,248,0.5)' }}>
                                Built By Aamir
                            </p>
                        </div>
                    </div>

                    {/* ── Divider ───────────────────────────────────── */}
                    <div className='w-[1px] h-8 z-10'
                        style={{ background: 'linear-gradient(to bottom, transparent, rgba(99,102,241,0.4), transparent)' }} />

                    {/* ── How can I help ────────────────────────────── */}
                    <div className='flex flex-col items-center gap-2 z-10'>
                        <p className='text-[20px] font-semibold text-slate-100 tracking-tight'>
                            How can I help you?
                        </p>
                        <p className='text-[14px] text-slate-500 max-w-[320px] leading-relaxed'>
                            Ask me anything — code, ideas, explanations, or just a quick question.
                        </p>
                    </div>

                    {/* ── Suggestion chips ──────────────────────────── */}
                    <div className='flex flex-wrap justify-center gap-2 z-10'>
                        {['Write a Netflix clone', 'Explain Redis', 'Build a dashboard'].map((s) => (
                            <button key={s}
                                className='text-[12px] font-medium text-slate-400 px-4 py-2 rounded-xl transition-all duration-150 cursor-pointer hover:text-slate-200 hover:scale-[1.03]'
                                style={{
                                    background: 'rgba(255,255,255,0.03)',
                                    border: '1px solid rgba(255,255,255,0.07)',
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.background = 'rgba(99,102,241,0.08)'
                                    e.currentTarget.style.borderColor = 'rgba(99,102,241,0.25)'
                                    e.currentTarget.style.boxShadow = '0 0 10px rgba(99,102,241,0.15)'
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
                                    e.currentTarget.style.boxShadow = 'none'
                                }}
                            >
                                {s}
                            </button>
                        ))}
                    </div>

                    {/* ── Social links ──────────────────────────────── */}
                    <div className='flex items-center gap-4 z-10'>
                        <a href="https://github.com/aamir490" target="_blank" rel="noopener noreferrer"
                            className='flex items-center gap-1.5 text-[12px] font-medium text-slate-500 hover:text-white transition-colors duration-150'>
                            <FaGithub size={15} />
                            <span>GitHub</span>
                        </a>
                        <span className='text-slate-700'>·</span>
                        <a href="https://www.linkedin.com/in/aamir-imran" target="_blank" rel="noopener noreferrer"
                            className='flex items-center gap-1.5 text-[12px] font-medium text-slate-500 hover:text-blue-400 transition-colors duration-150'>
                            <FaLinkedin size={15} />
                            <span>LinkedIn</span>
                        </a>
                    </div>

                </div>

            ) : (
                <div className='space-y-5'>
                    {messages?.map((msg, i) => (
                        <div key={i}>
                            <MessageBubble
                                role={msg?.role}
                                content={msg?.content}
                                images={msg.images || []}
                            />
                        </div>
                    ))}
                    {isLoading && <LoadingAnimation />}
                </div>
            )}

            <div ref={bottomRef} />
        </div>
    )
}

export default MessageList
