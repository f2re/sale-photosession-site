# Quick Deployment Fix Guide

This guide fixes the empty static directory and WebSocket issues.

## Issues Fixed

1. ✅ **Empty static directory** - Multi-stage build now properly implemented
2. ✅ **WebSocket warnings** - Added explicit websockets dependency
3. ✅ **404 on /api** - Added /api root endpoint
4. ✅ **Port handling** - Fixed entrypoint script for proper PORT variable usage

## Deployment Steps on Server

Run these commands on your server at `/opt/telegram-bots-platform/bots/sale-photosession-site`:

### 1. Pull Latest Changes

```bash
cd /opt/telegram-bots-platform/bots/sale-photosession-site/app
sudo git pull origin claude/telegram-make-integration-gaRbf
```

**Expected output:**
```
From https://github.com/f2re/sale-photosession-site
 * branch            claude/telegram-make-integration-gaRbf -> FETCH_HEAD
Updating 59fead3..9a13a39
Fast-forward
 backend/Dockerfile            | 8 ++++----
 backend/docker-entrypoint.sh  | 12 ++++++------
 backend/requirements.txt      | 1 +
 backend/app/main.py          | 10 ++++++++++
 4 files changed, 21 insertions(+), 10 deletions(-)
```

### 2. Verify Files Exist

```bash
# Check if entrypoint script exists
sudo ls -lh /opt/telegram-bots-platform/bots/sale-photosession-site/app/backend/docker-entrypoint.sh

# Should show:
# -rwxr-xr-x 1 root root 419 Dec 27 XX:XX docker-entrypoint.sh

# Check if Dockerfile was updated
sudo grep -n "frontend-builder" /opt/telegram-bots-platform/bots/sale-photosession-site/app/backend/Dockerfile

# Should show multi-stage build lines
```

### 3. Copy Updated docker-compose.yml

```bash
cd /opt/telegram-bots-platform/bots/sale-photosession-site
sudo cp app/docker-compose.yml ./docker-compose.yml
```

### 4. Stop Existing Container

```bash
sudo docker-compose down
```

### 5. Clean Up Old Images (Optional but Recommended)

```bash
# Remove old images to force clean build
sudo docker system prune -af --filter "label=com.docker.compose.project=sale-photosession-site"
```

### 6. Build with Multi-Stage Dockerfile

```bash
sudo docker-compose build --no-cache
```

**What happens during build:**
```
[+] Building 120.5s (18/18) FINISHED
 => [frontend-builder 1/6] FROM docker.io/library/node:22-alpine
 => [frontend-builder 2/6] WORKDIR /frontend
 => [frontend-builder 3/6] COPY frontend/package*.json ./
 => [frontend-builder 4/6] RUN npm ci
 => [frontend-builder 5/6] COPY frontend/ ./
 => [frontend-builder 6/6] RUN npm run build           ← Frontend builds here
 => [stage-1 1/9] FROM docker.io/library/python:3.11-slim
 => [stage-1 5/9] COPY backend/ .
 => [stage-1 6/9] COPY --from=frontend-builder /frontend/dist /app/static-built  ← Static files copied
 => [stage-1 8/9] COPY backend/docker-entrypoint.sh /docker-entrypoint.sh
 => exporting to image
```

### 7. Start Container

```bash
sudo docker-compose up -d
```

### 8. Verify Startup

```bash
# Watch container logs
sudo docker-compose logs -f bot
```

**Expected output:**
```
📦 Copying static files to mounted volume...
✅ Static files copied successfully
🚀 Starting uvicorn on port 4196...
INFO:     Started server process [1]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:4196 (Press CTRL+C to quit)
```

**Press Ctrl+C to exit logs.**

### 9. Verify Static Files

```bash
# Check if static files were copied
sudo ls -lah /opt/telegram-bots-platform/bots/sale-photosession-site/static/

# Should show:
# total XXX
# drwxr-xr-x  3 root root 4.0K Dec 27 XX:XX .
# drwxr-xr-x  6 root root 4.0K Dec 27 XX:XX ..
# drwxr-xr-x  2 root root 4.0K Dec 27 XX:XX assets
# -rw-r--r--  1 root root  XXX Dec 27 XX:XX index.html
# -rw-r--r--  1 root root  XXX Dec 27 XX:XX vite.svg

# Count files
sudo find /opt/telegram-bots-platform/bots/sale-photosession-site/static/ -type f | wc -l

# Should show: 10+ files (index.html, JS bundles, CSS, icons, etc.)
```

