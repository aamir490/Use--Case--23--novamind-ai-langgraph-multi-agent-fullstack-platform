import React, { useEffect, useState, useCallback } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
    Users, CreditCard, MessageSquare, TrendingUp,
    Search, ChevronLeft, ChevronRight, Trash2,
    Edit2, Check, X, ArrowLeft, RefreshCw,
    Crown, Zap, Shield, Activity, IndianRupee
} from 'lucide-react'
import {
    fetchAdminStats, fetchAdminUsers,
    updateAdminUser, deleteAdminUser, fetchAdminPayments
} from '../features/admin'

// ── Stat card ─────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, sub, color }) => (
    <div className='flex flex-col gap-3 p-5 rounded-2xl'
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className='flex items-center justify-between'>
            <span className='text-[12px] font-semibold uppercase tracking-widest text-slate-500'>{label}</span>
            <div className='flex items-center justify-center w-8 h-8 rounded-xl'
                style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
                <Icon size={15} style={{ color }} />
            </div>
        </div>
        <div>
            <p className='text-[28px] font-bold text-white leading-none'>{value}</p>
            {sub && <p className='text-[12px] text-slate-500 mt-1'>{sub}</p>}
        </div>
    </div>
)

// ── Plan badge ────────────────────────────────────────────────
const PlanBadge = ({ plan }) => {
    const styles = {
        free:    { bg: 'rgba(100,116,139,0.15)', border: 'rgba(100,116,139,0.3)', color: '#94a3b8' },
        starter: { bg: 'rgba(99,102,241,0.15)',  border: 'rgba(99,102,241,0.3)',  color: '#818cf8' },
        pro:     { bg: 'rgba(234,179,8,0.15)',   border: 'rgba(234,179,8,0.3)',   color: '#facc15' },
    }
    const s = styles[plan] || styles.free
    return (
        <span className='text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide'
            style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color }}>
            {plan}
        </span>
    )
}

// ── Status badge ──────────────────────────────────────────────
const StatusBadge = ({ status }) => {
    const styles = {
        paid:    { bg: 'rgba(34,197,94,0.12)',  border: 'rgba(34,197,94,0.3)',  color: '#86efac' },
        created: { bg: 'rgba(234,179,8,0.12)',  border: 'rgba(234,179,8,0.3)',  color: '#fde68a' },
        failed:  { bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.3)',  color: '#fca5a5' },
    }
    const s = styles[status] || styles.created
    return (
        <span className='text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide'
            style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color }}>
            {status}
        </span>
    )
}

