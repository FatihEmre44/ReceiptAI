# ─── Build Stage ────────────────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

# Install dependencies first (layer caching)
COPY package*.json ./
RUN npm ci --omit=dev

# Copy application source
COPY src/ ./src/

# Create uploads directory
RUN mkdir -p uploads

EXPOSE 3000

CMD ["node", "src/app.js"]
