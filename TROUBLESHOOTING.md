# Troubleshooting Guide

Common issues when deploying with telegram-bots-platform and their solutions.

## Build Errors

### Error: "failed to read dockerfile: open Dockerfile: no such file or directory"

**Cause**: The platform's docker-compose.yml has incorrect build context paths.

**Solution 1: Use Repository docker-compose.yml**

After cloning the repository with `add-bot.sh`, copy our docker-compose.yml to the bot directory:

```bash
cd /opt/telegram-bots-platform/bots/sale-photosession-site
cp app/docker-compose.yml ./docker-compose.yml
```

**Solution 2: Manual docker-compose.yml Fix**

If the platform generated a docker-compose.yml, update the build contexts:

```bash
cd /opt/telegram-bots-platform/bots/sale-photosession-site
nano docker-compose.yml
```

Change build contexts to reference the `app/` directory:

```yaml
services:
  bot:
    build:
      context: ./app/backend
      dockerfile: Dockerfile
    # ... rest of config

  frontend:
    build:
      context: ./app/frontend
      dockerfile: Dockerfile
    # ... rest of config
```

**Solution 3: Rebuild from Scratch**

```bash
cd /opt/telegram-bots-platform/bots/sale-photosession-site
sudo docker-compose down -v
sudo docker-compose up -d --build
```

### Error: "network bots_shared_network declared as external, but could not be found"

**Cause**: The platform's shared network hasn't been created.

**Solution**:

```bash
sudo docker network create bots_shared_network
```

Then rebuild:

```bash
cd /opt/telegram-bots-platform/bots/sale-photosession-site
sudo docker-compose up -d
```

### Error: "Port is already allocated"

**Cause**: The port specified in .env is already in use.

**Solution**: Change the port in `.env`:

```bash
cd /opt/telegram-bots-platform/bots/sale-photosession-site
nano .env
```

Update:
```env
BACKEND_PORT=8001  # Change from 8000
FRONTEND_PORT=3001  # Change from 3000
```

Restart:
```bash
sudo docker-compose down
sudo docker-compose up -d
```

## Database Errors

### Error: "database does not exist"

**Cause**: PostgreSQL database wasn't created or has wrong name.

**Solution 1: Check Database Name**

```bash
sudo -u postgres psql -c "\l" | grep photosession
```

**Solution 2: Create Database Manually**

```bash
# Get credentials
sudo cat /root/.platform/sale-photosession-site_db_credentials

# Create database
sudo -u postgres psql
CREATE DATABASE photosession_site_db;
CREATE USER photosession_site_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE photosession_site_db TO photosession_site_user;
\q
```

### Error: "password authentication failed"

**Cause**: Incorrect database credentials in .env.

**Solution**: Verify and update credentials:

```bash
# Check platform credentials
sudo cat /root/.platform/sale-photosession-site_db_credentials

# Update .env
cd /opt/telegram-bots-platform/bots/sale-photosession-site
nano .env
```

Update with correct credentials:
```env
DATABASE_URL=postgresql+asyncpg://correct_user:correct_password@172.25.0.1:5432/correct_db
```

Restart services:
```bash
sudo docker-compose restart
```

### Error: "relation 'users' does not exist"

**Cause**: Database tables haven't been created (migrations not run).

**Solution**: Run database initialization:

```bash
cd /opt/telegram-bots-platform/bots/sale-photosession-site

# Option 1: Run migrations in backend container
sudo docker-compose exec bot python -c "
from app.database.models import Base
from app.database.session import engine
import asyncio

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

asyncio.run(init_db())
"

# Option 2: If you have alembic migrations
sudo docker-compose exec bot alembic upgrade head
```

## Application Errors

### Error: "ModuleNotFoundError: No module named 'psycopg2'"

**Cause**: Missing psycopg2 package (required by SQLAlchemy/Alembic even with asyncpg).

**Solution**: Ensure requirements.txt includes psycopg2-binary:

```bash
cd /opt/telegram-bots-platform/bots/sale-photosession-site/app
grep psycopg2 backend/requirements.txt
# Should show: psycopg2-binary==2.9.9

# If missing, rebuild:
cd ..
sudo docker-compose down
sudo docker-compose build --no-cache bot
sudo docker-compose up -d
```

**Note**: Even though we use asyncpg for async operations, SQLAlchemy and Alembic require psycopg2 for sync operations and migrations.

### Error: "uvicorn: command not found" or "serve: command not found"

**Cause**: Dependencies not installed in Docker image.

**Solution**: Rebuild containers:

```bash
cd /opt/telegram-bots-platform/bots/sale-photosession-site
sudo docker-compose down
sudo docker-compose build --no-cache
sudo docker-compose up -d
```

### Backend returns 500 errors

**Cause**: Usually environment variables missing or database connection failed.

**Solution**: Check logs and verify configuration:

```bash
# Check backend logs
sudo docker logs sale-photosession-site_bot

# Verify environment variables
sudo docker-compose exec bot env | grep -E "DATABASE_URL|BOT_TOKEN|OPENROUTER"

# Test database connection
sudo docker-compose exec bot python -c "
from app.config import settings
print('Database URL:', settings.database_url)
"
```

### Frontend shows blank page or errors

