import express from "express"
import adminProtect from "../middleware/admin.middleware.js"
import {
    getStats,
    getUsers,
    getUserById,
    updateUser,
    deleteUser,
    getPayments
} from "../controllers/admin.controller.js"

const router = express.Router()

// All admin routes require admin auth
router.use(adminProtect)

router.get("/stats",         getStats)
router.get("/users",         getUsers)
router.get("/users/:id",     getUserById)
router.patch("/users/:id",   updateUser)
router.delete("/users/:id",  deleteUser)
router.get("/payments",      getPayments)

export default router
