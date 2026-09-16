import { Check, Copy, ExternalLink, X } from 'lucide-react'
import React, { useState } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { useSelector } from 'react-redux'
import logo from '../assets/novamind_ai_logo.jpg'

function MessageBubble({ role, content, images }) {
  const isUser = role === 'user'
  const [lightBox, setLightBox] = useState(null)
  const [copiedCode, setCopiedCode] = useState('')
  const { userData } = useSelector(state => state.user)

  const copyCode = async (code) => {
    await navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(''), 2000)
  }

  return (
    <div className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>

      {/* ── Avatar ──────────────────────────────────────────── */}
      {isUser ? (
        /* User avatar */
        <div className='shrink-0 mt-0.5'>
          {userData?.avatar
            ? <img src={userData.avatar} alt="You"
                className='w-8 h-8 rounded-xl object-cover'
                style={{ border: '1.5px solid rgba(99,102,241,0.35)', boxShadow: '0 0 8px rgba(99,102,241,0.2)' }} />
            : <div className='w-8 h-8 rounded-xl flex items-center justify-center text-[12px] font-bold text-white'
                style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', boxShadow: '0 0 8px rgba(99,102,241,0.3)' }}>
                {userData?.name?.[0]?.toUpperCase() || 'U'}
              </div>
          }
        </div>
      ) : (
        /* AI avatar */
        <div className='shrink-0 mt-0.5'>
          <img src={logo} alt="NovaMind AI"
            className='w-8 h-8 rounded-xl object-contain'
            style={{ mixBlendMode: 'normal', background: '#0e1535', border: '1px solid rgba(99,102,241,0.2)', boxShadow: '0 0 10px rgba(99,102,241,0.15)' }} />
        </div>
      )}

      {/* ── Bubble ──────────────────────────────────────────── */}
      <div className={`max-w-[85%] md:max-w-[75%] break-words overflow-hidden leading-relaxed
        ${isUser
          ? 'px-4 py-2.5 rounded-2xl rounded-tr-sm text-white text-[14px]'
          : 'px-4 py-3 rounded-2xl rounded-tl-sm text-slate-200 text-[14px]'
        }`}
        style={isUser ? {
          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
          boxShadow: '0 2px 12px rgba(99,102,241,0.25)',
        } : {
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
        }}
      >

        {/* ── Images ────────────────────────────────────────── */}
        {images?.length > 0 && (
          <div className='flex flex-wrap gap-3 mb-3'>
            {images.map((img, i) => (
              <img key={i} src={img} onClick={() => setLightBox(img)} loading="lazy"
                onError={(e) => e.currentTarget.remove()}
                className="w-40 h-28 rounded-xl object-cover border border-white/10 cursor-zoom-in hover:opacity-90 transition-opacity" />
            ))}
          </div>
        )}

        {/* ── Markdown content ──────────────────────────────── */}
        <Markdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ children }) => <h1 className='text-xl font-bold mt-4 mb-2 text-white'>{children}</h1>,
            h2: ({ children }) => <h2 className='text-lg font-semibold mt-3 mb-2 text-white'>{children}</h2>,
            h3: ({ children }) => <h3 className='text-base font-semibold mt-3 mb-1.5 text-slate-100'>{children}</h3>,
            p:  ({ children }) => <p className='mb-3 last:mb-0 whitespace-pre-wrap break-words'>{children}</p>,
            ul: ({ children }) => <ul className='list-disc pl-5 space-y-1 my-2'>{children}</ul>,
            ol: ({ children }) => <ol className='list-decimal pl-5 space-y-1 my-2'>{children}</ol>,
            li: ({ children }) => <li className='text-slate-300'>{children}</li>,
            blockquote: ({ children }) => (
              <blockquote className='border-l-2 border-indigo-500 pl-3 my-3 text-slate-400 italic'>{children}</blockquote>
            ),
            table: ({ children }) => (
              <div className='overflow-x-auto my-4 rounded-xl' style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                <table className='min-w-full'>{children}</table>
              </div>
            ),
            th: ({ children }) => (
              <th className='px-3 py-2 text-left text-[12px] font-semibold text-slate-300 uppercase tracking-wide'
                style={{ background: 'rgba(99,102,241,0.1)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td className='px-3 py-2 text-[13px] text-slate-300'
                style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                {children}
              </td>
            ),
            a: ({ href, children }) => (
              <a href={href} target="_blank" rel="noreferrer"
                className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2 inline-flex items-center gap-1 transition-colors">
                {children}<ExternalLink size={12} />
              </a>
            ),
            code: ({ className, children }) => {
              const value = String(children).trim()
              if (!className) {
                return (
                  <code className='px-1.5 py-0.5 rounded text-[13px]'
                    style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc' }}>
                    {value}
                  </code>
                )
              }
              const language = className.replace('language-', '')
              const isCopied = copiedCode === value
              return (
                <div className='my-4 overflow-hidden rounded-xl'
                  style={{ border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 4px 16px rgba(0,0,0,0.4)' }}>
                  {/* Code block header */}
                  <div className='flex items-center justify-between px-4 py-2.5'
                    style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    <div className='flex items-center gap-2'>
                      {/* Traffic light dots */}
                      <div className='flex gap-1.5'>
                        <div className='w-2.5 h-2.5 rounded-full bg-red-500/60' />
                        <div className='w-2.5 h-2.5 rounded-full bg-yellow-500/60' />
                        <div className='w-2.5 h-2.5 rounded-full bg-green-500/60' />
                      </div>
                      <span className='text-[11px] font-semibold text-slate-500 uppercase tracking-wider ml-1'>{language}</span>
                    </div>
                    <button
                      onClick={() => copyCode(value)}
                      className='flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-lg transition-all duration-150 cursor-pointer border-none'
                      style={isCopied ? {
                        background: 'rgba(34,197,94,0.15)',
                        color: '#86efac',
                      } : {
                        background: 'rgba(255,255,255,0.05)',
                        color: '#64748b',
                      }}
                    >
                      {isCopied ? <><Check size={13} />Copied</> : <><Copy size={13} />Copy</>}
                    </button>
                  </div>
                  <SyntaxHighlighter
                    language={language}
                    style={oneDark}
                    wrapLongLines
                    showLineNumbers
                    customStyle={{ margin: 0, padding: '16px', background: '#0a0c11', fontSize: '13px' }}
                  >
                    {value}
                  </SyntaxHighlighter>
                </div>
              )
            },
            img: ({ src }) => {
              if (!src) return null
              return (
                <img src={src} onClick={() => setLightBox(src)} loading="lazy"
                  onError={(e) => e.currentTarget.remove()}
                  className="w-40 h-28 rounded-xl object-cover border border-white/10 cursor-zoom-in hover:opacity-90 transition-opacity my-2" />
              )
            },
          }}
        >
          {content}
        </Markdown>
      </div>

      {/* ── Lightbox ────────────────────────────────────────── */}
      {lightBox && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-6'
          style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
          onClick={() => setLightBox(null)}>
          <button
            className='absolute top-5 right-5 flex items-center justify-center w-9 h-9 rounded-full transition-colors'
            style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)' }}
            onClick={() => setLightBox(null)}>
            <X size={16} />
          </button>
          <img src={lightBox} onClick={e => e.stopPropagation()}
            className="max-w-[90vw] max-h-[85vh] rounded-2xl object-contain"
            style={{ border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 24px 64px rgba(0,0,0,0.7)' }} />
        </div>
      )}
    </div>
  )
}

export default MessageBubble
