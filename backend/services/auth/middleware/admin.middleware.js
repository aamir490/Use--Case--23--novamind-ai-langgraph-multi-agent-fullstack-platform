import User from "../models/user.model.js"

const ADMIN_EMAIL = process.env.ADMIN_EMAIL

const adminProtect = async (req, res, next) => {
    try {
        const userId = req.headers["x-user-id"]

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" })
        }

        const user = await User.findById(userId)

        if (!user) {
            return res.status(401).json({ message: "User not found" })
        }

        if (user.email !== process.env.ADMIN_EMAIL) {
            return res.status(403).json({ message: "Access denied. Admins only." })
        }

        req.adminUser = user
        next()
    } catch (error) {
        return res.status(500).json({ message: `Admin auth error: ${error}` })
    }
}

export default adminProtect