// ── Main AdminPage ────────────────────────────────────────────
function AdminPage() {
    const { userData } = useSelector(state => state.user)
    const navigate = useNavigate()

    const [tab, setTab]           = useState('overview')
    const [stats, setStats]       = useState(null)
    const [users, setUsers]       = useState([])
    const [payments, setPayments] = useState([])
    const [loading, setLoading]   = useState(false)

    // Users state
    const [userTotal, setUserTotal]     = useState(0)
    const [userPage, setUserPage]       = useState(1)
    const [userPages, setUserPages]     = useState(1)
    const [userSearch, setUserSearch]   = useState('')
    const [userPlan, setUserPlan]       = useState('all')
    const [editingUser, setEditingUser] = useState(null)
    const [editValues, setEditValues]   = useState({})
    const [confirmDelete, setConfirmDelete] = useState(null)

    // Payments state
    const [payTotal, setPayTotal]   = useState(0)
    const [payPage, setPayPage]     = useState(1)
    const [payPages, setPayPages]   = useState(1)
    const [payStatus, setPayStatus] = useState('all')

    // ── redirect non-admins ───────────────────────────────────
    useEffect(() => {
        if (userData && userData.email !== import.meta.env.VITE_ADMIN_EMAIL) {
            navigate('/')
        }
    }, [userData])

    // ── load stats ────────────────────────────────────────────
    const loadStats = useCallback(async () => {
        setLoading(true)
        const data = await fetchAdminStats()
        setStats(data)
        setLoading(false)
    }, [])

    // ── load users ────────────────────────────────────────────
    const loadUsers = useCallback(async () => {
        setLoading(true)
        const data = await fetchAdminUsers({
            page: userPage, limit: 15,
            search: userSearch || undefined,
            plan: userPlan !== 'all' ? userPlan : undefined
        })
        if (data) {
            setUsers(data.users)
            setUserTotal(data.total)
            setUserPages(data.totalPages)
        }
        setLoading(false)
    }, [userPage, userSearch, userPlan])

    // ── load payments ─────────────────────────────────────────
    const loadPayments = useCallback(async () => {
        setLoading(true)
        const data = await fetchAdminPayments({
            page: payPage, limit: 15,
            status: payStatus !== 'all' ? payStatus : undefined
        })
        if (data) {
            setPayments(data.payments)
            setPayTotal(data.total)
            setPayPages(data.totalPages)
        }
        setLoading(false)
    }, [payPage, payStatus])

    useEffect(() => { if (tab === 'overview' && userData) loadStats()  }, [tab, userData])
    useEffect(() => { if (tab === 'users'    && userData) loadUsers()  }, [tab, userData, userPage, userSearch, userPlan])
    useEffect(() => { if (tab === 'payments' && userData) loadPayments() }, [tab, userData, payPage, payStatus])

    // ── handlers ──────────────────────────────────────────────
    const handleUpdateUser = async (id) => {
        await updateAdminUser(id, editValues)
        setEditingUser(null)
        loadUsers()
    }

    const handleDeleteUser = async (id) => {
        await deleteAdminUser(id)
        setConfirmDelete(null)
        loadUsers()
    }

    const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
    const fmtCurrency = (n) => `₹${(n || 0).toLocaleString('en-IN')}`

    // ── nav tabs ──────────────────────────────────────────────
    const tabs = [
        { id: 'overview', label: 'Overview',  icon: Activity },
        { id: 'users',    label: 'Users',     icon: Users },
        { id: 'payments', label: 'Payments',  icon: CreditCard },
    ]

    return (
        <div className='min-h-screen text-white' style={{ background: '#0a0c11' }}>

            {/* ── Top bar ──────────────────────────────────── */}
            <div className='flex items-center gap-4 px-6 py-4 sticky top-0 z-30'
                style={{ background: 'rgba(10,12,17,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <button onClick={() => navigate('/')}
                    className='flex items-center justify-center w-8 h-8 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/[0.06] transition-all cursor-pointer border-none bg-transparent'>
                    <ArrowLeft size={16} />
                </button>
                <div className='flex items-center gap-2.5'>
                    <div className='flex items-center justify-center w-8 h-8 rounded-xl'
                        style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)', boxShadow: '0 0 12px rgba(99,102,241,0.2)' }}>
                        <Shield size={15} className='text-indigo-400' />
                    </div>
                    <div>
                        <h1 className='text-[15px] font-bold text-white leading-none'>Admin Panel</h1>
                        <p className='text-[11px] text-slate-500 mt-0.5'>NovaMind AI</p>
                    </div>
                </div>
                <div className='flex-1' />
                {/* Tab nav */}
                <div className='flex items-center gap-1 p-1 rounded-xl'
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    {tabs.map(t => {
                        const Icon = t.icon
                        return (
                            <button key={t.id} onClick={() => setTab(t.id)}
                                className='flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[12px] font-semibold transition-all duration-150 cursor-pointer border-none'
                                style={tab === t.id ? {
                                    background: 'linear-gradient(135deg,#4f46e5,#7c3aed)',
                                    color: '#fff',
                                    boxShadow: '0 0 10px rgba(99,102,241,0.35)',
                                } : { background: 'transparent', color: '#64748b' }}>
                                <Icon size={13} />
                                {t.label}
                            </button>
                        )
                    })}
                </div>
                <button onClick={() => { if (tab === 'overview') loadStats(); if (tab === 'users') loadUsers(); if (tab === 'payments') loadPayments() }}
                    className='flex items-center justify-center w-8 h-8 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/[0.06] transition-all cursor-pointer border-none bg-transparent'>
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            <div className='px-6 py-6 max-w-[1400px] mx-auto'>

                {/* ════════════════════════════════════════════
                    OVERVIEW TAB
                ════════════════════════════════════════════ */}
                {tab === 'overview' && (
                    <div className='flex flex-col gap-6'>
                        {loading && !stats ? (
                            <div className='flex items-center justify-center h-64 text-slate-600'>Loading stats...</div>
                        ) : stats ? (
                            <>
                                {/* User stats */}
                                <div>
                                    <p className='text-[11px] font-bold uppercase tracking-widest text-slate-600 mb-3'>Users</p>
                                    <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3'>
                                        <StatCard icon={Users}     label="Total Users"    value={stats.users.total}         color="#818cf8" />
                                        <StatCard icon={Zap}       label="New This Month" value={stats.users.newThisMonth}  sub="last 30 days" color="#22d3ee" />
                                        <StatCard icon={Activity}  label="Active Users"   value={stats.users.active}        sub="last 30 days" color="#34d399" />
                                        <StatCard icon={Shield}    label="Free Plan"      value={stats.users.free}          color="#94a3b8" />
                                        <StatCard icon={TrendingUp} label="Starter Plan"  value={stats.users.starter}       color="#818cf8" />
                                        <StatCard icon={Crown}     label="Pro Plan"       value={stats.users.pro}           color="#facc15" />
                                    </div>
                                </div>

                                {/* Revenue stats */}
                                <div>
                                    <p className='text-[11px] font-bold uppercase tracking-widest text-slate-600 mb-3'>Revenue</p>
                                    <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
                                        <StatCard icon={IndianRupee} label="Total Revenue"      value={fmtCurrency(stats.revenue.total)}      color="#34d399" />
                                        <StatCard icon={IndianRupee} label="This Month"          value={fmtCurrency(stats.revenue.thisMonth)}  color="#818cf8" />
                                        <StatCard icon={CreditCard}  label="Paid Transactions"  value={stats.revenue.transactions}            color="#f472b6" />
                                    </div>
                                </div>

                                {/* Activity stats */}
                                <div>
                                    <p className='text-[11px] font-bold uppercase tracking-widest text-slate-600 mb-3'>Activity</p>
                                    <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
                                        <StatCard icon={MessageSquare} label="Total Conversations" value={stats.activity.totalConversations} color="#818cf8" />
                                        <StatCard icon={MessageSquare} label="Total Messages"       value={stats.activity.totalMessages}      color="#22d3ee" />
                                        <StatCard icon={Users}         label="User Messages"        value={stats.activity.userMessages}       color="#f472b6" />
                                    </div>
                                </div>

                                {/* Plan distribution bar */}
                                <div className='p-5 rounded-2xl' style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                                    <p className='text-[12px] font-semibold text-slate-400 mb-4'>Plan Distribution</p>
                                    <div className='flex gap-2 h-6 rounded-full overflow-hidden'>
                                        {stats.users.total > 0 && <>
                                            <div style={{ width: `${(stats.users.free / stats.users.total) * 100}%`, background: '#334155' }} title={`Free: ${stats.users.free}`} />
                                            <div style={{ width: `${(stats.users.starter / stats.users.total) * 100}%`, background: 'linear-gradient(90deg,#4f46e5,#7c3aed)' }} title={`Starter: ${stats.users.starter}`} />
                                            <div style={{ width: `${(stats.users.pro / stats.users.total) * 100}%`, background: 'linear-gradient(90deg,#ca8a04,#facc15)' }} title={`Pro: ${stats.users.pro}`} />
                                        </>}
                                    </div>
                                    <div className='flex items-center gap-5 mt-3'>
                                        {[
                                            { label: 'Free',    color: '#64748b', count: stats.users.free },
                                            { label: 'Starter', color: '#818cf8', count: stats.users.starter },
                                            { label: 'Pro',     color: '#facc15', count: stats.users.pro },
                                        ].map(p => (
                                            <div key={p.label} className='flex items-center gap-1.5'>
                                                <div className='w-2.5 h-2.5 rounded-full' style={{ background: p.color }} />
                                                <span className='text-[12px] text-slate-400'>{p.label} ({p.count})</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className='flex items-center justify-center h-64 text-slate-600'>Failed to load stats.</div>
                        )}
                    </div>
                )}

                {/* ════════════════════════════════════════════
                    USERS TAB
                ════════════════════════════════════════════ */}
                {tab === 'users' && (
                    <div className='flex flex-col gap-4'>
                        {/* Filters */}
                        <div className='flex items-center gap-3 flex-wrap'>
                            <div className='flex items-center gap-2 flex-1 min-w-[200px] px-3.5 py-2 rounded-xl'
                                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                <Search size={14} className='text-slate-500 shrink-0' />
                                <input
                                    value={userSearch}
                                    onChange={e => { setUserSearch(e.target.value); setUserPage(1) }}
                                    placeholder='Search by name or email...'
                                    className='bg-transparent outline-none text-[13px] text-slate-200 placeholder:text-slate-600 w-full'
                                />
                                {userSearch && <button onClick={() => setUserSearch('')} className='text-slate-600 hover:text-slate-300 cursor-pointer border-none bg-transparent'><X size={13} /></button>}
                            </div>
                            {/* Plan filter */}
                            <div className='flex items-center gap-1 p-1 rounded-xl' style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                                {['all', 'free', 'starter', 'pro'].map(p => (
                                    <button key={p} onClick={() => { setUserPlan(p); setUserPage(1) }}
                                        className='px-3 py-1.5 rounded-lg text-[11px] font-semibold capitalize transition-all cursor-pointer border-none'
                                        style={userPlan === p ? {
                                            background: 'linear-gradient(135deg,#4f46e5,#7c3aed)',
                                            color: '#fff', boxShadow: '0 0 8px rgba(99,102,241,0.3)'
                                        } : { background: 'transparent', color: '#64748b' }}>
                                        {p}
                                    </button>
                                ))}
                            </div>
                            <span className='text-[12px] text-slate-600 shrink-0'>{userTotal} users</span>
                        </div>

                        {/* Table */}
                        <div className='rounded-2xl overflow-hidden' style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
                            <div className='overflow-x-auto'>
                                <table className='w-full'>
                                    <thead>
                                        <tr style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                                            {['User', 'Plan', 'Credits', 'Joined', 'Plan Expires', 'Actions'].map(h => (
                                                <th key={h} className='px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-slate-500'>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? (
                                            <tr><td colSpan={6} className='text-center py-12 text-slate-600'>Loading...</td></tr>
                                        ) : users.length === 0 ? (
                                            <tr><td colSpan={6} className='text-center py-12 text-slate-600'>No users found.</td></tr>
                                        ) : users.map((u, i) => (
                                            <tr key={u._id}
                                                style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                                                {/* User */}
                                                <td className='px-4 py-3'>
                                                    <div className='flex items-center gap-2.5'>
                                                        {u.avatar
                                                            ? <img src={u.avatar} className='w-8 h-8 rounded-lg object-cover shrink-0' style={{ border: '1px solid rgba(255,255,255,0.1)' }} />
                                                            : <div className='w-8 h-8 rounded-lg flex items-center justify-center text-[12px] font-bold shrink-0' style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>{u.name?.[0]?.toUpperCase()}</div>
                                                        }
                                                        <div>
                                                            <p className='text-[13px] font-semibold text-slate-100 leading-tight'>{u.name}</p>
                                                            <p className='text-[11px] text-slate-500'>{u.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                {/* Plan */}
                                                <td className='px-4 py-3'>
                                                    {editingUser === u._id ? (
                                                        <select value={editValues.plan ?? u.plan}
                                                            onChange={e => setEditValues(v => ({ ...v, plan: e.target.value }))}
                                                            className='text-[12px] font-semibold rounded-lg px-2 py-1 outline-none cursor-pointer'
                                                            style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8' }}>
                                                            <option value="free">free</option>
                                                            <option value="starter">starter</option>
                                                            <option value="pro">pro</option>
                                                        </select>
                                                    ) : <PlanBadge plan={u.plan} />}
                                                </td>
                                                {/* Credits */}
                                                <td className='px-4 py-3'>
                                                    {editingUser === u._id ? (
                                                        <input type="number" value={editValues.credits ?? u.credits}
                                                            onChange={e => setEditValues(v => ({ ...v, credits: e.target.value }))}
                                                            className='w-20 text-[13px] text-slate-200 rounded-lg px-2 py-1 outline-none'
                                                            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)' }} />
                                                    ) : (
                                                        <span className='text-[13px] text-slate-300'>
                                                            <span className='font-semibold text-white'>{u.credits}</span>
                                                            <span className='text-slate-600'> / {u.totalCredits}</span>
                                                        </span>
                                                    )}
                                                </td>
                                                {/* Joined */}
                                                <td className='px-4 py-3 text-[12px] text-slate-500'>{fmtDate(u.createdAt)}</td>
                                                {/* Plan expires */}
                                                <td className='px-4 py-3 text-[12px] text-slate-500'>{fmtDate(u.planExpiresAt)}</td>
                                                {/* Actions */}
                                                <td className='px-4 py-3'>
                                                    {editingUser === u._id ? (
                                                        <div className='flex items-center gap-1'>
                                                            <button onClick={() => handleUpdateUser(u._id)}
                                                                className='flex items-center justify-center w-7 h-7 rounded-lg cursor-pointer border-none transition-all'
                                                                style={{ background: 'rgba(34,197,94,0.15)', color: '#86efac' }}>
                                                                <Check size={13} />
                                                            </button>
                                                            <button onClick={() => { setEditingUser(null); setEditValues({}) }}
                                                                className='flex items-center justify-center w-7 h-7 rounded-lg cursor-pointer border-none transition-all'
                                                                style={{ background: 'rgba(255,255,255,0.06)', color: '#64748b' }}>
                                                                <X size={13} />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className='flex items-center gap-1'>
                                                            <button onClick={() => { setEditingUser(u._id); setEditValues({ plan: u.plan, credits: u.credits }) }}
                                                                className='flex items-center justify-center w-7 h-7 rounded-lg cursor-pointer border-none transition-all text-slate-500 hover:text-indigo-400'
                                                                style={{ background: 'rgba(255,255,255,0.04)' }}>
                                                                <Edit2 size={13} />
                                                            </button>
                                                            <button onClick={() => setConfirmDelete(u._id)}
                                                                className='flex items-center justify-center w-7 h-7 rounded-lg cursor-pointer border-none transition-all text-slate-500 hover:text-red-400'
                                                                style={{ background: 'rgba(255,255,255,0.04)' }}>
                                                                <Trash2 size={13} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Pagination */}
                        {userPages > 1 && (
                            <div className='flex items-center justify-between'>
                                <span className='text-[12px] text-slate-600'>Page {userPage} of {userPages}</span>
                                <div className='flex items-center gap-2'>
                                    <button disabled={userPage === 1} onClick={() => setUserPage(p => p - 1)}
                                        className='flex items-center justify-center w-8 h-8 rounded-lg border-none cursor-pointer transition-all disabled:opacity-30'
                                        style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8' }}>
                                        <ChevronLeft size={15} />
                                    </button>
                                    <button disabled={userPage === userPages} onClick={() => setUserPage(p => p + 1)}
                                        className='flex items-center justify-center w-8 h-8 rounded-lg border-none cursor-pointer transition-all disabled:opacity-30'
                                        style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8' }}>
                                        <ChevronRight size={15} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ════════════════════════════════════════════
                    PAYMENTS TAB
                ════════════════════════════════════════════ */}
                {tab === 'payments' && (
                    <div className='flex flex-col gap-4'>
                        {/* Filters */}
                        <div className='flex items-center gap-3 flex-wrap'>
                            <div className='flex items-center gap-1 p-1 rounded-xl' style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                                {['all', 'paid', 'created', 'failed'].map(s => (
                                    <button key={s} onClick={() => { setPayStatus(s); setPayPage(1) }}
                                        className='px-3 py-1.5 rounded-lg text-[11px] font-semibold capitalize transition-all cursor-pointer border-none'
                                        style={payStatus === s ? {
                                            background: 'linear-gradient(135deg,#4f46e5,#7c3aed)',
                                            color: '#fff', boxShadow: '0 0 8px rgba(99,102,241,0.3)'
                                        } : { background: 'transparent', color: '#64748b' }}>
                                        {s}
                                    </button>
                                ))}
                            </div>
                            <span className='text-[12px] text-slate-600'>{payTotal} transactions</span>
                        </div>

                        {/* Table */}
                        <div className='rounded-2xl overflow-hidden' style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
                            <div className='overflow-x-auto'>
                                <table className='w-full'>
                                    <thead>
                                        <tr style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                                            {['User', 'Plan', 'Amount', 'Credits', 'Status', 'Date', 'Order ID'].map(h => (
                                                <th key={h} className='px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-slate-500'>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? (
                                            <tr><td colSpan={7} className='text-center py-12 text-slate-600'>Loading...</td></tr>
                                        ) : payments.length === 0 ? (
                                            <tr><td colSpan={7} className='text-center py-12 text-slate-600'>No payments found.</td></tr>
                                        ) : payments.map((p, i) => (
                                            <tr key={p._id}
                                                style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                                                <td className='px-4 py-3'>
                                                    {p.user ? (
                                                        <div className='flex items-center gap-2'>
                                                            {p.user.avatar
                                                                ? <img src={p.user.avatar} className='w-7 h-7 rounded-lg object-cover shrink-0' />
                                                                : <div className='w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0' style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>{p.user.name?.[0]?.toUpperCase()}</div>
                                                            }
                                                            <div>
                                                                <p className='text-[12px] font-semibold text-slate-200 leading-tight'>{p.user.name}</p>
                                                                <p className='text-[10px] text-slate-600'>{p.user.email}</p>
                                                            </div>
                                                        </div>
                                                    ) : <span className='text-[12px] text-slate-600'>Unknown</span>}
                                                </td>
                                                <td className='px-4 py-3'><PlanBadge plan={p.plan || 'free'} /></td>
                                                <td className='px-4 py-3 text-[13px] font-bold text-green-400'>{fmtCurrency(p.amount)}</td>
                                                <td className='px-4 py-3 text-[13px] text-slate-300'>{p.credits}</td>
                                                <td className='px-4 py-3'><StatusBadge status={p.status} /></td>
                                                <td className='px-4 py-3 text-[12px] text-slate-500'>{fmtDate(p.createdAt)}</td>
                                                <td className='px-4 py-3'>
                                                    <span className='text-[11px] text-slate-600 font-mono'>{p.orderId?.slice(0, 16)}...</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Pagination */}
                        {payPages > 1 && (
                            <div className='flex items-center justify-between'>
                                <span className='text-[12px] text-slate-600'>Page {payPage} of {payPages}</span>
                                <div className='flex items-center gap-2'>
                                    <button disabled={payPage === 1} onClick={() => setPayPage(p => p - 1)}
                                        className='flex items-center justify-center w-8 h-8 rounded-lg border-none cursor-pointer transition-all disabled:opacity-30'
                                        style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8' }}>
                                        <ChevronLeft size={15} />
                                    </button>
                                    <button disabled={payPage === payPages} onClick={() => setPayPage(p => p + 1)}
                                        className='flex items-center justify-center w-8 h-8 rounded-lg border-none cursor-pointer transition-all disabled:opacity-30'
                                        style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8' }}>
                                        <ChevronRight size={15} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ── Delete confirmation modal ─────────────────── */}
            {confirmDelete && (
                <div className='fixed inset-0 z-50 flex items-center justify-center' style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
                    <div className='w-[360px] p-6 rounded-2xl flex flex-col gap-4'
                        style={{ background: '#0f1117', border: '1px solid rgba(255,255,255,0.09)' }}>
                        <div className='flex items-center justify-center w-12 h-12 rounded-2xl mx-auto'
                            style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' }}>
                            <Trash2 size={20} className='text-red-400' />
                        </div>
                        <div className='text-center'>
                            <h3 className='text-[15px] font-bold text-white'>Delete User</h3>
                            <p className='text-[13px] text-slate-500 mt-1'>This will permanently delete the user. This action cannot be undone.</p>
                        </div>
                        <div className='flex gap-2'>
                            <button onClick={() => setConfirmDelete(null)}
                                className='flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-slate-300 cursor-pointer border-none transition-all'
                                style={{ background: 'rgba(255,255,255,0.06)' }}>
                                Cancel
                            </button>
                            <button onClick={() => handleDeleteUser(confirmDelete)}
                                className='flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-white cursor-pointer border-none transition-all'
                                style={{ background: 'linear-gradient(135deg,#dc2626,#ef4444)', boxShadow: '0 0 14px rgba(239,68,68,0.3)' }}>
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default AdminPage
