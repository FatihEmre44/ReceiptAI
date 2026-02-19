

import fs from 'fs/promises';
import path from 'path';

class FileHelper {

    /**
     * Deletes a file from disk after processing is complete.
     * Fails silently if the file is already gone.
     * @param {string} filePath - Absolute path to the file
     */
    static async deleteFile(filePath) {
        try {
            await fs.unlink(filePath);
            console.log(`[FileHelper] Deleted: ${path.basename(filePath)}`);
        } catch (error) {
            console.warn(`[FileHelper] Could not delete ${filePath}: ${error.message}`);
        }
    }

    /**
     * Reads a file and returns its content as a Base64 string.
     * Used to send images to OpenAI Vision API.
     * @param {string} filePath - Absolute path to the image
     * @returns {Promise<string>} Base64 encoded string
     */
    static async toBase64(filePath) {
        const buffer = await fs.readFile(filePath);
        return buffer.toString('base64');
    }
}

export default FileHelper;
