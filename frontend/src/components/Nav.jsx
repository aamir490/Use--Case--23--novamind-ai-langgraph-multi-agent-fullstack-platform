import { MessageSquare } from 'lucide-react'
import React from 'react'
import { useSelector } from 'react-redux'

function Nav() {
    const { selectedConversation } = useSelector(state => state.conversation)
    const { messages } = useSelector(state => state.message)

    if (!selectedConversation) return null

    return (
        <div className='h-14 flex items-center gap-3 px-5 shrink-0'
            style={{
                background: 'linear-gradient(90deg, #0a0c11 0%, #0d0f16 100%)',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                boxShadow: '0 1px 0 rgba(99,102,241,0.06)',
            }}
        >
            {/* Icon */}
            <div className='flex items-center justify-center w-7 h-7 rounded-lg shrink-0'
                style={{
                    background: 'rgba(99,102,241,0.1)',
                    border: '1px solid rgba(99,102,241,0.2)',
                    boxShadow: '0 0 10px rgba(99,102,241,0.15)',
                }}>
                <MessageSquare size={13} className="text-indigo-400" />
            </div>

            {/* Title */}
            <p className='text-[14px] font-semibold text-slate-100 tracking-tight truncate flex-1'>
                {selectedConversation?.title || 'New Chat'}
            </p>

            {/* Message count badge */}
            <span className='shrink-0 text-[10px] font-semibold text-slate-500 px-2.5 py-1 rounded-full'
                style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.07)',
                }}>
                {messages?.length} {messages?.length === 1 ? 'message' : 'messages'}
            </span>
        </div>
    )
}

export default Nav
