

import OpenAI from 'openai';
import env from '../config/env.js';
import FileHelper from '../utils/fileHelper.js';

class OpenAIService {

    constructor() {
        this._client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
    }

    /**
     * Sends a receipt image to GPT-4o Vision and extracts structured data.
     * @param {string} imagePath - Absolute path to the uploaded image
     * @returns {Promise<object>} Parsed receipt data (store, date, items, total…)
     */
    async analyzeReceipt(imagePath) {
        const base64Image = await FileHelper.toBase64(imagePath);

        const response = await this._client.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: `You are a receipt parser. Analyze this receipt image and return a JSON object with:
              {
                "storeName": "",
                "date": "",
                "items": [{ "name": "", "quantity": 1, "price": 0.00 }],
                "subtotal": 0.00,
                "tax": 0.00,
                "total": 0.00,
                "paymentMethod": "",
                "category": ""
              }
              For the "category" field, choose the single best-fit value from this list:
              shopping, food, transportation, utilities, healthcare, entertainment, other.
              Return ONLY valid JSON, no markdown, no explanation.`,
                        },
                        {
                            type: 'image_url',
                            image_url: {
                                url: `data:image/jpeg;base64,${base64Image}`,
                            },
                        },
                    ],
                },
            ],
            max_tokens: 1000,
        });

        let content = response.choices[0].message.content;
        // Strip markdown code fences if GPT wraps the JSON in ```json ... ```
        content = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
        return JSON.parse(content);
    }

    /**
     * Creates a vector embedding from text using text-embedding-3-small.
     * @param {string} text - The text to embed (e.g., receipt summary)
     * @returns {Promise<number[]>} 1536-dimensional vector array
     */
    async createEmbedding(text) {
        const response = await this._client.embeddings.create({
            model: 'text-embedding-3-small',
            input: text,
        });

        return response.data[0].embedding;
    }
}

export default OpenAIService;
