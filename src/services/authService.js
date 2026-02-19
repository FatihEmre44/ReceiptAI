// ─── Auth Service ───────────────────────────────────────────────────
// SRP: Handles user registration, login, and JWT generation.
// DIP: Controller depends on this abstraction, not on bcrypt/jwt directly.

import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import env from '../config/env.js';

class AuthService {

    /**
     * Registers a new user.
     * @param {string} name
     * @param {string} email
     * @param {string} password
     * @returns {Promise<{ user: object, token: string }>}
     */
    async register(name, email, password) {
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            const error = new Error('Email already registered.');
            error.status = 409;
            throw error;
        }

        const user = await User.create({ name, email, password });
        const token = this.generateToken(user._id);

        return { user: user.toJSON(), token };
    }

    /**
     * Authenticates a user and returns a JWT.
     * @param {string} email
     * @param {string} password
     * @returns {Promise<{ user: object, token: string }>}
     */
    async login(email, password) {
        // Find user and explicitly include the password field
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            const error = new Error('Invalid email or password.');
            error.status = 401;
            throw error;
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            const error = new Error('Invalid email or password.');
            error.status = 401;
            throw error;
        }

        const token = this.generateToken(user._id);
        return { user: user.toJSON(), token };
    }

    /**
     * Signs a JWT with the user's ID.
     * @param {string} userId
     * @returns {string} JWT token
     */
    generateToken(userId) {
        return jwt.sign({ id: userId }, env.JWT_SECRET, {
            expiresIn: env.JWT_EXPIRES_IN,
        });
    }
}

export default AuthService;
