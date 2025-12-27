#!/bin/bash
set -e

# Copy built static files to mounted volume if empty
if [ -z "$(ls -A /app/static 2>/dev/null)" ]; then
    echo "📦 Copying static files to mounted volume..."
    cp -r /app/static-built/* /app/static/
    echo "✅ Static files copied successfully"
else
    echo "✅ Static files already present"
fi

# Use BACKEND_PORT if set, otherwise use PORT or default to 8000
export PORT=${BACKEND_PORT:-${PORT:-8000}}

echo "🚀 Starting uvicorn on port ${PORT}..."

# Execute CMD - uvicorn will use $PORT environment variable via --port ${PORT}
exec "$@"