### 10. Test Backend API

```bash
# Test API root
curl http://localhost:4196/api

# Should return:
# {"status":"ok","message":"PhotoSession Website API","version":"1.0.0","docs":"/docs"}

# Test health endpoint
curl http://localhost:4196/health

# Should return:
# {"status":"healthy"}
```

### 11. Configure Nginx

```bash
cd /opt/telegram-bots-platform/bots/sale-photosession-site/app
sudo bash setup-nginx.sh
# Enter your domain when prompted
```

### 12. Test Website

```bash
# Test if nginx serves static files
curl http://localhost/ | head -20

# Should show HTML with <!doctype html>

# Test through domain
curl https://yourdomain.com/ | head -20

# Should show the React app HTML
```

### 13. Check WebSocket Support

```bash
# Check container logs for WebSocket warnings
sudo docker-compose logs bot | grep -i websocket

# Should NOT show:
# "WARNING: No supported WebSocket library detected"

# If you see the warning, the websockets package wasn't installed
# Check requirements.txt contains: websockets==12.0
```

## Troubleshooting

### Static Directory Still Empty

```bash
# Check if container is running
sudo docker-compose ps

# Check logs for copy message
sudo docker-compose logs bot | grep -i "static"

# Should see: "📦 Copying static files to mounted volume..."

# If not, rebuild:
sudo docker-compose down
sudo docker-compose build --no-cache
sudo docker-compose up -d
```

### Build Fails: "docker-entrypoint.sh not found"

```bash
# Verify file exists in repo
sudo ls -la /opt/telegram-bots-platform/bots/sale-photosession-site/app/backend/docker-entrypoint.sh

# If missing, pull again:
cd /opt/telegram-bots-platform/bots/sale-photosession-site/app
sudo git fetch origin claude/telegram-make-integration-gaRbf
sudo git reset --hard origin/claude/telegram-make-integration-gaRbf
```

### WebSocket Warning Still Appears

```bash
# Check if websockets package is installed
sudo docker-compose exec bot pip list | grep websockets

# Should show:
# websockets    12.0

# If not shown, rebuild:
sudo docker-compose down
sudo docker-compose build --no-cache
sudo docker-compose up -d
```

### Port Issues

```bash
# Check what port container is using
sudo docker-compose exec bot env | grep PORT

# Should show:
# PORT=4196
# BACKEND_PORT=4196

# Check if port is listening
sudo netstat -tlnp | grep 4196

# Should show:
# tcp  0  0  127.0.0.1:4196  0.0.0.0:*  LISTEN  <pid>/docker-proxy
```

## Success Checklist

After deployment, verify:

- [ ] Static directory contains 10+ files (index.html, assets/, etc.)
- [ ] Container logs show "✅ Static files copied successfully"
- [ ] Container logs show "🚀 Starting uvicorn on port XXXX..."
- [ ] No WebSocket warnings in logs
- [ ] `curl http://localhost:4196/api` returns JSON
- [ ] `curl http://localhost/` returns HTML (through nginx)
- [ ] Website accessible at https://yourdomain.com
- [ ] Browser console shows no 404 errors for static files

## Final Notes

**What changed:**

1. **Dockerfile**: Now has multi-stage build (Node.js → Python)
2. **Entrypoint script**: Copies static files to volume on startup
3. **Requirements**: Added websockets==12.0 for WebSocket support
4. **Main.py**: Added /api endpoint to prevent 404

**How it works:**

```
Docker Build:
  Stage 1 (Node.js) → Builds React app → /frontend/dist
  Stage 2 (Python) → Copies /frontend/dist → /app/static-built

Docker Run:
  Entrypoint → Checks /app/static is empty
  Entrypoint → Copies /app/static-built/* → /app/static/
  Entrypoint → Starts uvicorn on configured port

Nginx:
  Serves files from ./static/ (mounted from /app/static)
  Proxies /api to localhost:4196
```

**Need help?** Check the container logs:
```bash
sudo docker-compose logs -f bot
```
