// ─── Auth Middleware ─────────────────────────────────────────────────
// SRP: Verifies JWT, checks Redis blacklist, attaches req.user.

import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import RedisService from '../services/redisService.js';

const redisService = new RedisService();

/**
 * Express middleware that protects routes with JWT authentication.
 * Attaches `req.user = { id }` on success.
 */
export default async function authMiddleware(req, res, next) {
    try {
        // 1. Extract token from Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Access denied. No token provided.' });
        }

        const token = authHeader.split(' ')[1];

        // 2. Check if token is blacklisted in Redis
        const isBlacklisted = await redisService.isTokenBlacklisted(token);
        if (isBlacklisted) {
            return res.status(401).json({ error: 'Token has been revoked. Please login again.' });
        }

        // 3. Verify JWT signature and expiration
        const decoded = jwt.verify(token, env.JWT_SECRET);

        // 4. Attach user info and raw token to request
        req.user = { id: decoded.id };
        req.token = token;

        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token has expired. Please login again.' });
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Invalid token.' });
        }
        return res.status(500).json({ error: 'Authentication failed.' });
    }
}
