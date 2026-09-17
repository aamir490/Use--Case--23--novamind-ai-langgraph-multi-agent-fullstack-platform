import User from "../models/user.model.js"
import mongoose from "mongoose"

// ── Schemas ───────────────────────────────────────────────────
const paymentSchema = new mongoose.Schema({
    userId: String, orderId: String, paymentId: String,
    amount: Number, currency: String, credits: Number,
    plan: String, status: String
}, { timestamps: true })

const conversationSchema = new mongoose.Schema({
    title: String, userId: String
}, { timestamps: true })

const messageSchema = new mongoose.Schema({
    conversationId: mongoose.Schema.Types.ObjectId,
    role: String, content: String
}, { timestamps: true })

// ── Singleton DB connections (reused across requests) ─────────
let _billingConn = null
let _chatConn    = null

const getBillingConn = async () => {
    if (_billingConn && _billingConn.readyState === 1) return _billingConn
    _billingConn = await mongoose.createConnection(process.env.BILLING_MONGODB_URI).asPromise()
    return _billingConn
}

const getChatConn = async () => {
    if (_chatConn && _chatConn.readyState === 1) return _chatConn
    _chatConn = await mongoose.createConnection(process.env.CHAT_MONGODB_URI).asPromise()
    return _chatConn
}

const getPaymentModel  = async () => { const c = await getBillingConn(); return c.models.Payment      || c.model("Payment",      paymentSchema)      }
const getConvModel     = async () => { const c = await getChatConn();    return c.models.Conversation  || c.model("Conversation",  conversationSchema)  }
const getMessageModel  = async () => { const c = await getChatConn();    return c.models.Message       || c.model("Message",       messageSchema)       }

// ── GET /admin/stats ──────────────────────────────────────────
export const getStats = async (req, res) => {
    try {
        const now          = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const last30       = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

        const [totalUsers, freeUsers, starterUsers, proUsers, newThisMonth, activeUsers] =
            await Promise.all([
                User.countDocuments(),
                User.countDocuments({ plan: "free" }),
                User.countDocuments({ plan: "starter" }),
                User.countDocuments({ plan: "pro" }),
                User.countDocuments({ createdAt: { $gte: startOfMonth } }),
                User.countDocuments({ updatedAt:  { $gte: last30 }      }),
            ])

        let totalRevenue = 0, monthRevenue = 0, totalTransactions = 0
        try {
            const Payment      = await getPaymentModel()
            const paidPayments = await Payment.find({ status: "paid" }).lean()
            totalRevenue       = paidPayments.reduce((s, p) => s + (p.amount || 0), 0)
            monthRevenue       = paidPayments
                .filter(p => new Date(p.createdAt) >= startOfMonth)
                .reduce((s, p) => s + (p.amount || 0), 0)
            totalTransactions  = paidPayments.length
        } catch (e) { console.log("Billing stats error:", e.message) }

        let totalConversations = 0, totalMessages = 0, userMessages = 0
        try {
            const [Conversation, Message] = await Promise.all([getConvModel(), getMessageModel()])
            ;[totalConversations, totalMessages, userMessages] = await Promise.all([
                Conversation.countDocuments(),
                Message.countDocuments(),
                Message.countDocuments({ role: "user" }),
            ])
        } catch (e) { console.log("Chat stats error:", e.message) }

        return res.status(200).json({
            users:    { total: totalUsers, free: freeUsers, starter: starterUsers, pro: proUsers, newThisMonth, active: activeUsers },
            revenue:  { total: totalRevenue, thisMonth: monthRevenue, transactions: totalTransactions },
            activity: { totalConversations, totalMessages, userMessages }
        })

    } catch (error) {
        console.log("getStats error:", error)
        return res.status(500).json({ message: `Stats error: ${error}` })
    }
}

// ── GET /admin/users ──────────────────────────────────────────
export const getUsers = async (req, res) => {
    try {
        const { plan, search, page = 1, limit = 20 } = req.query
        const skip = (parseInt(page) - 1) * parseInt(limit)

        const filter = {}
        if (plan && plan !== "all") filter.plan = plan
        if (search) {
            filter.$or = [
                { name:  { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } }
            ]
        }

        const [users, total] = await Promise.all([
            User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)).select("-firebaseUid").lean(),
            User.countDocuments(filter)
        ])

        return res.status(200).json({
            users,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit))
        })

    } catch (error) {
        console.log("getUsers error:", error)
        return res.status(500).json({ message: `Get users error: ${error}` })
    }
}

// ── GET /admin/users/:id ──────────────────────────────────────
export const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select("-firebaseUid").lean()
        if (!user) return res.status(404).json({ message: "User not found" })

        let payments = []
        try {
            const Payment = await getPaymentModel()
            payments = await Payment.find({ userId: req.params.id }).sort({ createdAt: -1 }).limit(10).lean()
        } catch (e) { console.log("getUserById billing error:", e.message) }

        return res.status(200).json({ user, payments })
    } catch (error) {
        return res.status(500).json({ message: `Get user error: ${error}` })
    }
}

// ── PATCH /admin/users/:id ────────────────────────────────────
export const updateUser = async (req, res) => {
    try {
        const { plan, credits } = req.body
        const user = await User.findById(req.params.id)
        if (!user) return res.status(404).json({ message: "User not found" })

        if (plan    !== undefined) user.plan         = plan
        if (credits !== undefined) {
            user.credits      = parseInt(credits)
            user.totalCredits = Math.max(user.totalCredits, parseInt(credits))
        }

        await user.save()
        return res.status(200).json({ success: true, user })
    } catch (error) {
        return res.status(500).json({ message: `Update user error: ${error}` })
    }
}

// ── DELETE /admin/users/:id ───────────────────────────────────
export const deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id)
        if (!user) return res.status(404).json({ message: "User not found" })
        return res.status(200).json({ success: true, message: "User deleted" })
    } catch (error) {
        return res.status(500).json({ message: `Delete user error: ${error}` })
    }
}

// ── GET /admin/payments ───────────────────────────────────────
export const getPayments = async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query
        const skip = (parseInt(page) - 1) * parseInt(limit)

        const Payment = await getPaymentModel()

        const filter = {}
        if (status && status !== "all") filter.status = status

        const [payments, total] = await Promise.all([
            Payment.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)).lean(),
            Payment.countDocuments(filter)
        ])

        // Enrich with user info from auth DB
        const userIds = [...new Set(payments.map(p => p.userId).filter(Boolean))]
        const users   = await User.find({ _id: { $in: userIds } }).select("name email avatar").lean()
        const userMap = Object.fromEntries(users.map(u => [u._id.toString(), u]))

        const enriched = payments.map(p => ({ ...p, user: userMap[p.userId] || null }))

        return res.status(200).json({
            payments: enriched,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit))
        })

    } catch (error) {
        console.log("getPayments error:", error)
        return res.status(500).json({ message: `Get payments error: ${error}` })
    }
}
