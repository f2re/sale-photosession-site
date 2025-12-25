# PhotoSession AI Website

AI-powered photo generation website with Telegram authentication. Works with shared database from [sale-photosession-bot](https://github.com/f2re/sale-photosession-bot).

## 🚀 Quick Deploy

### Production Deployment with telegram-bots-platform

**Recommended for production use!** Deploy this site with automatic SSL, database setup, and monitoring using [telegram-bots-platform](https://github.com/f2re/telegram-bots-platform).

```bash
cd /opt/telegram-bots-platform
sudo ./add-bot.sh
# Repository: https://github.com/f2re/sale-photosession-site
```

📖 **[See detailed platform installation guide →](./PLATFORM_INSTALLATION.md)**
⚠️ **[Troubleshooting common issues →](./TROUBLESHOOTING.md)**

The platform automatically handles:
- ✅ PostgreSQL database creation and configuration
- ✅ Nginx reverse proxy with auto SSL (Let's Encrypt)
- ✅ Docker container orchestration
- ✅ Shared database between bot and site
- ✅ Log management and monitoring
- ✅ Port allocation and firewall configuration

### Development Setup

For local development without the platform, see [Manual Setup](#manual-setup) below.

## Features

- **2 Telegram Auth Methods**:
  - Telegram Login Widget (1-click auth)
  - Code Verification (bot sends 6-digit code)
- **AI Photo Generation**: 4 images per photoshoot
- **YooKassa Payments**: Integrated payment system
- **Yandex Metrika**: Full analytics with UTM tracking
- **Shared Database**: Same DB as Telegram bot
- **Real-time Updates**: WebSocket for generation status

## Tech Stack

### Backend
- FastAPI
- SQLAlchemy (async)
- PostgreSQL
- YooKassa
- OpenRouter (Claude + Gemini)

### Frontend
- React 18
- TypeScript
- Redux Toolkit
- Vite
- React Router

## Manual Setup

For local development or custom deployment (without telegram-bots-platform).

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/sale-photosession-site.git
cd sale-photosession-site
```

### 2. Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your credentials
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### 3. Frontend Setup

```bash
cd frontend
cp .env.example .env
# Edit .env with API URL
npm install
npm run dev
```

### 4. Docker Setup (Development)

For local development:

```bash
docker-compose -f docker-compose.dev.yml up -d
```

**Note**: The main `docker-compose.yml` is configured for production use with telegram-bots-platform. Use `docker-compose.dev.yml` for local development with included PostgreSQL.

## Environment Variables

### Backend (.env)

```env
# Telegram
BOT_TOKEN=your_bot_token
BOT_USERNAME=your_bot_username
BOT_NAME=PhotoSession Bot

# Database (shared with bot)
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/db_name

# OpenRouter API
OPENROUTER_API_KEY=your_key

# YooKassa
YOOKASSA_SHOP_ID=your_shop_id
YOOKASSA_SECRET_KEY=your_secret_key

# JWT
SECRET_KEY=your-secret-key
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:8000
VITE_YANDEX_METRIKA_COUNTER_ID=your_counter_id
```

## Authentication Methods

### Method 1: Telegram Login Widget
- Fast 1-click authentication
- Official Telegram widget
- Automatic user creation

### Method 2: Code Verification
- User enters Telegram username
- Bot sends 6-digit code
- User enters code on website
- Code expires in 5 minutes
- **Requires user to start bot first**

## API Endpoints

### Auth
- `POST /api/auth/telegram-widget` - Login with Telegram widget
- `POST /api/auth/request-code` - Request verification code
- `POST /api/auth/verify-code` - Verify code and login
- `GET /api/auth/bot-info` - Get bot info (username, name)

### Packages
- `GET /api/packages/` - Get all packages

### Payments
- `POST /api/payments/create` - Create payment
- `POST /api/payments/webhook` - YooKassa webhook
- `GET /api/payments/orders/my` - Get user orders

### Generation
- `POST /api/generation/create` - Create generation
- `WS /api/generation/ws/{user_id}` - WebSocket for updates
- `POST /api/generation/style-presets` - Save style preset

### Users
- `GET /api/users/me` - Get current user
- `GET /api/users/me/images` - Get user images
- `GET /api/users/me/style-presets` - Get saved styles

## Database Schema

Shares database with Telegram bot. Key tables:
- `users` - User accounts
- `packages` - Photoshoot packages
- `orders` - Payment orders
- `processed_images` - Generated images
- `style_presets` - Saved styles
- `utm_events` - Analytics events

## Deployment

### Production Build

```bash
# Frontend
cd frontend
npm run build

# Backend
cd backend
pip install -r requirements.txt
```

### Nginx Configuration

See `nginx/nginx.conf` for reverse proxy setup.

### Docker Production

```bash
docker-compose -f docker-compose.prod.yml up -d
```

## Bot Integration

To send verification codes from bot, add this handler:

```python
# In your bot code
from app.utils.verification_codes import generate_verification_code, store_verification_code

@router.message(Command("start"))
async def start_handler(message: Message):
    user = await get_user(message.from_user.id)
    # Send welcome message with link to website
```

## Yandex Metrika Goals

Configure these goals in Yandex Metrika:
1. `signup` - User registration
2. `generation_complete` - Image generation
3. `view_packages` - Packages page view
4. `payment_success` - Successful payment

## Support

For issues or questions:
- Create an issue on GitHub
- Contact: your@email.com

## License

MIT
