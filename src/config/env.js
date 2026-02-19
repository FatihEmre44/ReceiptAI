// ─── Environment Configuration ──────────────────────────────────────
// SRP: This class has one responsibility — centralize env variables.
// Singleton: Only one instance is ever created and exported.

class Environment {
    constructor() {
        this.PORT = process.env.PORT || 3000;
        this.OPENAI_API_KEY = process.env.OPENAI_API_KEY;
        this.QDRANT_URL = process.env.QDRANT_URL || 'http://localhost:6333';
        this.QDRANT_COLLECTION = process.env.QDRANT_COLLECTION_NAME || 'receipts';

        // MongoDB
        this.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/faturaai';

        // Redis
        this.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

        // JWT
        this.JWT_SECRET = process.env.JWT_SECRET;
        this.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

        this._validate();
        Object.freeze(this);
    }

    /** Fail-fast if critical keys are missing */
    _validate() {
        if (!this.OPENAI_API_KEY) {
            throw new Error('[ENV] OPENAI_API_KEY is required. Check your .env file.');
        }
        if (!this.JWT_SECRET) {
            throw new Error('[ENV] JWT_SECRET is required. Check your .env file.');
        }
    }
}

// Export a single frozen instance (Singleton)
const env = new Environment();
export default env;
