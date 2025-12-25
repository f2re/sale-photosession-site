# Database Sharing Guide

This guide explains how to share the PostgreSQL database between the PhotoSession website and Telegram bot when using the telegram-bots-platform.

## Overview

The PhotoSession system consists of two main components:

1. **Website** (this repository): Frontend + Backend API for web access
2. **Telegram Bot**: Bot interface for Telegram users

Both components need to access the **same PostgreSQL database** to share:
- User accounts and authentication
- Photoshoot packages and purchases
- Generated images and style presets
- Payment orders and transactions
- Referral data and analytics

## Database Schema

The shared database contains these main tables:

```sql
users                 -- User accounts (Telegram ID, username, balance)
packages              -- Available photoshoot packages
orders                -- Payment orders (YooKassa)
processed_images      -- Generated AI images
style_presets         -- User's saved style preferences
verification_codes    -- Codes for website login
utm_events            -- Analytics tracking
referrals            -- Referral program data
```

## Setup Options

### Option 1: Install Website First (Recommended)

**Step 1: Install Website with Platform**

```bash
cd /opt/telegram-bots-platform
sudo ./add-bot.sh
```

- Bot name: `photosession-site`
- Repository: `https://github.com/f2re/sale-photosession-site`
- Domain: `photos.yourdomain.com`

Platform creates database: `photosession_site_db`

**Step 2: Get Database Credentials**

```bash
sudo cat /root/.platform/photosession-site_db_credentials
```

Example output:
```
Database: photosession_site_db
User: photosession_site_user
Password: Ab3dF9kL2mP5qR8tY1wZ4vX7cN0jH6sK
Host: 172.25.0.1
Port: 5432
```

**Step 3: Install Bot with Same Database**

Clone bot repository:
```bash
cd /opt/telegram-bots-platform/bots
git clone https://github.com/f2re/sale-photosession-bot photosession-bot
cd photosession-bot
```

Create `.env` file with **same database credentials**:
```env
# Use SAME database as website
DATABASE_URL=postgresql+asyncpg://photosession_site_user:Ab3dF9kL2mP5qR8tY1wZ4vX7cN0jH6sK@172.25.0.1:5432/photosession_site_db

# Or use individual variables
POSTGRES_HOST=172.25.0.1
POSTGRES_PORT=5432
POSTGRES_DB=photosession_site_db
POSTGRES_USER=photosession_site_user
POSTGRES_PASSWORD=Ab3dF9kL2mP5qR8tY1wZ4vX7cN0jH6sK

# Bot configuration
BOT_TOKEN=your_telegram_bot_token
# ... other settings
```

Create `docker-compose.yml`:
```yaml
version: '3.8'

services:
  bot:
    build: .
    env_file:
      - .env
    restart: unless-stopped
    networks:
      - bots_shared_network
    volumes:
      - ./logs:/app/logs
      - ./data:/app/data

networks:
  bots_shared_network:
    external: true
```

Start bot:
```bash
sudo docker-compose up -d --build
```

### Option 2: Combined Repository

Create a monorepo with both bot and website:

```
photosession/
├── bot/              # Telegram bot code
│   ├── Dockerfile
│   └── main.py
├── website/
│   ├── backend/      # Website backend
│   └── frontend/     # Website frontend
└── docker-compose.yml
```

**docker-compose.yml:**
```yaml
version: '3.8'

services:
  bot:
    build: ./bot
    env_file:
      - .env
    restart: unless-stopped
    networks:
      - bots_shared_network
    volumes:
      - ./logs:/app/logs

  backend:
    build: ./website/backend
    ports:
      - "${BACKEND_PORT:-8000}:8000"
    env_file:
      - .env
    restart: unless-stopped
    networks:
      - bots_shared_network

  frontend:
    build: ./website/frontend
    ports:
      - "${FRONTEND_PORT:-3000}:3000"
    env_file:
      - .env
    restart: unless-stopped
    networks:
      - bots_shared_network

networks:
  bots_shared_network:
    external: true
```

All services share the same `.env` and database.

### Option 3: Manual Database Grant

If you need to connect an existing bot to the website's database:

```bash
# Connect to PostgreSQL
sudo -u postgres psql

# Grant access to bot user
GRANT ALL PRIVILEGES ON DATABASE photosession_site_db TO your_bot_user;

# Grant table permissions
\c photosession_site_db
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_bot_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_bot_user;
```

