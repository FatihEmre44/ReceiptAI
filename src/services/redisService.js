

import redisClient from '../config/redis.js';

class RedisService {

    /**
     * Blacklists a JWT token so it can no longer be used.
     * Key: `bl:<token>`, TTL matches the token's remaining lifetime.
     * @param {string} token - The raw JWT string
     * @param {number} ttlSeconds - Seconds until the token would naturally expire
     */
    async blacklistToken(token, ttlSeconds) {
        await redisClient.set(`bl:${token}`, '1', 'EX', ttlSeconds);
        console.log(`[Redis] Token blacklisted (TTL ${ttlSeconds}s)`);
    }

    /**
     * Checks if a token has been blacklisted.
     * @param {string} token - The raw JWT string
     * @returns {Promise<boolean>} true if blacklisted
     */
    async isTokenBlacklisted(token) {
        const result = await redisClient.get(`bl:${token}`);
        return result !== null;
    }
}

export default RedisService;
