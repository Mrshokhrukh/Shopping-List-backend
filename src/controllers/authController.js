import jwt from "jsonwebtoken"
import User from "../models/User.js"

/**
 * Generate JWT token
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  })
}

/**
 * @desc    Login user
 * @route   POST /api/auth
 * @access  Public
 */
export const login = async (req, res) => {
  try {
    const { username, password } = req.body

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ message: "Please provide username and password" })
    }

    // Find user by username
    const user = await User.findOne({ username: username.toLowerCase() })

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" })
    }

    // Check password
    const isPasswordValid = await user.matchPassword(password)

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" })
    }

    // Return user data with token
    res.json({
      _id: user._id,
      name: user.name,
      username: user.username,
      token: generateToken(user._id),
    })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({ message: "Server error during login" })
  }
}

/**
 * @desc    Get current user
 * @route   GET /api/auth
 * @access  Private
 */
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password")

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    res.json({
      _id: user._id,
      name: user.name,
      username: user.username,
    })
  } catch (error) {
    console.error("Get me error:", error)
    res.status(500).json({ message: "Server error" })
  }
}
