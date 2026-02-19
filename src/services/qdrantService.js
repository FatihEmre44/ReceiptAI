// ─── Qdrant Service ─────────────────────────────────────────────────
// SRP: All Qdrant vector DB operations — upsert, search, list by user.

import { v4 as uuidv4 } from 'uuid';
import { getClient } from '../config/db.js';
import env from '../config/env.js';

class QdrantService {

    constructor() {
        this._client = getClient();
        this._collectionName = env.QDRANT_COLLECTION;
    }

    async ensureCollection() {
        try {
            const collections = await this._client.getCollections();
            const exists = collections.collections.some(
                (c) => c.name === this._collectionName
            );

            if (!exists) {
                await this._client.createCollection(this._collectionName, {
                    vectors: {
                        size: 1536,            // text-embedding-3-small dimension
                        distance: 'Cosine',
                    },
                });
                console.log(`[Qdrant] Collection "${this._collectionName}" created.`);
            } else {
                console.log(`[Qdrant] Collection "${this._collectionName}" already exists.`);
            }
        } catch (error) {
            console.error(`[Qdrant] ensureCollection error: ${error.message}`);
            throw error;
        }
    }

    /**
     * Stores a receipt vector + metadata in Qdrant.
     * @param {number[]} vector  - 1536-dim embedding from OpenAI
     * @param {object}   payload - Receipt data (storeName, items, total…)
     * @param {string}   userId  - Owner's MongoDB user ID
     * @returns {Promise<string>} The generated point ID
     */
    async upsertReceipt(vector, payload, userId) {
        const pointId = uuidv4();

        await this._client.upsert(this._collectionName, {
            wait: true,
            points: [
                {
                    id: pointId,
                    vector: vector,
                    payload: {
                        ...payload,
                        userId: userId,
                        uploadedAt: new Date().toISOString(),
                    },
                },
            ],
        });

        console.log(`[Qdrant] Upserted receipt: ${pointId} (user: ${userId})`);
        return pointId;
    }

    /**
     * Searches for the most similar receipts by vector, scoped to a user.
     * @param {number[]} vector   - Query embedding
     * @param {number}   limit    - Max results to return
     * @param {string}   userId   - Filter results to this user
     * @param {string}   [category] - Optional category filter (e.g. 'shopping', 'food')
     * @returns {Promise<object[]>} Array of matching points with scores
     */
    async searchSimilar(vector, limit = 5, userId, category) {
        const mustConditions = [];

        if (userId) {
            mustConditions.push({ key: 'userId', match: { value: userId } });
        }
        if (category) {
            mustConditions.push({ key: 'category', match: { value: category } });
        }

        const filter = mustConditions.length > 0
            ? { must: mustConditions }
            : undefined;

        const results = await this._client.search(this._collectionName, {
            vector: vector,
            limit: limit,
            with_payload: true,
            filter: filter,
        });

        return results;
    }

    /**
     * Lists all receipts belonging to a specific user.
     * @param {string} userId     - The user's MongoDB ID
     * @param {number} limit      - Max results (default 20)
     * @param {string} [category] - Optional category filter (e.g. 'shopping', 'food')
     * @returns {Promise<object[]>} Array of receipt points
     */
    async getReceiptsByUser(userId, limit = 20, category) {
        const mustConditions = [
            { key: 'userId', match: { value: userId } },
        ];

        if (category) {
            mustConditions.push({ key: 'category', match: { value: category } });
        }

        const results = await this._client.scroll(this._collectionName, {
            filter: {
                must: mustConditions,
            },
            limit: limit,
            with_payload: true,
            with_vector: false,
        });

        return results.points;
    }
}

export default QdrantService;
