

import mongoose from 'mongoose';
import env from './env.js';


export async function connectMongoDB() {
    try {
        await mongoose.connect(env.MONGODB_URI);
        console.log(`[MongoDB] Connected → ${env.MONGODB_URI}`);
    } catch (error) {
        console.error(`[MongoDB] Connection failed: ${error.message}`);
        throw error;
    }

    mongoose.connection.on('error', (err) => {
        console.error(`[MongoDB] Runtime error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
        console.warn('[MongoDB] Disconnected.');
    });
}
