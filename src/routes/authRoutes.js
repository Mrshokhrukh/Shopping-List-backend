import express from 'express';
import { login, getMe } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// POST /api/auth - Login
router.post('/', login);

// GET /api/auth - Get current user (protected)
router.get('/', protect, getMe);

export default router;
