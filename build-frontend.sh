#!/bin/bash
# Build frontend static files for nginx
# Run this script when you need to rebuild the frontend

set -e

echo "🔨 Building frontend..."

# Build using docker
docker build -t photosession-frontend-builder ./app/frontend

# Create output directory
mkdir -p ./frontend-dist

# Extract built files from container
docker create --name temp-frontend photosession-frontend-builder
docker cp temp-frontend:/app/dist/. ./frontend-dist/
docker rm temp-frontend

echo "✅ Frontend built successfully!"
echo "📁 Files available in: ./frontend-dist/"
echo "🌐 Nginx will serve these files"

# Set proper permissions
chmod -R 755 ./frontend-dist

ls -lh ./frontend-dist/
