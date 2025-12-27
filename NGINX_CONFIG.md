# Nginx Configuration for telegram-bots-platform

This file provides the nginx configuration template for sale-photosession-site.

## Installation

The telegram-bots-platform should auto-generate nginx configuration, but if you need to create it manually:

```bash
# 1. Create nginx config
sudo nano /etc/nginx/sites-available/sale-photosession-site

# 2. Paste the configuration below (adjust ports and domain)

# 3. Enable the site
sudo ln -s /etc/nginx/sites-available/sale-photosession-site /etc/nginx/sites-enabled/

# 4. Test configuration
sudo nginx -t

# 5. Reload nginx
sudo systemctl reload nginx
```

## Current Architecture

**Important**: This site uses a **single-container architecture**. Frontend static files are built during Docker build and served directly by nginx from a mounted volume. No separate frontend service is needed.

## Configuration

```nginx
# Nginx configuration for sale-photosession-site
# Single container architecture - nginx serves static files directly

upstream backend {
    server 127.0.0.1:4196;  # Backend port (INTERNAL ONLY - not exposed to internet)
}

server {
    listen 80;
    server_name yourdomain.com;  # Replace with your actual domain

    # Redirect HTTP to HTTPS (after SSL is configured)
    # return 301 https://$server_name$request_uri;
}

server {
    # listen 443 ssl http2;  # Uncomment after SSL setup
    listen 80;  # Remove this after SSL is configured
    server_name yourdomain.com;

    # Root directory for static files (mounted from Docker container)
    root /opt/telegram-bots-platform/bots/photosession-site/static;
    index index.html;

    # SSL Configuration (uncomment after certbot setup)
    # ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    # ssl_protocols TLSv1.2 TLSv1.3;
    # ssl_ciphers HIGH:!aNULL:!MD5;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Max upload size for image generation
    client_max_body_size 10M;

    # Gzip compression for static files
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json application/xml+rss;

    # Frontend - serve static files with proper caching
    location / {
        try_files $uri $uri/ /index.html;

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # Don't cache index.html
        location = /index.html {
            add_header Cache-Control "no-cache, no-store, must-revalidate";
        }
    }

    # Backend API endpoints
    location /api {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Increase timeouts for long-running requests (image generation)
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
        proxy_send_timeout 300s;
    }

    # API Documentation (Swagger UI)
    location /docs {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /openapi.json {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://backend;
        access_log off;
    }

    # WebSocket for real-time generation status updates
    location /api/generation/ws {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;  # 24 hours for WebSocket
        proxy_send_timeout 86400;
    }

    # Deny access to hidden files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }

    # Logs
    access_log /var/log/nginx/sale-photosession-site-access.log;
    error_log /var/log/nginx/sale-photosession-site-error.log;
}
```

**Note**: The setup-nginx.sh script automatically generates this configuration with the correct paths and domain.

## Port Security

**IMPORTANT**: Backend port is ONLY accessible locally:

### In docker-compose.yml

The configuration binds backend to localhost only:
```yaml
ports:
  - "127.0.0.1:${BACKEND_PORT:-8000}:${BACKEND_PORT:-8000}"
```

**No frontend port** - static files are served directly by nginx from mounted volume:
```yaml
volumes:
  - ./static:/app/static:ro
```

This ensures:
- ✅ Only nginx can access backend
- ✅ No frontend service needed (files served directly)
- ✅ Direct internet access to backend is blocked
- ✅ All traffic goes through nginx (port 80/443)
- ✅ SSL termination happens at nginx
- ✅ Security headers applied by nginx
- ✅ Reduced resource usage (no extra container/port)

### Firewall Rules

The telegram-bots-platform should configure UFW to only allow:
```bash
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 2222/tcp  # SSH (platform uses custom port)
```

Verify firewall:
```bash
sudo ufw status
```

## SSL Setup

After basic setup works, configure SSL:

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal is configured automatically
sudo certbot renew --dry-run
```

## Testing

### 1. Test Frontend (Main Site)
```bash
curl http://yourdomain.com
# Should return HTML of React app
```

### 2. Test Backend API
```bash
curl http://yourdomain.com/api
# Should return {"status": "ok", ...}
```

### 3. Test API Docs
```bash
# Visit in browser
http://yourdomain.com/docs
# Should show Swagger UI
```

### 4. Test WebSocket
```javascript
// In browser console
const ws = new WebSocket('ws://yourdomain.com/api/generation/ws/1');
ws.onopen = () => console.log('Connected');
```

## Troubleshooting

### Frontend shows API response instead of website

**Issue**: Accessing the site shows JSON instead of the React app.

**Cause**: Nginx configuration not set up properly, or static files not mounted.

**Solution**:
```bash
# Check if static files exist
ls -la /opt/telegram-bots-platform/bots/photosession-site/static/

# Verify nginx routing
sudo nginx -t
sudo tail -f /var/log/nginx/sale-photosession-site-error.log

# Rebuild container to regenerate static files
cd /opt/telegram-bots-platform/bots/photosession-site
sudo docker-compose build --no-cache
sudo docker-compose up -d

# Re-run nginx setup
cd app
sudo bash setup-nginx.sh
```

### Cannot access backend port from internet

**Good!** This is the correct security configuration. Only nginx (port 80/443) should be accessible from internet.

**To test locally**:
```bash
# From server
curl http://localhost:4196/api  # Backend API (should work)

# Test static files directly
ls -la /opt/telegram-bots-platform/bots/photosession-site/static/

# From internet (should work through nginx)
curl http://yourdomain.com  # Frontend HTML
curl http://yourdomain.com/api  # Backend API through nginx
```

### "502 Bad Gateway"

**Cause**: Backend container not running, or nginx can't reach backend.

**Solution**:
```bash
# Check container status
sudo docker-compose ps

# Start if not running
sudo docker-compose up -d

# Verify backend is listening
curl http://localhost:${BACKEND_PORT:-8000}/api

# Check nginx error log
sudo tail -f /var/log/nginx/sale-photosession-site-error.log
```

### "404 Not Found" for static files

**Cause**: Static files not properly mounted or not built.

**Solution**:
```bash
# Check if static files exist
ls -la /opt/telegram-bots-platform/bots/photosession-site/static/

# Rebuild container (builds frontend automatically)
sudo docker-compose build --no-cache
sudo docker-compose up -d

# Verify volume mount
sudo docker inspect photosession-site_bot | grep -A 5 "Mounts"
```

## Directory Structure

```
/opt/telegram-bots-platform/bots/sale-photosession-site/
├── app/                          # Git repository
├── docker-compose.yml            # Platform-managed
├── .env                          # Environment variables
├── logs/                         # Application logs
└── data/                         # Persistent data

/etc/nginx/
├── sites-available/
│   └── sale-photosession-site    # Nginx config
└── sites-enabled/
    └── sale-photosession-site    # Symlink

/var/log/nginx/
├── sale-photosession-site-access.log
└── sale-photosession-site-error.log
```

## Quick Fix Commands

```bash
# Reload nginx without downtime
sudo nginx -s reload

# Restart docker containers
cd /opt/telegram-bots-platform/bots/sale-photosession-site
sudo docker-compose restart

# View all logs
sudo docker-compose logs -f

# Check which ports are listening
sudo netstat -tlnp | grep -E ':(80|443|3000|4196)'
```
