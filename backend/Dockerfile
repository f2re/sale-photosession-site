# Stage 1: Build frontend
FROM node:22-alpine AS frontend-builder

ARG CACHEBUST=1

# Accept all VITE_* variables as build args
ARG VITE_API_URL
ARG VITE_WS_URL
ARG VITE_BOT_USERNAME
ARG VITE_ANALYTICS_ID

WORKDIR /frontend

COPY frontend/package*.json ./
RUN npm ci

# Export all as environment variables
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_WS_URL=${VITE_WS_URL}
ENV VITE_BOT_USERNAME=${VITE_BOT_USERNAME}
ENV VITE_ANALYTICS_ID=${VITE_ANALYTICS_ID}

# Debug output
RUN echo "==================================" && \
    echo "Building frontend with variables:" && \
    echo "==================================" && \
    env | grep VITE_ | sort && \
    echo "=================================="

RUN echo "Build: ${CACHEBUST}"

COPY frontend/ ./
RUN npm run build

RUN ls -lah /frontend/dist/

# Stage 2: Backend (без изменений)
FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && \
    apt-get install -y --no-install-recommends rsync tree && \
    rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt && \
    pip install --no-cache-dir 'uvicorn[standard]' websockets

COPY backend/ .
COPY --from=frontend-builder /frontend/dist /app/static-built

RUN ls -lah /app/static-built/ && \
    test -f /app/static-built/index.html || exit 1

RUN mkdir -p /app/logs /app/data /app/static

COPY backend/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

ENV PORT=8000

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]
