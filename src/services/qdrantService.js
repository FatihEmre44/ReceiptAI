

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
     * @returns {Promise<string>} The generated point ID
     */
    async upsertReceipt(vector, payload) {
        const pointId = uuidv4();

        await this._client.upsert(this._collectionName, {
            wait: true,
            points: [
                {
                    id: pointId,
                    vector: vector,
                    payload: payload,
                },
            ],
        });

        console.log(`[Qdrant] Upserted receipt: ${pointId}`);
        return pointId;
    }

    /**
     * Searches for the most similar receipts by vector.
     * @param {number[]} vector - Query embedding
     * @param {number}   limit  - Max results to return
     * @returns {Promise<object[]>} Array of matching points with scores
     */
    async searchSimilar(vector, limit = 5) {
        const results = await this._client.search(this._collectionName, {
            vector: vector,
            limit: limit,
            with_payload: true,
        });

        return results;
    }
}

export default QdrantService;
