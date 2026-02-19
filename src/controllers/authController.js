
import jwt from 'jsonwebtoken';
import AuthService from '../services/authService.js';
import RedisService from '../services/redisService.js';
import env from '../config/env.js';
import User from '../models/User.js';

class AuthController {

    constructor() {
        this._authService = new AuthService();
        this._redisService = new RedisService();
    }

    /**
     * POST /api/auth/register
     */
    async register(req, res) {
        try {
            const { name, email, password } = req.body;

            if (!name || !email || !password) {
                return res.status(400).json({ error: 'Name, email, and password are required.' });
            }

            const result = await this._authService.register(name, email, password);

            return res.status(201).json({
                message: 'Registration successful.',
                user: result.user,
                token: result.token,
            });

        } catch (error) {
            console.error(`[AuthController] register error: ${error.message}`);
            return res.status(error.status || 500).json({ error: error.message });
        }
    }

    async login(req, res) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({ error: 'Email and password are required.' });
            }

            const result = await this._authService.login(email, password);

            return res.status(200).json({
                message: 'Login successful.',
                user: result.user,
                token: result.token,
            });

        } catch (error) {
            console.error(`[AuthController] login error: ${error.message}`);
            return res.status(error.status || 500).json({ error: error.message });
        }
    }

    /**
     * POST /api/auth/logout
     * Blacklists the current JWT in Redis so it can't be reused.
     */
    async logout(req, res) {
        try {
            const token = req.token;
            const decoded = jwt.decode(token);

            // Calculate remaining TTL in seconds
            const now = Math.floor(Date.now() / 1000);
            const ttl = decoded.exp - now;

            if (ttl > 0) {
                await this._redisService.blacklistToken(token, ttl);
            }

            return res.status(200).json({ message: 'Logout successful.' });

        } catch (error) {
            console.error(`[AuthController] logout error: ${error.message}`);
            return res.status(500).json({ error: 'Logout failed.' });
        }
    }

    /**
     * GET /api/auth/me
     * Returns the authenticated user's profile.
     */
    async getProfile(req, res) {
        try {
            const user = await User.findById(req.user.id);
            if (!user) {
                return res.status(404).json({ error: 'User not found.' });
            }

            return res.status(200).json({ user: user.toJSON() });

        } catch (error) {
            console.error(`[AuthController] getProfile error: ${error.message}`);
            return res.status(500).json({ error: 'Failed to fetch profile.' });
        }
    }
}

export default AuthController;
