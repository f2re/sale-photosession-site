# Multi-stage build: Frontend (Node.js) → Backend (Python)
# Stage 1: Build frontend
FROM node:22-alpine AS frontend-builder

WORKDIR /frontend

# Copy frontend package files
COPY frontend/package*.json ./

# Install dependencies
RUN npm ci

# Copy frontend source
COPY frontend/ ./

# Build production bundle
RUN npm run build

# Stage 2: Backend + Static files
FROM python:3.11-slim

WORKDIR /app

# Install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application code
COPY backend/ .

# Copy built frontend to temporary location
# (will be copied to /app/static on container startup)
COPY --from=frontend-builder /frontend/dist /app/static-built

# Create directories for logs, data, and static mount point
RUN mkdir -p /app/logs /app/data /app/static

# Copy entrypoint script
COPY backend/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Use PORT or BACKEND_PORT from environment, default to 8000
ENV PORT=8000

# Entrypoint will copy static files to mounted volume, then start backend
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]
