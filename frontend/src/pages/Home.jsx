import { signInWithPopup } from 'firebase/auth'
import React from 'react'
import { auth, googleProvider } from '../../utils/firebase'
import api from '../../utils/axios'
import { FcGoogle } from "react-icons/fc";
import { FaGithub, FaLinkedin } from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';
import { setUserdata } from '../redux/userSlice';
import SideBar from '../components/SideBar';
import ChatArea from '../components/ChatArea';
import Artifact from '../components/Artifact';
import logo from '../assets/novamind_ai_logo.jpg'

function Home() {
    const {userData}=useSelector(state=>state.user)
    const dispatch=useDispatch()
    const handleLogin = async (token) => {
        try {
            const { data } = await api.post("/api/auth/login", { token })
            dispatch(setUserdata(data))
        } catch (error) {
            console.log(error)
        }
    }


    const googleLogin = async () => {
        const data = await signInWithPopup(auth, googleProvider)
        const token = await data.user.getIdToken()
        console.log(token)
        await handleLogin(token)
        console.log(data)
    }
    return (
        <div className='h-screen  flex bg-[#0d0f14] text-white overflow-hidden'>

<SideBar/>
<ChatArea/>
<Artifact/>




{!userData && (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md'>
        <div className='w-[440px] bg-[#0c0e14] border border-white/[0.08] rounded-3xl overflow-hidden shadow-2xl flex flex-col'>

            {/* Top hero — background matches the logo's navy so it blends perfectly */}
            <div className='flex flex-col items-center px-8 pt-10 pb-8' style={{ background: 'linear-gradient(160deg, #0b1535 0%, #0d1230 60%, #0c0e14 100%)' }}>

                {/* Logo — no border-radius, navy bg from logo merges with section bg */}
                <img
                    src={logo}
                    alt="NovaMind AI"
                    className='w-[180px] object-contain'
                    style={{ mixBlendMode: 'lighten' }}
                />

                {/* "Built By Aamir" — logo already has NovaMind AI text, this adds attribution */}
                <p className='text-[12px] font-semibold text-indigo-400 tracking-widest uppercase mt-1'>
                    Built By Aamir
                </p>
            </div>

            {/* Feature pills */}
            <div className='px-8 pb-6 pt-5'>
                <p className='text-[13px] text-slate-400 text-center mb-4 leading-relaxed'>
                    Your all-in-one AI workspace — chat, code, search, and create.
                </p>
                <div className='grid grid-cols-2 gap-2'>
                    {[
                        { icon: "💬", label: "AI Chat",        desc: "Smart conversations"   },
                        { icon: "💻", label: "Code Assistant", desc: "Write & debug code"    },
                        { icon: "🔍", label: "Web Search",     desc: "Real-time answers"     },
                        { icon: "👁️", label: "Vision",         desc: "Analyze images"        },
                        { icon: "📄", label: "PDF Agent",      desc: "Chat with documents"   },
                        { icon: "📊", label: "PPT Generator",  desc: "Create presentations"  },
                    ].map((f) => (
                        <div key={f.label} className='flex items-center gap-2.5 bg-white/[0.04] border border-white/[0.06] rounded-xl px-3 py-2.5'>
                            <span className='text-[16px]'>{f.icon}</span>
                            <div>
                                <p className='text-[12px] font-semibold text-slate-200 leading-tight'>{f.label}</p>
                                <p className='text-[11px] text-slate-500 leading-tight'>{f.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Divider */}
            <div className='mx-8 h-px bg-white/[0.06]' />

            {/* Login + socials */}
            <div className='px-8 py-6 flex flex-col gap-4'>
                <button
                    className='w-full flex items-center justify-center gap-3 py-3.5 rounded-xl text-[14px] font-semibold text-black bg-white hover:bg-gray-100 transition-all duration-150 cursor-pointer shadow-lg'
                    onClick={googleLogin}
                >
                    <FcGoogle size={19} />
                    Continue With Google
                </button>

                <div className='flex items-center justify-center gap-5'>
                    <a
                        href="https://github.com/aamir490"
                        target="_blank"
                        rel="noopener noreferrer"
                        className='flex items-center gap-1.5 text-[12px] font-medium text-slate-500 hover:text-white transition-colors duration-150'
                    >
                        <FaGithub size={14} />
                        <span>GitHub</span>
                    </a>
                    <span className='text-slate-700'>·</span>
                    <a
                        href="https://www.linkedin.com/in/aamir-imran"
                        target="_blank"
                        rel="noopener noreferrer"
                        className='flex items-center gap-1.5 text-[12px] font-medium text-slate-500 hover:text-blue-400 transition-colors duration-150'
                    >
                        <FaLinkedin size={14} />
                        <span>LinkedIn</span>
                    </a>
                </div>
            </div>

        </div>
    </div>
)}
          
        </div>
    )
}

export default Home
