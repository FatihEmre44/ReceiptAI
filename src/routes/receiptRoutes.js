// ─── Receipt Routes ─────────────────────────────────────────────────
// SRP: Only defines route mappings. No logic, no middleware config leaking.

import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import ReceiptController from '../controllers/receiptController.js';
import authMiddleware from '../middleware/auth.js';

// ─── ESM __dirname equivalent ───────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Multer Configuration ───────────────────────────────────────────
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '..', '..', 'uploads'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const ext = path.extname(file.originalname);
        cb(null, `receipt-${uniqueSuffix}${ext}`);
    },
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only JPEG, PNG, and WebP images are allowed.'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
});

// ─── Router Setup ───────────────────────────────────────────────────
const router = express.Router();
const controller = new ReceiptController();

// All receipt routes are protected — user must be authenticated
router.use(authMiddleware);

// GET  /api/receipts         → List current user's receipts (optional: ?category=shopping)
router.get('/', (req, res) => {
    controller.listMyReceipts(req, res);
});

// POST /api/receipts/upload  → Upload & analyze a receipt image
router.post('/upload', upload.single('receipt'), (req, res) => {
    controller.uploadReceipt(req, res);
});

// POST /api/receipts/search  → Search similar receipts by text query (optional body: category)
router.post('/search', (req, res) => {
    controller.searchReceipts(req, res);
});

export default router;
