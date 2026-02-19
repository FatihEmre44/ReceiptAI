// ─── Redis Client ───────────────────────────────────────────────────
// SRP: Manages the singleton Redis (ioredis) connection.

import Redis from 'ioredis';
import env from './env.js';

const redisClient = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
        const delay = Math.min(times * 200, 5000);
        return delay;
    },
});

redisClient.on('connect', () => {
    console.log(`[Redis] Connected → ${env.REDIS_URL}`);
});

redisClient.on('error', (err) => {
    console.error(`[Redis] Error: ${err.message}`);
});

export default redisClient;
