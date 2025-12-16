import express from "express"
import { registerUser, deleteUser, searchUsers } from "../controllers/userController.js"
import { protect } from "../middleware/auth.js"

const router = express.Router()

router.post("/", registerUser)

router.delete("/", protect, deleteUser)

router.get("/search", searchUsers)

export default router
