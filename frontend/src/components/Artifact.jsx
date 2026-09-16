import { Check, Code2, Copy, Eye, PanelRightClose, PanelRightOpen, X } from 'lucide-react'
import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { AnimatePresence, easeInOut, motion } from "motion/react"
import Editor from '@monaco-editor/react'

function Artifact() {
  const [collapsed, setCollapsed] = useState(false)
  const { artifacts } = useSelector(state => state.message)
  const [tab, setTab] = useState("code")
  const [activeFile, setActiveFile] = useState(0)
  const [copied, setCopied] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  if (artifacts.length === 0) return null

  const file     = artifacts[0]?.files[activeFile]
  const htmlFile = artifacts[0]?.files?.find(f => f.name === "index.html")
  const cssFile  = artifacts[0]?.files?.find(f => f.name === "style.css")
  const jsFile   = artifacts[0]?.files?.find(f => f.name === "script.js")
  const canPreview = Boolean(htmlFile)

  const previewDoc = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <style>${cssFile?.content || ""}</style>
</head>
<body>
  ${htmlFile?.content || ""}
  <script>${jsFile?.content || ""}<\/script>
</body>
</html>`

  const handleCopy = async () => {
    await navigator.clipboard.writeText(file?.content || "")
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const detectLanguage = (fileName = "") => {
    const n = fileName.toLowerCase()
    if (n.endsWith(".html"))  return "html"
    if (n.endsWith(".css"))   return "css"
    if (n.endsWith(".js") || n.endsWith(".jsx")) return "javascript"
    if (n.endsWith(".ts") || n.endsWith(".tsx")) return "typescript"
    if (n.endsWith(".json"))  return "json"
    if (n.endsWith(".py"))    return "python"
    if (n.endsWith(".java"))  return "java"
    if (n.endsWith(".cpp"))   return "cpp"
    if (n.endsWith(".c"))     return "c"
    return "plaintext"
  }

  const PanelContent = ({ onClose }) => (
    <>
      {!collapsed ? (
        <div className='flex flex-col h-full' style={{ background: '#0a0c11' }}>

          {/* ── Header bar ──────────────────────────────────── */}
          <div className='h-14 px-4 flex items-center gap-3 shrink-0'
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'linear-gradient(90deg,#0a0c11,#0d0f16)' }}>

            {/* Close / collapse */}
            <button
              className='flex items-center justify-center w-7 h-7 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/[0.06] transition-all duration-150 bg-transparent border-none cursor-pointer shrink-0'
              onClick={onClose ?? (() => setCollapsed(true))}>
              {onClose ? <X size={15} /> : <PanelRightClose size={15} />}
            </button>

            {/* Title */}
            <div className='flex items-center gap-2 flex-1 min-w-0'>
              <div className='flex items-center justify-center w-6 h-6 rounded-md shrink-0'
                style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.22)', boxShadow: '0 0 8px rgba(99,102,241,0.15)' }}>
                <Code2 className="text-indigo-400" size={12} />
              </div>
              <span className='text-[13px] font-semibold text-slate-200 truncate'>{artifacts[0]?.title}</span>
            </div>

            {/* Copy button */}
            <motion.button
              onClick={handleCopy}
              whileTap={{ scale: 0.88 }}
              className='flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium rounded-lg transition-all duration-150 border-none cursor-pointer shrink-0'
              style={copied ? {
                background: 'rgba(34,197,94,0.12)',
                color: '#86efac',
              } : {
                background: 'rgba(255,255,255,0.04)',
                color: '#64748b',
              }}
            >
              {copied ? <><Check size={13} />Copied</> : <><Copy size={13} />Copy</>}
            </motion.button>

            {/* Code / Preview tab switcher */}
            {canPreview && (
              <div className='flex items-center gap-1 p-1 rounded-lg shrink-0'
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <button
                  onClick={() => setTab("code")}
                  className='flex items-center gap-1.5 px-3 py-1 text-[11px] font-semibold rounded-md transition-all duration-150 border-none cursor-pointer'
                  style={tab === "code" ? {
                    background: 'linear-gradient(135deg,#4f46e5,#7c3aed)',
                    color: '#fff',
                    boxShadow: '0 0 10px rgba(99,102,241,0.35)',
                  } : { background: 'transparent', color: '#64748b' }}
                >
                  <Code2 size={11} />Code
                </button>
                <button
                  onClick={() => setTab("preview")}
                  className='flex items-center gap-1.5 px-3 py-1 text-[11px] font-semibold rounded-md transition-all duration-150 border-none cursor-pointer'
                  style={tab === "preview" ? {
                    background: 'linear-gradient(135deg,#4f46e5,#7c3aed)',
                    color: '#fff',
                    boxShadow: '0 0 10px rgba(99,102,241,0.35)',
                  } : { background: 'transparent', color: '#64748b' }}
                >
                  <Eye size={11} />Preview
                </button>
              </div>
            )}
          </div>

          {/* ── File tabs ────────────────────────────────────── */}
          {tab === "code" && (
            <div className='flex h-auto overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden shrink-0'
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {artifacts[0]?.files?.map((f, index) => (
                <button key={index}
                  onClick={() => setActiveFile(index)}
                  className='relative px-4 py-2.5 text-[11px] font-medium whitespace-nowrap transition-colors duration-150 cursor-pointer bg-transparent border-none'
                  style={{
                    color: activeFile === index ? '#818cf8' : '#475569',
                    borderRight: '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  {f?.name}
                  {activeFile === index && (
                    <div className='absolute bottom-0 left-0 right-0 h-[2px] rounded-t-full'
                      style={{ background: 'linear-gradient(90deg,#4f46e5,#7c3aed)' }} />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* ── Content area ─────────────────────────────────── */}
          <div className='flex-1 overflow-hidden'>
            <AnimatePresence mode="wait">
              {tab === "preview" && canPreview ? (
                <motion.div key="preview"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }} className='w-full h-full'>
                  <iframe title='preview' srcDoc={previewDoc} sandbox='allow-scripts' className='w-full h-full bg-white' />
                </motion.div>
              ) : (
                <motion.div key={`code-${activeFile}`}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }} className='w-full h-full'>
                  <Editor
                    theme='vs-dark'
                    language={detectLanguage(file?.name)}
                    value={file?.content}
                    options={{
                      readOnly: true,
                      minimap: { enabled: false },
                      fontSize: 13,
                      wordWrap: "on",
                      automaticLayout: true,
                      scrollBeyondLastLine: false,
                      padding: { top: 16 },
                      lineNumbers: "on",
                      renderLineHighlight: "none",
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      ) : (
        /* ── Collapsed rail ──────────────────────────────── */
        <div className='hidden lg:flex h-full flex-col items-center py-4 gap-3 shrink-0'
          style={{ borderLeft: '1px solid rgba(255,255,255,0.06)', background: '#0a0c11' }}>
          <button
            className='flex items-center justify-center w-7 h-7 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/[0.06] transition-colors duration-150 bg-transparent border-none cursor-pointer shrink-0'
            onClick={() => setCollapsed(false)}>
            <PanelRightOpen size={15} />
          </button>
          <div className='flex items-center gap-2 flex-1 min-w-0'>
            <span className='text-[10px] font-medium text-slate-600 tracking-widest uppercase whitespace-nowrap'
              style={{ writingMode: 'vertical-lr', transform: 'rotate(180deg)' }}>
              {artifacts[0]?.title}
            </span>
          </div>
        </div>
      )}
    </>
  )

  return (
    <>
      {/* Mobile trigger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed bottom-20 right-4 z-40 flex items-center gap-2 px-3.5 py-2 rounded-xl text-white text-[12px] font-semibold border-none cursor-pointer transition-all duration-150"
        style={{
          background: 'linear-gradient(135deg,#4f46e5,#7c3aed)',
          boxShadow: '0 4px 16px rgba(99,102,241,0.4)',
        }}
      >
        <Code2 size={13} />View Code
      </button>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileOpen(false)}
              className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="lg:hidden fixed inset-y-0 right-0 z-50 w-[88vw] max-w-[420px] overflow-hidden"
              style={{ borderLeft: '1px solid rgba(255,255,255,0.06)' }}>
              <PanelContent onClose={() => setMobileOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop panel */}
      <motion.div
        initial={{ width: 400 }}
        animate={{ width: collapsed ? 48 : 400 }}
        transition={{ duration: 0.25, ease: easeInOut }}
        className='hidden lg:flex h-full flex-col overflow-hidden shrink-0'
        style={{ borderLeft: '1px solid rgba(255,255,255,0.06)' }}
      >
        <PanelContent />
      </motion.div>
    </>
  )
}

export default Artifact
