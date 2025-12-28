#!/bin/bash

set -e

BOT_PATH="/opt/telegram-bots-platform/bots/sale-photosession-site"
cd "$BOT_PATH"

echo "🔍 Loading environment variables..."
source .env

# Extract all VITE_* variables and build --build-arg string
BUILD_ARGS=""
while IFS='=' read -r key value; do
    if [[ $key == VITE_* ]]; then
        # Remove quotes from value if present
        value=$(echo "$value" | sed 's/^["'\'']//' | sed 's/["'\'']$//')
        BUILD_ARGS="$BUILD_ARGS --build-arg $key=$value"
        echo "  ✓ $key=$value"
    fi
done < .env

# Add CACHEBUST
CACHEBUST=$(date +%s)
BUILD_ARGS="$BUILD_ARGS --build-arg CACHEBUST=$CACHEBUST"

echo ""
echo "🛑 Stopping containers..."
sudo docker-compose down

echo ""
echo "🗑️  Cleaning static directory..."
sudo rm -rf ./static/*

echo ""
echo "🔨 Building with args:"
echo "$BUILD_ARGS"

# Build with all arguments
sudo docker-compose build $BUILD_ARGS

echo ""
echo "🚀 Starting container..."
sudo docker-compose up -d

echo ""
echo "⏳ Waiting 5 seconds..."
sleep 5

echo ""
echo "📋 Checking build logs..."
sudo docker-compose logs --tail=50 | grep -A 5 "Building frontend with variables" || echo "No debug output found"

echo ""
echo "📁 Verifying static files..."
sudo ls -lh ./static/
sudo ls -lh ./static/assets/ 2>/dev/null || echo "No assets directory yet"

echo ""
echo "✅ Build complete!"
