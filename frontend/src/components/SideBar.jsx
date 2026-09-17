import React from 'react'
import { Coins, LogOut, Menu, MessageSquare, PanelLeftIcon, PanelRight, PenSquare, Plus, User, X, Shield } from "lucide-react"
import { FaGithub, FaLinkedin } from 'react-icons/fa'
import logo from '../assets/novamind_ai_logo.jpg'
import { useState } from 'react'
import { useEffect } from 'react'
import { getConversations } from '../features/getConversations'
import { useDispatch, useSelector } from 'react-redux'
import { addConversation, setConversations, setSelectedConversation } from '../redux/conversationSlice'
import { createConversation } from '../features/createConversation'
import logOut from '../features/logOut'
import { setUserdata } from '../redux/userSlice'
import BillingDrawer from './BillingDrawer'
import { useNavigate } from 'react-router-dom'

function SideBar() {
    const [collapsed, setCollapsed] = useState(false)
    const dispatch = useDispatch()
    const [imageError, setImageError] = useState(false)
    const { conversations, selectedConversation } = useSelector(state => state.conversation)
    const { userData } = useSelector(state => state.user)
    const [showBilling, setShowBilling] = useState(false)
    const [mobileOpen, setMobileOpen] = useState(false)
    const navigate = useNavigate()
    const isAdmin = userData?.email === import.meta.env.VITE_ADMIN_EMAIL

    useEffect(() => {
        const getConv = async () => {
            const data = await getConversations()
            dispatch(setConversations(data))
        }
        getConv()
    }, [userData?._id])

    /* ── Collapsed rail ─────────────────────────────────────── */
    if (collapsed) {
        return (
            <div className='hidden lg:flex flex-col items-center w-[56px] h-screen shrink-0 py-4 gap-1'
                style={{ background: '#0a0c11', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
                <button
                    className='flex items-center justify-center w-9 h-9 rounded-xl text-slate-500 hover:text-slate-200 hover:bg-white/[0.06] transition-all duration-150 bg-transparent border-none cursor-pointer mb-1'
                    onClick={() => setCollapsed(false)}
                >
                    <PanelRight size={16} />
                </button>
                <button
                    className='flex items-center justify-center w-9 h-9 rounded-xl text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all duration-150 bg-transparent border-none cursor-pointer'
                    onClick={() => dispatch(setSelectedConversation(null))}
                >
                    <Plus size={17} />
                </button>
                <div className='flex-1 overflow-y-auto w-full px-2 pb-2 pt-4 [scrollbar-width:none]'>
                    {conversations.map((conv) => {
                        const isActive = selectedConversation?._id === conv?._id
                        return (
                            <div key={conv._id}
                                onClick={() => dispatch(setSelectedConversation(conv))}
                                className={`flex items-center justify-center w-full mb-1 py-2.5 rounded-[10px] border cursor-pointer transition-all duration-150
                                ${isActive ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-transparent border-transparent hover:bg-white/[0.04]'}`}>
                                <MessageSquare size={13} className={isActive ? 'text-indigo-400' : 'text-slate-600'} />
                            </div>
                        )
                    })}
                </div>
                <div className='px-2'>
                    {(userData?.avatar && !imageError)
                        ? <img className='w-9 h-9 rounded-[10px] object-cover border border-indigo-500/20' src={userData?.avatar} alt="avatar" onError={() => setImageError(true)} />
                        : <div className='w-9 h-9 rounded-[10px] bg-white/[0.05] flex items-center justify-center'><User size={15} className="text-slate-500" /></div>
                    }
                </div>
            </div>
        )
    }

    /* ── Full sidebar ───────────────────────────────────────── */
    return (
        <>
            {/* Mobile hamburger */}
            <button
                className='lg:hidden fixed top-3.5 left-4 z-50 flex items-center justify-center w-8 h-8 rounded-lg border border-white/[0.07] text-slate-400 hover:text-slate-200 transition-colors duration-150 cursor-pointer'
                style={{ background: '#0a0c11' }}
                onClick={() => setMobileOpen(true)}
            >
                <Menu size={14} />
            </button>

            {/* Mobile backdrop */}
            {mobileOpen && (
                <div onClick={() => setMobileOpen(false)}
                    className='lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm' />
            )}

            <div className={`fixed lg:static inset-y-0 left-0 z-50 w-[270px] h-screen shrink-0 flex flex-col
                transition-transform duration-250
                ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
                style={{ background: '#0a0c11', borderRight: '1px solid rgba(255,255,255,0.05)' }}
            >
                {/* ── Header ──────────────────────────────────── */}
                <div className='flex flex-col'
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>

                    {/* Row 1: collapse / close · plan badge · new chat icon */}
                    <div className='flex items-center gap-2 px-4 pt-3.5 pb-2'>
                        <button
                            className='hidden lg:flex items-center justify-center w-7 h-7 rounded-lg text-slate-600 hover:text-slate-300 hover:bg-white/[0.06] transition-all duration-150 bg-transparent border-none cursor-pointer shrink-0'
                            onClick={() => setCollapsed(true)}
                        >
                            <PanelLeftIcon size={15} />
                        </button>
                        <button
                            onClick={() => setMobileOpen(false)}
                            className='lg:hidden flex items-center justify-center w-7 h-7 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/[0.06] transition-all duration-150 bg-transparent border-none cursor-pointer shrink-0'
                        >
                            <X size={15} />
                        </button>
                        <div className='flex-1' />
                        <span className='text-[10px] font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-full tracking-wide uppercase shrink-0'
                            style={{ boxShadow: '0 0 8px rgba(99,102,241,0.15)' }}>
                            {userData?.plan || 'free'}
                        </span>
                        <button
                            className='flex items-center justify-center w-7 h-7 rounded-lg text-slate-600 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all duration-150 bg-transparent border-none cursor-pointer shrink-0'
                            onClick={() => dispatch(setSelectedConversation(null))}>
                            <PenSquare size={13} />
                        </button>
                    </div>

                    {/* Row 2: branding — full width, centered, proper spacing */}
                    <div className='flex flex-col items-center gap-2 px-4 pb-5 pt-2'>
                        {/* Logo */}
                        <img
                            src={logo}
                            alt="NovaMind AI"
                            className='w-16 h-16 object-contain'
                            style={{ mixBlendMode: 'lighten' }}
                        />
                        {/* Name */}
                        <div className='flex flex-col items-center gap-1'>
                            <span className='text-[17px] font-bold tracking-tight leading-tight text-center'
                                style={{
                                    background: 'linear-gradient(90deg, #fff 20%, #818cf8 60%, #22d3ee 100%)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    filter: 'drop-shadow(0 0 8px rgba(129,140,248,0.3))',
                                }}>
                                NovaMind AI
                            </span>
                            <p className='text-[10px] font-bold tracking-[0.18em] uppercase text-center'
                                style={{ color: '#818cf8' }}>
                                Built By Aamir
                            </p>
                        </div>
                        {/* Social links */}
                        <div className='flex items-center gap-3 mt-0.5'>
                            <a href="https://github.com/aamir490" target="_blank" rel="noopener noreferrer"
                                className='flex items-center gap-1.5 text-[12px] font-medium text-slate-500 hover:text-white transition-colors duration-150'>
                                <FaGithub size={13} /><span>GitHub</span>
                            </a>
                            <span className='text-slate-700'>·</span>
                            <a href="https://www.linkedin.com/in/aamir-imran" target="_blank" rel="noopener noreferrer"
                                className='flex items-center gap-1.5 text-[12px] font-medium text-slate-500 hover:text-blue-400 transition-colors duration-150'>
                                <FaLinkedin size={13} /><span>LinkedIn</span>
                            </a>
                        </div>
                    </div>
                </div>

                {/* ── New Chat button ──────────────────────────── */}
                <div className='px-4 pt-4 pb-1'>
                    <button
                        className='w-full flex items-center justify-center gap-2 text-[13px] font-semibold text-white rounded-xl py-[10px] border-none cursor-pointer transition-all duration-200 hover:opacity-90 hover:scale-[1.01]'
                        style={{
                            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                            boxShadow: '0 0 18px rgba(99,102,241,0.35), 0 2px 8px rgba(0,0,0,0.4)',
                        }}
                        onClick={() => dispatch(setSelectedConversation(null))}
                    >
                        <Plus size={15} />
                        New Chat
                    </button>
                </div>

                {/* ── Recents label ────────────────────────────── */}
                <div className='px-5 pt-4 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-700'>
                    {conversations.length === 0 ? '' : 'Recent Chats'}
                </div>

                {/* ── Conversation list / empty state ─────────── */}
                <div className='flex-1 overflow-y-auto px-2.5 pb-2 [scrollbar-width:none]'>

                    {/* Empty state */}
                    {conversations.length === 0 && (
                        <div className='flex flex-col items-center justify-center h-full gap-3 px-4 pb-8'>
                            <div className='flex items-center justify-center w-12 h-12 rounded-2xl'
                                style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}>
                                <MessageSquare size={20} className='text-indigo-500/60' />
                            </div>
                            <div className='flex flex-col items-center gap-1 text-center'>
                                <p className='text-[13px] font-semibold text-slate-400'>No conversations yet</p>
                                <p className='text-[12px] text-slate-600 leading-relaxed'>
                                    Start a new chat to begin exploring NovaMind AI
                                </p>
                            </div>
                            <button
                                onClick={() => dispatch(setSelectedConversation(null))}
                                className='flex items-center gap-1.5 text-[12px] font-semibold px-4 py-2 rounded-xl transition-all duration-150 border-none cursor-pointer'
                                style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)' }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.2)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'rgba(99,102,241,0.12)'}
                            >
                                <Plus size={13} /> Start chatting →
                            </button>
                        </div>
                    )}

                    {conversations?.map((conv) => {
                        const isActive = selectedConversation?._id === conv?._id
                        return (
                            <div key={conv._id}
                                onClick={() => dispatch(setSelectedConversation(conv))}
                                className={`flex items-center gap-2.5 cursor-pointer mb-0.5 px-3 py-2.5 rounded-[10px] border transition-all duration-150
                                ${isActive
                                    ? 'border-indigo-500/20'
                                    : 'bg-transparent border-transparent hover:bg-white/[0.03]'}`}
                                style={isActive ? {
                                    background: 'linear-gradient(90deg, rgba(99,102,241,0.1) 0%, rgba(99,102,241,0.04) 100%)',
                                    boxShadow: 'inset 1px 0 0 rgba(99,102,241,0.4)',
                                } : {}}
                            >
                                <div className={`flex items-center justify-center shrink-0 w-[28px] h-[28px] rounded-lg transition-all duration-150
                                ${isActive ? 'bg-indigo-500/15 text-indigo-400' : 'bg-white/[0.04] text-slate-600'}`}
                                    style={isActive ? { boxShadow: '0 0 8px rgba(99,102,241,0.2)' } : {}}>
                                    <MessageSquare size={13} />
                                </div>
                                <span className={`text-[13px] font-medium truncate transition-colors duration-150
                                ${isActive ? 'text-slate-100' : 'text-slate-400'}`}>
                                    {conv?.title || 'New Chat'}
                                </span>
                            </div>
                        )
                    })}
                </div>

                {/* ── User card ────────────────────────────────── */}
                <div className='mx-3 h-px' style={{ background: 'rgba(255,255,255,0.05)' }} />
                <div className='px-3 py-3'>
                    {userData ? (
                        <div className='flex items-center gap-2.5 rounded-xl px-3 py-2.5 transition-all duration-150 hover:bg-white/[0.04] cursor-pointer'
                            style={{ border: '1px solid rgba(255,255,255,0.04)' }}>
                            {(userData?.avatar && !imageError)
                                ? <img className='w-9 h-9 rounded-[10px] object-cover shrink-0' style={{ border: '1.5px solid rgba(99,102,241,0.3)', boxShadow: '0 0 8px rgba(99,102,241,0.2)' }}
                                    src={userData?.avatar} alt="avatar" onError={() => setImageError(true)} />
                                : <div className='w-9 h-9 rounded-[10px] bg-white/[0.05] flex items-center justify-center shrink-0'>
                                    <User size={15} className="text-slate-400" />
                                </div>
                            }
                            <div className='flex-1 min-w-0'>
                                <p className='text-[13px] font-semibold text-slate-100 truncate'>{userData?.name || 'User'}</p>
                                <p className='text-[11px] text-slate-600 mt-px capitalize'>{userData?.plan || 'free'} plan</p>
                            </div>
                            <div className='flex gap-1'>
                                {isAdmin && (
                                    <button
                                        onClick={() => navigate('/admin')}
                                        title='Admin Panel'
                                        className='flex items-center justify-center w-7 h-7 rounded-[7px] border-none bg-transparent cursor-pointer hover:bg-indigo-500/10 hover:text-indigo-400 transition-all duration-150'
                                        style={{ color: '#818cf8' }}>
                                        <Shield size={15} />
                                    </button>
                                )}
                                <button
                                    onClick={() => setShowBilling(true)}
                                    className='flex items-center justify-center w-7 h-7 rounded-[7px] border-none bg-transparent text-yellow-500/70 cursor-pointer hover:bg-yellow-500/10 hover:text-yellow-400 transition-all duration-150'>
                                    <Coins size={15} />
                                </button>
                                <button
                                    className='flex items-center justify-center w-7 h-7 rounded-[7px] border-none bg-transparent text-slate-600 cursor-pointer hover:bg-red-500/10 hover:text-red-400 transition-all duration-150'
                                    onClick={() => { logOut(); dispatch(setUserdata(null)) }}>
                                    <LogOut size={15} />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button className='w-full flex items-center justify-center gap-2 text-[13px] font-medium text-slate-300 rounded-xl py-[11px] cursor-pointer transition-all duration-150 hover:bg-white/[0.06]'
                            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                            Login
                        </button>
                    )}
                </div>
            </div>

            <BillingDrawer open={showBilling} onClose={() => setShowBilling(false)} />
        </>
    )
}

export default SideBar
