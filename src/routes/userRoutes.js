import express from "express"
import { registerUser, deleteUser, searchUsers } from "../controllers/userController.js"
import { protect } from "../middleware/auth.js"

const router = express.Router()

// POST /api/users - Register
router.post("/", registerUser)

// DELETE /api/users - Delete user (protected)
router.delete("/", protect, deleteUser)

// GET /api/users/search - Search users
router.get("/search", searchUsers)

export default router
