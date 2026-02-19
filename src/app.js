// ─── Load Environment Variables First ────────────────────────────────
import 'dotenv/config';

// ─── Core Dependencies ──────────────────────────────────────────────
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// ─── Internal Modules ───────────────────────────────────────────────
import env from './config/env.js';
import { connectMongoDB } from './config/mongodb.js';
import redisClient from './config/redis.js';
import receiptRoutes from './routes/receiptRoutes.js';
import authRoutes from './routes/authRoutes.js';
import QdrantService from './services/qdrantService.js';

// ─── ESM __dirname equivalent ───────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Express App Initialization ─────────────────────────────────────
const app = express();

// ─── Global Middlewares ─────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Static / Uploads Folder ────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ─── API Routes ─────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/receipts', receiptRoutes);

// ─── Health Check ───────────────────────────────────────────────────
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        service: 'Smart Receipt AI',
        uptime: process.uptime(),
    });
});

// ─── 404 Handler ────────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// ─── Global Error Handler ───────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error(`[ERROR] ${err.message}`);
    res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
});

// ─── Start Server ───────────────────────────────────────────────────
const PORT = env.PORT;

async function startServer() {
    try {
        // 1. Connect to MongoDB
        await connectMongoDB();

        // 2. Verify Redis connection
        await redisClient.ping();
        console.log('[Redis] PING → PONG ✓');

        // 3. Ensure Qdrant collection exists
        const qdrantService = new QdrantService();
        await qdrantService.ensureCollection();

        // 4. Start Express
        app.listen(PORT, () => {
            console.log(`\n🚀 Smart Receipt AI server is running on http://localhost:${PORT}`);
            console.log(`📡 Health check:  http://localhost:${PORT}/health`);
            console.log(`🔐 Auth API:      http://localhost:${PORT}/api/auth`);
            console.log(`📂 Receipts API:  http://localhost:${PORT}/api/receipts\n`);
        });
    } catch (error) {
        console.error(`[Startup] Failed to start server: ${error.message}`);
        process.exit(1);
    }
}

startServer();

export default app;
