import React from 'react'
import { AnimatePresence, motion } from "motion/react"
import { Crown, Sparkles, X, Zap } from 'lucide-react'
import { useSelector } from 'react-redux'
import { createOrder } from '../features/createOrder'
import { verifyPayment } from '../features/verifyPayment'

function BillingDrawer({ open, onClose }) {
    const { userData } = useSelector(state => state.user)

    const handleUpgrade = async (plan) => {
        try {
            const data = await createOrder(plan)
            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                amount: data?.order?.amount,
                currency: data?.order?.currency,
                name: "NovaMind AI",
                description: `${data?.plan?.name} Plan`,
                order_id: data?.order?.id,
                handler: async (response) => {
                    try { await verifyPayment(response) } catch (e) { console.log(e) }
                },
                theme: { color: "#4F46E5" }
            }
            const razorpay = new window.Razorpay(options)
            razorpay.open()
        } catch (error) {
            console.log(error)
        }
    }

    const plans = [
        {
            id: "starter",
            name: "Starter",
            price: "₹199",
            credits: "500 Credits",
            description: "Perfect for light usage",
            icon: Zap,
            isPro: false,
        },
        {
            id: "pro",
            name: "Pro",
            price: "₹499",
            credits: "1000 Credits",
            description: "Best value for power users",
            icon: Sparkles,
            isPro: true,
        },
    ]

    const creditsPercent = ((userData?.credits || 0) / (userData?.totalCredits || 1)) * 100

    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black z-40" />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="fixed right-0 top-0 z-50 h-screen w-[380px] flex flex-col"
                        style={{ background: '#0a0c11', borderLeft: '1px solid rgba(255,255,255,0.07)', boxShadow: '-8px 0 32px rgba(0,0,0,0.5)' }}
                    >
                        {/* ── Header ──────────────────────────────── */}
                        <div className='flex items-center justify-between px-5 py-4 shrink-0'
                            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                            <div>
                                <h2 className='text-white text-[17px] font-bold tracking-tight'>Billing</h2>
                                <p className='text-slate-500 text-[12px] mt-0.5'>Plans & Credits</p>
                            </div>
                            <button onClick={onClose}
                                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-150 border-none cursor-pointer"
                                style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8' }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.09)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* ── Current plan card ────────────────────── */}
                        <div className='px-5 py-4 shrink-0'>
                            <div className='rounded-2xl p-4'
                                style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.18)', boxShadow: '0 0 20px rgba(99,102,241,0.08)' }}>
                                <div className='flex justify-between items-start'>
                                    <div>
                                        <p className='text-slate-400 text-[12px] font-medium'>Current Plan</p>
                                        <h3 className='text-white text-[20px] font-bold mt-0.5 capitalize'>
                                            {userData?.plan || 'Free'}
                                        </h3>
                                    </div>
                                    <div className='flex items-center justify-center w-9 h-9 rounded-xl'
                                        style={{ background: 'rgba(234,179,8,0.12)', border: '1px solid rgba(234,179,8,0.2)' }}>
                                        <Crown size={16} className='text-yellow-400' />
                                    </div>
                                </div>

                                {/* Credits bar */}
                                <div className='mt-4'>
                                    <div className='flex justify-between text-[12px] mb-2'>
                                        <span className='text-slate-400'>Credits remaining</span>
                                        <span className='font-semibold'
                                            style={{ color: creditsPercent > 30 ? '#818cf8' : '#f87171' }}>
                                            {userData?.credits || 0}
                                            <span className='text-slate-600 font-normal'> / {userData?.totalCredits || 100}</span>
                                        </span>
                                    </div>
                                    <div className='h-2 rounded-full overflow-hidden'
                                        style={{ background: 'rgba(255,255,255,0.07)' }}>
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${creditsPercent}%` }}
                                            transition={{ duration: 0.8, ease: "easeOut" }}
                                            className='h-full rounded-full'
                                            style={{
                                                background: creditsPercent > 30
                                                    ? 'linear-gradient(90deg,#4f46e5,#7c3aed)'
                                                    : 'linear-gradient(90deg,#ef4444,#f97316)',
                                                boxShadow: creditsPercent > 30
                                                    ? '0 0 8px rgba(99,102,241,0.5)'
                                                    : '0 0 8px rgba(239,68,68,0.4)',
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── Plan cards ───────────────────────────── */}
                        <div className='px-5 flex-1 overflow-auto space-y-3 pb-5'>
                            <p className='text-[11px] font-bold uppercase tracking-widest text-slate-600 mb-1'>
                                Upgrade Plan
                            </p>

                            {plans.map((plan) => {
                                const Icon = plan.icon
                                return (
                                    <div key={plan.id} className='rounded-2xl p-4 relative overflow-hidden'
                                        style={plan.isPro ? {
                                            background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(139,92,246,0.08) 100%)',
                                            border: '1px solid rgba(99,102,241,0.3)',
                                            boxShadow: '0 0 24px rgba(99,102,241,0.1)',
                                        } : {
                                            background: 'rgba(255,255,255,0.03)',
                                            border: '1px solid rgba(255,255,255,0.08)',
                                        }}
                                    >
                                        {/* Pro badge */}
                                        {plan.isPro && (
                                            <div className='absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider'
                                                style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', color: '#fff', boxShadow: '0 0 10px rgba(99,102,241,0.4)' }}>
                                                Best Value
                                            </div>
                                        )}

                                        <div className='flex items-start gap-3'>
                                            <div className='flex items-center justify-center w-9 h-9 rounded-xl shrink-0'
                                                style={plan.isPro ? {
                                                    background: 'rgba(99,102,241,0.15)',
                                                    border: '1px solid rgba(99,102,241,0.25)',
                                                } : {
                                                    background: 'rgba(255,255,255,0.05)',
                                                    border: '1px solid rgba(255,255,255,0.08)',
                                                }}>
                                                <Icon size={16} className={plan.isPro ? 'text-indigo-400' : 'text-slate-400'} />
                                            </div>
                                            <div>
                                                <h3 className='text-white font-bold text-[15px]'>{plan.name} Plan</h3>
                                                <p className='text-slate-500 text-[12px] mt-0.5'>{plan.description}</p>
                                            </div>
                                        </div>

                                        <div className='mt-3 flex items-end gap-2'>
                                            <span className='text-[26px] font-bold'
                                                style={plan.isPro ? {
                                                    background: 'linear-gradient(90deg,#818cf8,#a78bfa)',
                                                    WebkitBackgroundClip: 'text',
                                                    WebkitTextFillColor: 'transparent',
                                                } : { color: '#818cf8' }}>
                                                {plan.price}
                                            </span>
                                            <span className='text-slate-500 text-[12px] mb-1'>{plan.credits}</span>
                                        </div>

                                        <motion.button
                                            whileTap={{ scale: 0.97 }}
                                            onClick={() => handleUpgrade(plan.id)}
                                            className='mt-3 w-full rounded-xl py-2.5 text-[13px] font-semibold text-white border-none cursor-pointer transition-all duration-150'
                                            style={plan.isPro ? {
                                                background: 'linear-gradient(135deg,#4f46e5,#7c3aed)',
                                                boxShadow: '0 0 16px rgba(99,102,241,0.4)',
                                            } : {
                                                background: 'rgba(99,102,241,0.15)',
                                                border: '1px solid rgba(99,102,241,0.25)',
                                            }}
                                            onMouseEnter={e => { if (!plan.isPro) e.currentTarget.style.background = 'rgba(99,102,241,0.25)' }}
                                            onMouseLeave={e => { if (!plan.isPro) e.currentTarget.style.background = 'rgba(99,102,241,0.15)' }}
                                        >
                                            Upgrade to {plan.name}
                                        </motion.button>
                                    </div>
                                )
                            })}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}

export default BillingDrawer