## Verification

Verify both services use the same database:

**Check Website Database:**
```bash
sudo docker exec -it photosession-site_bot_1 python -c "
from app.config import settings
print(settings.database_url)
"
```

**Check Bot Database:**
```bash
sudo docker exec -it photosession-bot_bot_1 python -c "
from config import DATABASE_URL
print(DATABASE_URL)
"
```

Both should show the **same database name and credentials**.

**Test Data Sharing:**

1. Create user via bot:
   - Start bot in Telegram
   - Send `/start` command
   - User should be created in database

2. Login to website:
   - Open `https://photos.yourdomain.com`
   - Login with same Telegram account
   - Should see same user data and balance

3. Check database:
   ```bash
   sudo -u postgres psql -d photosession_site_db -c "SELECT telegram_id, username, photoshoots_left FROM users;"
   ```

## Database Migrations

When updating schema:

**From Website:**
```bash
cd /opt/telegram-bots-platform/bots/photosession-site/app
sudo docker-compose exec bot alembic upgrade head
```

**From Bot:**
```bash
cd /opt/telegram-bots-platform/bots/photosession-bot
sudo docker-compose exec bot alembic upgrade head
```

⚠️ **Important**: Run migrations only once, from either service.

## Connection Pooling

Both services use connection pooling. Default settings:

**Website Backend (SQLAlchemy):**
```python
pool_size=10
max_overflow=20
```

**Bot (asyncpg):**
```python
min_size=5
max_size=20
```

For high traffic, increase pool sizes in respective configs.

## Monitoring Database Connections

```bash
# Check active connections
sudo -u postgres psql -c "
SELECT datname, count(*)
FROM pg_stat_activity
WHERE datname = 'photosession_site_db'
GROUP BY datname;
"

# Check connections by application
sudo -u postgres psql -c "
SELECT application_name, state, count(*)
FROM pg_stat_activity
WHERE datname = 'photosession_site_db'
GROUP BY application_name, state;
"
```

## Backup Database

```bash
# Backup
sudo -u postgres pg_dump photosession_site_db > backup_$(date +%Y%m%d).sql

# Restore
sudo -u postgres psql photosession_site_db < backup_20231201.sql
```

## Troubleshooting

### "Database does not exist"

Check database name:
```bash
sudo -u postgres psql -c "\l" | grep photosession
```

### "Password authentication failed"

Verify credentials:
```bash
sudo cat /root/.platform/photosession-site_db_credentials
```

Update `.env` files with correct credentials.

### "Too many connections"

Increase PostgreSQL max_connections:
```bash
sudo nano /etc/postgresql/*/main/postgresql.conf
# Set: max_connections = 200

sudo systemctl restart postgresql
```

### Tables not found

Run migrations:
```bash
cd /opt/telegram-bots-platform/bots/photosession-site/app
sudo docker-compose exec bot python -m app.database.init_db
```

## Security Best Practices

1. **Never expose database port** externally (use `172.25.0.1` internal IP)
2. **Use strong passwords** (platform auto-generates 32-char passwords)
3. **Regular backups** (automate with cron)
4. **Audit access logs** periodically
5. **Keep credentials in `.env`** (never commit to Git)

## Performance Tips

1. **Use DATABASE_URL** instead of individual params (slightly faster)
2. **Enable connection pooling** (already configured)
3. **Add indexes** for frequently queried fields:
   ```sql
   CREATE INDEX idx_users_telegram_id ON users(telegram_id);
   CREATE INDEX idx_orders_user_id ON orders(user_id);
   ```
4. **Monitor slow queries**:
   ```bash
   sudo -u postgres psql -c "
   SELECT query, mean_exec_time
   FROM pg_stat_statements
   ORDER BY mean_exec_time DESC
   LIMIT 10;
   "
   ```

## Summary

✅ **Shared database** ensures seamless user experience across bot and website
✅ **Same credentials** in both `.env` files
✅ **External network** (`bots_shared_network`) connects services
✅ **Platform manages** database creation and SSL
✅ **Easy scaling** with connection pooling

For issues, check logs:
- Website: `sudo docker logs -f photosession-site_bot_1`
- Bot: `sudo docker logs -f photosession-bot_bot_1`
- Database: `sudo tail -f /var/log/postgresql/postgresql-*-main.log`
