import express from "express"
import {
  getMyGroups,
  createGroup,
  deleteGroup,
  addMember,
  removeMember,
  joinGroup,
  leaveGroup,
  searchGroups,
} from "../controllers/groupController.js"
import { protect } from "../middleware/auth.js"

const router = express.Router()

// All group routes are protected
router.use(protect)

// GET /api/groups - Get my groups
router.get("/", getMyGroups)

// POST /api/groups - Create group
router.post("/", createGroup)

// DELETE /api/groups/:groupId - Delete group
router.delete("/:groupId", deleteGroup)

// POST /api/groups/:groupId/members - Add member
router.post("/:groupId/members", addMember)

// DELETE /api/groups/:groupId/members/:memberId - Remove member
router.delete("/:groupId/members/:memberId", removeMember)

// POST /api/groups/join - Join group
router.post("/join", joinGroup)

// POST /api/groups/leave - Leave group
router.post("/leave", leaveGroup)

// GET /api/groups/search - Search groups
router.get("/search", searchGroups)

export default router
