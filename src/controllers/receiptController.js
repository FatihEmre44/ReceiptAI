// ─── Receipt Controller ─────────────────────────────────────────────
// SRP: Only handles HTTP request/response. Zero business logic.
// DIP: Depends on service abstractions, not on OpenAI or Qdrant directly.

import OpenAIService from '../services/openaiService.js';
import QdrantService from '../services/qdrantService.js';
import FileHelper from '../utils/fileHelper.js';

class ReceiptController {

    constructor() {
        this._openaiService = new OpenAIService();
        this._qdrantService = new QdrantService();
    }

    /**
     * POST /api/receipts/upload
     * Uploads a receipt image → analyzes with AI → stores in Qdrant.
     */
    async uploadReceipt(req, res) {
        try {
            // 1. Validate file
            if (!req.file) {
                return res.status(400).json({ error: 'No image file provided.' });
            }

            const imagePath = req.file.path;

            // 2. Analyze receipt with GPT-4o Vision
            const receiptData = await this._openaiService.analyzeReceipt(imagePath);

            // 3. Create embedding from receipt summary text
            const summaryText = `${receiptData.storeName} ${receiptData.date} total:${receiptData.total}`;
            const embedding = await this._openaiService.createEmbedding(summaryText);

            // 4. Store in Qdrant
            const pointId = await this._qdrantService.upsertReceipt(embedding, receiptData);

            // 5. Clean up temp file
            await FileHelper.deleteFile(imagePath);

            // 6. Respond
            return res.status(201).json({
                message: 'Receipt processed successfully.',
                id: pointId,
                data: receiptData,
            });

        } catch (error) {
            console.error(`[Controller] uploadReceipt error: ${error.message}`);
            return res.status(500).json({ error: 'Failed to process receipt.' });
        }
    }

    /**
     * POST /api/receipts/search
     * Accepts a text query → embeds it → searches Qdrant for similar receipts.
     */
    async searchReceipts(req, res) {
        try {
            const { query, limit } = req.body;

            if (!query) {
                return res.status(400).json({ error: 'Search query is required.' });
            }

            // 1. Embed the search query
            const embedding = await this._openaiService.createEmbedding(query);

            // 2. Search Qdrant
            const results = await this._qdrantService.searchSimilar(embedding, limit || 5);

            // 3. Respond
            return res.status(200).json({
                message: `Found ${results.length} result(s).`,
                results: results,
            });

        } catch (error) {
            console.error(`[Controller] searchReceipts error: ${error.message}`);
            return res.status(500).json({ error: 'Failed to search receipts.' });
        }
    }
}

export default ReceiptController;
