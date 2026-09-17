import React, { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import Home from './pages/Home'
import AdminPage from './pages/AdminPage'
import getCurrentUser from './features/getCurrentUser'
import { setUserdata } from './redux/userSlice'

function AdminRoute({ children, loading }) {
    const { userData } = useSelector(state => state.user)

    // Still fetching session — show nothing yet
    if (loading) return (
        <div className='h-screen flex items-center justify-center' style={{ background: '#0a0c11' }}>
            <div className='text-slate-600 text-[13px]'>Loading...</div>
        </div>
    )

    // Not logged in
    if (!userData) return <Navigate to="/" replace />

    // Logged in but not admin
    if (userData.email !== import.meta.env.VITE_ADMIN_EMAIL) return <Navigate to="/" replace />

    return children
}

function App() {
    const dispatch = useDispatch()
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const getUser = async () => {
            const data = await getCurrentUser()
            dispatch(setUserdata(data))
            setLoading(false)
        }
        getUser()
    }, [])

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/admin" element={
                    <AdminRoute loading={loading}>
                        <AdminPage />
                    </AdminRoute>
                } />
            </Routes>
        </BrowserRouter>
    )
}

export default App
