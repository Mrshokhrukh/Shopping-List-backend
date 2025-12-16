import Group from "../models/Group.js"
import User from "../models/User.js"

/**
 * @desc    Get all groups for current user
 * @route   GET /api/groups
 * @access  Private
 */
export const getMyGroups = async (req, res) => {
  try {
    // Find groups where user is owner or member
    const groups = await Group.find({
      $or: [{ owner: req.user._id }, { members: req.user._id }],
    })
      .populate("owner", "name username")
      .populate("members", "name username")
      .sort({ createdAt: -1 })

    res.json(groups)
  } catch (error) {
    console.error("Get my groups error:", error)
    res.status(500).json({ message: "Server error" })
  }
}

/**
 * @desc    Create new group
 * @route   POST /api/groups
 * @access  Private
 */
export const createGroup = async (req, res) => {
  try {
    const { name, password } = req.body

    // Validate input
    if (!name || !password) {
      return res.status(400).json({ message: "Please provide group name and password" })
    }

    // Create group with owner as the first member
    const group = await Group.create({
      name,
      password,
      owner: req.user._id,
      members: [req.user._id],
    })

    // Populate owner and members
    await group.populate("owner", "name username")
    await group.populate("members", "name username")

    res.status(201).json(group)
  } catch (error) {
    console.error("Create group error:", error)
    res.status(500).json({ message: "Server error" })
  }
}

/**
 * @desc    Delete group
 * @route   DELETE /api/groups/:groupId
 * @access  Private
 */
export const deleteGroup = async (req, res) => {
  try {
    const { groupId } = req.params

    const group = await Group.findById(groupId)

    if (!group) {
      return res.status(404).json({ message: "Group not found" })
    }

    // Check if user is the owner
    if (group.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this group" })
    }

    await Group.findByIdAndDelete(groupId)

    res.json({ message: "Group deleted successfully" })
  } catch (error) {
    console.error("Delete group error:", error)
    res.status(500).json({ message: "Server error" })
  }
}

/**
 * @desc    Add member to group
 * @route   POST /api/groups/:groupId/members
 * @access  Private
 */
export const addMember = async (req, res) => {
  try {
    const { groupId } = req.params
    const { memberId } = req.body

    if (!memberId) {
      return res.status(400).json({ message: "Please provide member ID" })
    }

    const group = await Group.findById(groupId)

    if (!group) {
      return res.status(404).json({ message: "Group not found" })
    }

    // Check if user is the owner
    if (group.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to add members" })
    }

    // Check if member exists
    const memberExists = await User.findById(memberId)
    if (!memberExists) {
      return res.status(404).json({ message: "User not found" })
    }

    // Check if already a member
    if (group.members.includes(memberId)) {
      return res.status(400).json({ message: "User is already a member" })
    }

    // Add member
    group.members.push(memberId)
    await group.save()

    // Populate and return updated group
    await group.populate("owner", "name username")
    await group.populate("members", "name username")

    res.json(group)
  } catch (error) {
    console.error("Add member error:", error)
    res.status(500).json({ message: "Server error" })
  }
}

/**
 * @desc    Remove member from group
 * @route   DELETE /api/groups/:groupId/members/:memberId
 * @access  Private
 */
export const removeMember = async (req, res) => {
  try {
    const { groupId, memberId } = req.params

    const group = await Group.findById(groupId)

    if (!group) {
      return res.status(404).json({ message: "Group not found" })
    }

    // Check if user is the owner
    if (group.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to remove members" })
    }

    // Check if trying to remove owner
    if (memberId === group.owner.toString()) {
      return res.status(400).json({ message: "Cannot remove the group owner" })
    }

    // Remove member
    group.members = group.members.filter((member) => member.toString() !== memberId)
    await group.save()

    // Populate and return updated group
    await group.populate("owner", "name username")
    await group.populate("members", "name username")

    res.json(group)
  } catch (error) {
    console.error("Remove member error:", error)
    res.status(500).json({ message: "Server error" })
  }
}

/**
 * @desc    Join group with password
 * @route   POST /api/groups/join
 * @access  Private
 */
export const joinGroup = async (req, res) => {
  try {
    const { password } = req.body

    if (!password) {
      return res.status(400).json({ message: "Please provide group password" })
    }

    // Find all groups and check password
    const groups = await Group.find()
    let matchedGroup = null

    for (const group of groups) {
      const isMatch = await group.matchPassword(password)
      if (isMatch) {
        matchedGroup = group
        break
      }
    }

    if (!matchedGroup) {
      return res.status(404).json({ message: "Invalid group password" })
    }

    // Check if already a member
    if (matchedGroup.members.includes(req.user._id)) {
      return res.status(400).json({ message: "You are already a member of this group" })
    }

    // Add user to group
    matchedGroup.members.push(req.user._id)
    await matchedGroup.save()

    // Populate and return group
    await matchedGroup.populate("owner", "name username")
    await matchedGroup.populate("members", "name username")

    res.json(matchedGroup)
  } catch (error) {
    console.error("Join group error:", error)
    res.status(500).json({ message: "Server error" })
  }
}

/**
 * @desc    Leave group
 * @route   POST /api/groups/leave
 * @access  Private
 */
export const leaveGroup = async (req, res) => {
  try {
    const { groupId } = req.body

    if (!groupId) {
      return res.status(400).json({ message: "Please provide group ID" })
    }

    const group = await Group.findById(groupId)

    if (!group) {
      return res.status(404).json({ message: "Group not found" })
    }

    // Check if user is the owner
    if (group.owner.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: "Owner cannot leave the group. Delete it instead." })
    }

    // Remove user from members
    group.members = group.members.filter((member) => member.toString() !== req.user._id.toString())
    await group.save()

    res.json({ message: "Successfully left the group" })
  } catch (error) {
    console.error("Leave group error:", error)
    res.status(500).json({ message: "Server error" })
  }
}

/**
 * @desc    Search groups by name
 * @route   GET /api/groups/search?q=query
 * @access  Private
 */
export const searchGroups = async (req, res) => {
  try {
    const { q } = req.query

    if (!q || q.trim() === "") {
      return res.json([])
    }

    // Search groups where user is owner or member
    const groups = await Group.find({
      $and: [
        { name: { $regex: q, $options: "i" } },
        {
          $or: [{ owner: req.user._id }, { members: req.user._id }],
        },
      ],
    })
      .populate("owner", "name username")
      .populate("members", "name username")
      .limit(20)

    res.json(groups)
  } catch (error) {
    console.error("Search groups error:", error)
    res.status(500).json({ message: "Server error" })
  }
}
