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

## Configuration

```nginx
# Nginx configuration for sale-photosession-site

upstream backend {
    server 127.0.0.1:4196;  # Backend port (INTERNAL ONLY - not exposed to internet)
}

upstream frontend {
    server 127.0.0.1:3000;  # Frontend port (INTERNAL ONLY - not exposed to internet)
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

    # Frontend - serve React app
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
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

## Port Security

**IMPORTANT**: Backend and frontend ports should ONLY be accessible locally:

### In docker-compose.yml

The current configuration exposes ports to the host:
```yaml
ports:
  - "${BACKEND_PORT:-8000}:${BACKEND_PORT:-8000}"
  - "${FRONTEND_PORT:-3000}:3000"
```

For production with nginx, you should bind to localhost only:
```yaml
ports:
  - "127.0.0.1:${BACKEND_PORT:-8000}:${BACKEND_PORT:-8000}"
  - "127.0.0.1:${FRONTEND_PORT:-3000}:3000"
```

This ensures:
- ✅ Only nginx can access backend/frontend
- ✅ Direct internet access to ports is blocked
- ✅ All traffic goes through nginx (port 80/443)
- ✅ SSL termination happens at nginx
- ✅ Security headers applied by nginx

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

**Cause**: Nginx is routing all traffic to backend, or frontend isn't running.

**Solution**:
```bash
# Check if frontend is running
sudo docker ps | grep frontend

# Check frontend logs
sudo docker logs sale-photosession-site_frontend

# Verify nginx routing
sudo nginx -t
sudo tail -f /var/log/nginx/sale-photosession-site-error.log
```

### Cannot access ports from internet

**Good!** This is the correct security configuration. Only nginx (port 80/443) should be accessible from internet.

**To test locally**:
```bash
# From server
curl http://localhost:3000  # Frontend
curl http://localhost:4196  # Backend

# From internet (should work)
curl http://yourdomain.com  # Through nginx
```

### "502 Bad Gateway"

**Cause**: Backend or frontend containers not running.

**Solution**:
```bash
sudo docker-compose ps
sudo docker-compose up -d
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
