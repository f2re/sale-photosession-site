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

# Replace PORT in CMD if BACKEND_PORT is set
if [ -n "$BACKEND_PORT" ]; then
    export PORT=$BACKEND_PORT
fi

# Execute CMD with proper port
exec "$@" --port "${PORT:-8000}"
