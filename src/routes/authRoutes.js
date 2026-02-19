
import express from 'express';
import AuthController from '../controllers/authController.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();
const controller = new AuthController();

// POST /api/auth/register  → Create a new account
router.post('/register', (req, res) => {
    controller.register(req, res);
});

// POST /api/auth/login     → Authenticate and get JWT
router.post('/login', (req, res) => {
    controller.login(req, res);
});

// POST /api/auth/logout    → Blacklist token (requires auth)
router.post('/logout', authMiddleware, (req, res) => {
    controller.logout(req, res);
});

// GET  /api/auth/me        → Get current user profile (requires auth)
router.get('/me', authMiddleware, (req, res) => {
    controller.getProfile(req, res);
});

export default router;
