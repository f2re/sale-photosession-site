#!/bin/bash
set -e

# Clean and copy static files
echo "🗑️  Removing old static files..."
rm -rf /app/static/*

echo "📦 Copying fresh static files from /app/static-built..."
cp -r /app/static-built/* /app/static/ || {
    echo "❌ ERROR: Failed to copy static files"
    exit 1
}

# Verify
if [ ! -f "/app/static/index.html" ]; then
    echo "❌ ERROR: index.html not found after copy!"
    exit 1
fi

echo "✅ Static files updated ($(ls -1 /app/static/ | wc -l) items)"
ls -lh /app/static/

# Configure port
export PORT=${BACKEND_PORT:-${PORT:-8000}}
echo "🚀 Starting uvicorn on port ${PORT}..."

# Start server
exec "$@"