**Cause**: API URL not configured or backend not accessible.

**Solution**: Check frontend environment and connectivity:

```bash
# Check frontend logs
sudo docker logs sale-photosession-site_frontend

# Verify API_URL in .env
cat /opt/telegram-bots-platform/bots/sale-photosession-site/.env | grep API_URL

# Test backend connectivity from frontend container
sudo docker-compose exec frontend wget -O- http://bot:${BACKEND_PORT}/docs
```

## Platform-Specific Issues

### Platform update script fails

**Solution**: Manual update process:

```bash
cd /opt/telegram-bots-platform/bots/sale-photosession-site/app
sudo git pull origin main
cd ..
sudo docker-compose down
sudo docker-compose build --no-cache
sudo docker-compose up -d
```

### Bot not accessible via domain

**Cause**: Nginx configuration issue or SSL certificate problem.

**Solution 1: Check Nginx**

```bash
# Test nginx configuration
sudo nginx -t

# Check nginx logs
sudo tail -f /var/log/nginx/error.log

# Reload nginx
sudo systemctl reload nginx
```

**Solution 2: Check SSL Certificate**

```bash
# Check certificate
sudo certbot certificates

# Renew if needed
sudo certbot renew --dry-run
sudo certbot renew

# Restart nginx
sudo systemctl restart nginx
```

**Solution 3: Verify Nginx Config**

```bash
# Check site config
sudo cat /etc/nginx/sites-available/sale-photosession-site

# Ensure it includes:
# - Correct domain
# - Correct backend port
# - SSL certificate paths
```

### Logs not persisting

**Cause**: Log volume not mounted correctly.

**Solution**: Verify volume mounts:

```bash
cd /opt/telegram-bots-platform/bots/sale-photosession-site

# Check if logs directory exists
ls -la logs/

# If not, create it
mkdir -p logs data

# Restart with proper permissions
sudo chown -R 1000:1000 logs data
sudo docker-compose restart
```

## Docker Issues

### Container exits immediately after starting

**Solution**: Check container logs for errors:

```bash
# View container logs
sudo docker-compose logs bot
sudo docker-compose logs frontend

# Start in foreground to see errors
sudo docker-compose up bot
```

### Out of disk space

**Solution**: Clean up Docker:

```bash
# Remove unused containers, images, volumes
sudo docker system prune -a --volumes

# Check disk usage
df -h
sudo docker system df
```

## Environment Variable Issues

### Variables not being read

**Cause**: .env file location or format issues.

**Solution**:

```bash
cd /opt/telegram-bots-platform/bots/sale-photosession-site

# Verify .env exists
ls -la .env

# Check .env format (no spaces around =)
cat .env | head -20

# Restart to reload environment
sudo docker-compose down
sudo docker-compose up -d
```

### BOT_NAME variable issue

**Cause**: BOT_NAME not set, causing container naming conflicts.

**Solution**: Add to `.env`:

```env
BOT_NAME=sale-photosession-site
```

## Performance Issues

### Slow image generation

**Cause**: OpenRouter API slow or rate limited.

**Solution**:
- Check OpenRouter API key and limits
- Consider caching or queue system
- Monitor API response times in logs

### High memory usage

**Solution**: Limit container resources:

```bash
cd /opt/telegram-bots-platform/bots/sale-photosession-site
nano docker-compose.yml
```

Add resource limits:
```yaml
services:
  bot:
    # ...
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          memory: 512M
```

## Getting Help

If issues persist:

1. **Check logs**:
   ```bash
   sudo docker-compose logs -f
   ```

2. **Verify configuration**:
   ```bash
   sudo docker-compose config
   ```

3. **Test database connection**:
   ```bash
   sudo -u postgres psql -d photosession_site_db -c "SELECT version();"
   ```

4. **Check network connectivity**:
   ```bash
   sudo docker network inspect bots_shared_network
   ```

5. **Review platform logs**:
   ```bash
   sudo journalctl -u docker -n 100
   ```

6. **Create GitHub issue**:
   - Include error messages
   - Include relevant logs
   - Include docker-compose.yml (remove secrets)
   - Include environment (OS, Docker version, platform version)

## Quick Debug Checklist

- [ ] `.env` file exists with all required variables
- [ ] Database credentials are correct
- [ ] Database exists and is accessible
- [ ] Docker network `bots_shared_network` exists
- [ ] Ports are not in use by other services
- [ ] Nginx configuration is correct
- [ ] SSL certificates are valid
- [ ] Docker has sufficient disk space
- [ ] All required API keys are set (BOT_TOKEN, OPENROUTER_API_KEY, YOOKASSA_*)
- [ ] Domain DNS points to server
- [ ] Firewall allows ports 80, 443, and custom bot ports

## Useful Commands

```bash
# Full restart
cd /opt/telegram-bots-platform/bots/sale-photosession-site
sudo docker-compose down -v
sudo docker-compose up -d --build

# View all logs
sudo docker-compose logs -f

# Check container status
sudo docker-compose ps

# Execute command in container
sudo docker-compose exec bot bash

# Rebuild single service
sudo docker-compose up -d --build bot

# Remove everything and start fresh
sudo docker-compose down -v --rmi all
sudo docker-compose up -d --build
```
