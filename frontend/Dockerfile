FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install serve for static file serving
RUN npm install -g serve

# Copy built files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./

# Create logs directory
RUN mkdir -p /app/logs

EXPOSE 3000

# Serve static files
CMD ["serve", "-s", "dist", "-l", "3000"]
