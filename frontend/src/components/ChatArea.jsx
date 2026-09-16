import React, { useEffect } from 'react'
import Nav from './Nav'
import MessageList from './MessageList'
import ChatInput from './ChatInput'
import { useDispatch, useSelector } from 'react-redux'
import getMessages from '../features/getMessages'
import { setArtifacts, setMessages } from '../redux/messageSlice'
import { AnimatePresence, motion } from 'motion/react'

function ChatArea() {
    const { selectedConversation } = useSelector(state => state.conversation)
    const dispatch = useDispatch()

    useEffect(() => {
        const getMsgs = async () => {
            if (selectedConversation) {
                if (selectedConversation.title === "New Chat") return
                const data = await getMessages(selectedConversation?._id)
                dispatch(setMessages(data))
                const latestArtifact = [...data].reverse().find(msg => msg.artifacts?.length > 0)
                dispatch(setArtifacts(latestArtifact?.artifacts || []))
            }
        }
        getMsgs()
    }, [selectedConversation?._id])

    return (
        <div className='flex-1 flex flex-col min-w-0 overflow-hidden'>
            <Nav />

            {/* Fade the message list in/out whenever the conversation changes */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={selectedConversation?._id ?? 'welcome'}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                    className='flex-1 flex flex-col min-h-0'
                >
                    <MessageList />
                </motion.div>
            </AnimatePresence>

            <ChatInput />
        </div>
    )
}

export default ChatArea
