

import { QdrantClient } from '@qdrant/js-client-rest';
import env from './env.js';

let _client = null;


export function getClient() {
    if (_client) return _client;

    _client = new QdrantClient({
        url: env.QDRANT_URL,
        checkCompatibility: false,
    });
    console.log(`[DB] QdrantClient connected → ${env.QDRANT_URL}`);
    return _client;
}
