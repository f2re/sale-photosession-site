## Структура проекта

### Корневая структура папок

```
photoshoot-website/
├── backend/                    # Backend на FastAPI
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py            # Точка входа FastAPI
│   │   ├── config.py          # Конфигурация (общая с ботом)
│   │   ├── database/          # Модели БД (общие с ботом)
│   │   │   ├── __init__.py
│   │   │   ├── models.py      # SQLAlchemy модели
│   │   │   ├── crud.py        # CRUD операции
│   │   │   └── session.py     # Сессии БД
│   │   ├── api/               # API endpoints
│   │   │   ├── __init__.py
│   │   │   ├── auth.py        # Аутентификация
│   │   │   ├── users.py       # Пользователи
│   │   │   ├── packages.py    # Пакеты
│   │   │   ├── generation.py  # Генерация фото
│   │   │   ├── payments.py    # ЮKassa интеграция
│   │   │   └── styles.py      # Стили фотосессий
│   │   ├── services/          # Бизнес-логика
│   │   │   ├── __init__.py
│   │   │   ├── auth_service.py      # Telegram авторизация
│   │   │   ├── generation_service.py # AI генерация
│   │   │   ├── payment_service.py   # Оплата
│   │   │   ├── analytics_service.py # Метрика/UTM
│   │   │   └── websocket_service.py # WebSocket для статусов
│   │   ├── schemas/           # Pydantic схемы
│   │   │   ├── __init__.py
│   │   │   ├── user.py
│   │   │   ├── package.py
│   │   │   ├── generation.py
│   │   │   └── payment.py
│   │   ├── middleware/        # Middleware
│   │   │   ├── __init__.py
│   │   │   ├── cors.py
│   │   │   ├── auth.py
│   │   │   └── analytics.py   # UTM tracking
│   │   └── utils/
│   │       ├── __init__.py
│   │       ├── telegram.py    # Telegram интеграция
│   │       ├── utm_parser.py  # UTM обработка
│   │       └── metrika.py     # Яндекс.Метрика API
│   ├── alembic/               # Миграции БД (общие с ботом)
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/                   # Frontend на React + TypeScript
│   ├── public/
│   │   ├── index.html
│   │   └── favicon.ico
│   ├── src/
│   │   ├── app/
│   │   │   ├── App.tsx
│   │   │   ├── App.css
│   │   │   └── store.ts       # Redux store
│   │   ├── components/        # UI компоненты
│   │   │   ├── common/        # Общие компоненты
│   │   │   │   ├── Button/
│   │   │   │   ├── Loader/
│   │   │   │   ├── Modal/
│   │   │   │   ├── Toast/
│   │   │   │   └── ProgressBar/
│   │   │   ├── auth/          # Авторизация
│   │   │   │   ├── TelegramAuth/
│   │   │   │   ├── CodeInput/
│   │   │   │   └── AuthGuard/
│   │   │   ├── generation/    # Генерация
│   │   │   │   ├── ImageUploader/
│   │   │   │   ├── StyleSelector/
│   │   │   │   ├── GenerationStatus/
│   │   │   │   ├── ResultGallery/
│   │   │   │   └── ProcessingSteps/
│   │   │   ├── packages/      # Пакеты
│   │   │   │   ├── PackageCard/
│   │   │   │   ├── PackageList/
│   │   │   │   └── PurchaseModal/
│   │   │   ├── profile/       # Профиль
│   │   │   │   ├── UserInfo/
│   │   │   │   ├── Balance/
│   │   │   │   ├── History/
│   │   │   │   └── SavedStyles/
│   │   │   └── layout/        # Лайаут
│   │   │       ├── Header/
│   │   │       ├── Sidebar/
│   │   │       └── Footer/
│   │   ├── pages/             # Страницы
│   │   │   ├── HomePage.tsx
│   │   │   ├── GeneratePage.tsx
│   │   │   ├── PackagesPage.tsx
│   │   │   ├── ProfilePage.tsx
│   │   │   ├── HistoryPage.tsx
│   │   │   ├── AuthPage.tsx
│   │   │   └── PaymentPage.tsx
│   │   ├── features/          # Redux slices
│   │   │   ├── auth/
│   │   │   ├── generation/
│   │   │   ├── packages/
│   │   │   └── user/
│   │   ├── services/          # API клиенты
│   │   │   ├── api.ts         # Axios instance
│   │   │   ├── authApi.ts
│   │   │   ├── generationApi.ts
│   │   │   ├── packagesApi.ts
│   │   │   └── websocket.ts
│   │   ├── hooks/             # Custom hooks
│   │   │   ├── useAuth.ts
│   │   │   ├── useWebSocket.ts
│   │   │   ├── useMetrika.ts
│   │   │   └── useUTM.ts
│   │   ├── utils/             # Утилиты
│   │   │   ├── metrika.ts
│   │   │   ├── utm.ts
│   │   │   └── format.ts
│   │   └── styles/            # Глобальные стили
│   │       ├── globals.css
│   │       └── variables.css
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── shared/                     # Общий код
│   └── database/              # Общие модели БД
│
├── nginx/                      # Nginx конфиг
│   └── nginx.conf
│
├── docker-compose.yml          # Docker compose для деплоя
└── README.md
```


## Логика работы сайта

### Пользовательский флоу

#### 1. Авторизация через Telegram

**Варианты авторизации:**

**Вариант A: Telegram Login Widget (рекомендуется)**

- Пользователь нажимает "Войти через Telegram"
- Открывается официальный виджет Telegram
- Подтверждение в 1 клик
- Автоматическое создание/обновление профиля
- Токен JWT для сессии

**Вариант B: Верификация через код**

- Пользователь вводит Telegram username
- Бот отправляет 6-значный код
- Пользователь вводит код на сайте
- Код действителен 5 минут
- При успехе - JWT токен

**Технические детали:**

```typescript
// Frontend: TelegramAuth.tsx
const handleTelegramAuth = async (data: TelegramAuthData) => {
  // Проверка подписи от Telegram
  const response = await authApi.loginTelegram(data);
  // Сохранение JWT токена
  localStorage.setItem('token', response.token);
  // Redirect на главную
  navigate('/');
};

// Backend: auth.py
@router.post("/auth/telegram")
async def login_telegram(data: TelegramAuthData):
    # Проверка подписи Telegram
    if not verify_telegram_auth(data):
        raise HTTPException(401, "Invalid auth")

    # Поиск/создание пользователя
    user = await get_or_create_user(data.id)

    # Генерация JWT
    token = create_jwt_token(user.id)

    return {"token": token, "user": user}
```


#### 2. Главная страница

**Элементы:**

- Hero секция с примерами генераций
- Краткое описание возможностей
- Кнопка "Начать генерировать"
- Информация о балансе (если авторизован)
- Быстрый доступ к пакетам

**UTM tracking:**

```typescript
// При загрузке страницы
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const utmData = extractUTM(params);

  // Сохранение UTM в localStorage для новых пользователей
  if (utmData && !localStorage.getItem('utm_saved')) {
    localStorage.setItem('utm_data', JSON.stringify(utmData));
  }

  // Отправка в Метрику
  ym('reachGoal', 'page_view', utmData);
}, []);
```


#### 3. Страница генерации

**Процесс генерации с визуализацией:**

**Шаг 1: Загрузка изображения**

- Drag \& drop или выбор файла
- Превью загруженного изображения
- Валидация (размер, формат)
- Кнопка "Далее"

**Шаг 2: Выбор стиля**

- Предложенные стили (генерируются AI)
- Сохраненные стили пользователя
- Кастомное описание стиля
- Превью примеров

**Шаг 3: Генерация**

Визуализация процесса в реальном времени через WebSocket:

```typescript
// GenerationStatus.tsx
const steps = [
  { id: 'upload', label: 'Загрузка изображения', icon: '📤' },
  { id: 'analyze', label: 'Анализ продукта', icon: '🔍' },
  { id: 'prompt', label: 'Создание промпта', icon: '🤖' },
  { id: 'generate', label: 'Генерация изображений', icon: '🎨' },
  { id: 'complete', label: 'Готово!', icon: '✅' }
];

// WebSocket обновления
useWebSocket('/ws/generation', (event) => {
  switch(event.status) {
    case 'analyzing':
      setCurrentStep('analyze');
      setProgress(20);
      break;
    case 'generating_prompt':
      setCurrentStep('prompt');
      setProgress(40);
      break;
    case 'generating_images':
      setCurrentStep('generate');
      setProgress(60);
      break;
    case 'completed':
      setCurrentStep('complete');
      setProgress(100);
      showResults(event.images);
      break;
  }
});
```

**Визуальные индикаторы:**

- Прогресс-бар с процентами
- Анимированные иконки текущего шага
- Текстовое описание действия
- Примерное время ожидания
- Возможность отмены

**Шаг 4: Результаты**

- Галерея сгенерированных изображений
- Увеличение по клику
- Скачивание отдельных или всех
- Кнопка "Сгенерировать еще"
- Сохранение стиля


#### 4. Страница пакетов

**UI/UX дизайн:**

```typescript
// PackageCard.tsx
<Card highlighted={package.isPopular}>
  <Badge>🔥 Популярный</Badge>
  <Title>{package.name}</Title>
  <Description>{package.description}</Description>

  <PriceBlock>
    <Price>{package.price}₽</Price>
    <PricePerUnit>
      {Math.round(package.price / package.photoshoots)}₽ за фотосессию
    </PricePerUnit>
  </PriceBlock>

  <Features>
    <Feature>📸 {package.photoshoots} фотосессий</Feature>
    <Feature>🖼️ {package.images_per_shoot} изображений каждая</Feature>
    {package.features.map(f => <Feature key={f}>✓ {f}</Feature>)}
  </Features>

  <Button
    onClick={() => handlePurchase(package.id)}
    disabled={user.balance >= package.photoshoots}
  >
    {user.balance >= package.photoshoots
      ? '✓ Уже куплен'
      : '💳 Купить'
    }
  </Button>
</Card>
```

**Сравнительная таблица:**

- Для десктопа - таблица side-by-side
- Для мобильных - карточки


#### 5. Оплата через ЮKassa

**Процесс оплаты:**

```typescript
// Backend: payments.py
@router.post("/payments/create")
async def create_payment(
    package_id: int,
    user: User = Depends(get_current_user)
):
    package = await get_package(package_id)

    # Создание заказа в БД
    order = await create_order(
        user_id=user.id,
        package_id=package_id,
        amount=package.price
    )

    # Создание платежа в ЮKassa
    payment = Payment.create({
        "amount": {
            "value": str(package.price),
            "currency": "RUB"
        },
        "confirmation": {
            "type": "redirect",
            "return_url": f"{SITE_URL}/payment/success"
        },
        "capture": True,
        "description": f"Пакет {package.name}",
        "metadata": {
            "order_id": order.id,
            "user_id": user.id
        }
    })

    # Сохранение payment_id
    await update_order(order.id, payment_id=payment.id)

    return {
        "payment_url": payment.confirmation.confirmation_url,
        "order_id": order.id
    }

// Webhook для обработки оплаты
@router.post("/payments/webhook")
async def payment_webhook(notification: dict):
    payment_id = notification['object']['id']
    status = notification['object']['status']

    if status == 'succeeded':
        # Найти заказ
        order = await get_order_by_payment_id(payment_id)

        # Начислить фотосессии
        await add_photoshoots(
            order.user_id,
            order.package.photoshoots
        )

        # Обновить статус
        await update_order(order.id, status='paid')

        # Отправить уведомление в бот
        await send_telegram_notification(
            order.user_id,
            f"✅ Оплата прошла успешно! Начислено {order.package.photoshoots} фотосессий"
        )

        # Метрика цель
        await track_event(
            user_id=order.user_id,
            event='purchase',
            value=order.amount
        )

    return {"status": "ok"}
```

**Страница успешной оплаты:**

- Конфетти анимация 🎉
- "Спасибо за покупку!"
- Информация о начисленных фотосессиях
- Кнопка "Начать генерировать"
- Автоматический редирект через 5 сек


#### 6. Профиль пользователя

**Разделы:**

**Баланс:**

- Количество оставшихся фотосессий
- Кнопка "Купить еще"
- История покупок

**История генераций:**

- Все сгенерированные изображения
- Фильтры по дате, стилю
- Повторное скачивание
- Удаление старых

**Сохраненные стили:**

- Избранные стили
- Создание новых
- Редактирование

**Настройки:**

- Telegram аккаунт
- Email уведомления
- Выход


## Интеграция с Яндекс.Метрикой

### Установка счетчика

```html
<!-- public/index.html -->
<script type="text/javascript">
   (function(m,e,t,r,i,k,a){
     m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
     m[i].l=1*new Date();
     for (var j = 0; j < document.scripts.length; j++) {
       if (document.scripts[j].src === r) { return; }
     }
     k=e.createElement(t),a=e.getElementsByTagName(t)[^0],
     k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
   })
   (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");

   ym(COUNTER_ID, "init", {
     clickmap:true,
     trackLinks:true,
     accurateTrackBounce:true,
     webvisor:true,
     ecommerce:"dataLayer"
   });
</script>
```


### Отслеживание событий

```typescript
// utils/metrika.ts
export const trackEvent = (
  event: string,
  params?: Record<string, any>
) => {
  if (typeof ym !== 'undefined') {
    ym(COUNTER_ID, 'reachGoal', event, params);
  }
};

// Основные цели
export const MetrikaGoals = {
  // Регистрация
  SIGNUP: 'signup',

  // Генерация
  GENERATION_START: 'generation_start',
  GENERATION_COMPLETE: 'generation_complete',

  // Покупка
  VIEW_PACKAGES: 'view_packages',
  CLICK_BUY: 'click_buy',
  PAYMENT_START: 'payment_start',
  PAYMENT_SUCCESS: 'payment_success',

  // Взаимодействие
  DOWNLOAD_IMAGE: 'download_image',
  SAVE_STYLE: 'save_style',
  SHARE: 'share'
};

// Использование
trackEvent(MetrikaGoals.GENERATION_START, {
  style: selectedStyle,
  utm_source: user.utm_source
});
```


### E-commerce данные

```typescript
// При покупке пакета
window.dataLayer = window.dataLayer || [];
window.dataLayer.push({
  'ecommerce': {
    'purchase': {
      'actionField': {
        'id': order.id,
        'revenue': package.price,
        'tax': 0,
        'shipping': 0
      },
      'products': [{
        'id': package.id,
        'name': package.name,
        'price': package.price,
        'quantity': 1,
        'category': 'Packages'
      }]
    }
  }
});

trackEvent(MetrikaGoals.PAYMENT_SUCCESS, {
  order_id: order.id,
  amount: package.price
});
```


### UTM параметры

```typescript
// hooks/useUTM.ts
export const useUTM = () => {
  const [utm, setUTM] = useState<UTMParams | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const utmData = {
      source: params.get('utm_source'),
      medium: params.get('utm_medium'),
      campaign: params.get('utm_campaign'),
      content: params.get('utm_content'),
      term: params.get('utm_term')
    };

    // Сохранить только для новых пользователей
    if (!localStorage.getItem('utm_saved')) {
      localStorage.setItem('utm_data', JSON.stringify(utmData));
      localStorage.setItem('utm_saved', 'true');

      // Отправить на backend
      authApi.saveUTM(utmData);
    }

    setUTM(utmData);
  }, []);

  return utm;
};
```


### Настройка целей в Метрике

**Рекомендуемые цели:**

1. **Регистрация** (`signup`)
    - Тип: JavaScript событие
    - Идентификатор: `signup`
2. **Первая генерация** (`generation_complete`)
    - Тип: JavaScript событие
    - Идентификатор: `generation_complete`
    - Условие: первая генерация пользователя
3. **Просмотр пакетов** (`view_packages`)
    - Тип: Посещение страницы
    - URL: `/packages`
4. **Начало оплаты** (`payment_start`)
    - Тип: JavaScript событие
    - Идентификатор: `payment_start`
5. **Успешная оплата** (`payment_success`)
    - Тип: JavaScript событие
    - Идентификатор: `payment_success`
    - **С передачей суммы для ROI**

## Интеграция с Telegram ботом

### Общая база данных

```python
# shared/database/models.py (используется и ботом, и сайтом)
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    telegram_id = Column(BigInteger, unique=True, nullable=False)
    username = Column(String, nullable=True)
    first_name = Column(String)
    photoshoots_balance = Column(Integer, default=0)

    # UTM данные
    utm_source = Column(String, nullable=True)
    utm_medium = Column(String, nullable=True)
    utm_campaign = Column(String, nullable=True)
    utm_content = Column(String, nullable=True)
    utm_term = Column(String, nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    last_active = Column(DateTime, default=datetime.utcnow)

    # Relationships
    generations = relationship("Generation", back_populates="user")
    orders = relationship("Order", back_populates="user")
    saved_styles = relationship("SavedStyle", back_populates="user")

class Generation(Base):
    __tablename__ = "generations"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))

    # Источник генерации
    source = Column(String)  # 'bot' или 'web'

    # Данные
    original_image_url = Column(String)
    style_prompt = Column(Text)
    result_images = Column(JSON)  # Массив URL

    status = Column(String)  # pending, processing, completed, failed
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="generations")

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    package_id = Column(Integer, ForeignKey("packages.id"))

    # Платеж
    amount = Column(Float)
    payment_id = Column(String, unique=True)
    status = Column(String)  # pending, paid, cancelled, refunded

    # Источник покупки
    source = Column(String)  # 'bot' или 'web'

    created_at = Column(DateTime, default=datetime.utcnow)
    paid_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="orders")
    package = relationship("Package")
```


### Синхронизация между ботом и сайтом

```python
# backend/services/sync_service.py
class SyncService:
    """Синхронизация данных между ботом и сайтом"""

    @staticmethod
    async def notify_bot_about_web_generation(
        user_id: int,
        generation_id: int
    ):
        """Уведомить бота о генерации с сайта"""
        bot = Bot(token=BOT_TOKEN)
        generation = await get_generation(generation_id)

        message = (
            f"🎨 Новая генерация с сайта!\n\n"
            f"Стиль: {generation.style_prompt[:100]}...\n"
            f"Статус: {generation.status}\n\n"
            f"Посмотреть результаты можно в боте или на сайте."
        )

        await bot.send_message(
            chat_id=user_id,
            text=message
        )

    @staticmethod
    async def notify_bot_about_purchase(
        user_id: int,
        order_id: int
    ):
        """Уведомить бота об оплате с сайта"""
        bot = Bot(token=BOT_TOKEN)
        order = await get_order(order_id)

        message = (
            f"✅ Оплата прошла успешно!\n\n"
            f"Пакет: {order.package.name}\n"
            f"Начислено: {order.package.photoshoots} фотосессий\n"
            f"Сумма: {order.amount}₽\n\n"
            f"Теперь вы можете генерировать фото как в боте, "
            f"так и на сайте!"
        )

        await bot.send_message(
            chat_id=user_id,
            text=message
        )
```


## Технические детали

### WebSocket для статусов генерации

```python
# backend/api/websocket.py
from fastapi import WebSocket, WebSocketDisconnect

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, WebSocket] = {}

    async def connect(self, user_id: int, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[user_id] = websocket

    def disconnect(self, user_id: int):
        if user_id in self.active_connections:
            del self.active_connections[user_id]

    async def send_status(self, user_id: int, data: dict):
        if user_id in self.active_connections:
            await self.active_connections[user_id].send_json(data)

manager = ConnectionManager()

@app.websocket("/ws/generation")
async def websocket_endpoint(
    websocket: WebSocket,
    user_id: int = Query(...)
):
    await manager.connect(user_id, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(user_id)

# В сервисе генерации
async def generate_images(user_id: int, image: bytes, style: str):
    # Статус: загрузка
    await manager.send_status(user_id, {
        "status": "uploading",
        "progress": 10,
        "message": "Загружаем изображение..."
    })

    # Статус: анализ
    await manager.send_status(user_id, {
        "status": "analyzing",
        "progress": 30,
        "message": "Анализируем продукт..."
    })

    # Генерация промпта
    await manager.send_status(user_id, {
        "status": "generating_prompt",
        "progress": 50,
        "message": "Создаём промпт для AI..."
    })

    # Генерация изображений
    await manager.send_status(user_id, {
        "status": "generating_images",
        "progress": 70,
        "message": "Генерируем изображения..."
    })

    # Завершено
    await manager.send_status(user_id, {
        "status": "completed",
        "progress": 100,
        "message": "Готово!",
        "images": result_urls
    })
```


### Безопасность

```python
# backend/middleware/auth.py
from fastapi import Depends, HTTPException
from jose import JWTError, jwt

def get_current_user(
    token: str = Depends(oauth2_scheme)
) -> User:
    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )
        user_id: int = payload.get("user_id")
        if user_id is None:
            raise HTTPException(401, "Invalid token")
    except JWTError:
        raise HTTPException(401, "Invalid token")

    user = get_user_by_id(user_id)
    if not user:
        raise HTTPException(404, "User not found")

    return user

# Rate limiting для API
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@app.post("/api/generation/create")
@limiter.limit("10/minute")
async def create_generation(
    request: Request,
    user: User = Depends(get_current_user)
):
    # ...
```


## План разработки (этапы)

### Этап 1: Backend Core (1-2 недели)

- Настройка FastAPI проекта
- Подключение к общей БД с ботом
- API для авторизации (Telegram Widget + Code)
- API для пользователей
- API для пакетов
- Базовая интеграция с ЮKassa


### Этап 2: Frontend Core (2-3 недели)

- Настройка React + TypeScript + Vite
- UI Kit (кнопки, формы, модалки)
- Авторизация UI
- Главная страница
- Страница пакетов
- Базовая навигация


### Этап 3: Генерация (2-3 недели)

- API генерации изображений
- WebSocket для статусов
- UI загрузки изображения
- UI выбора стиля
- UI статусов генерации (ProcessingSteps)
- UI результатов (галерея)


### Этап 4: Оплата (1 неделя)

- Полная интеграция ЮKassa
- Webhook обработка
- UI страницы оплаты
- UI успешной оплаты
- Уведомления в бот


### Этап 5: Профиль и история (1 неделя)

- API профиля
- API истории генераций
- UI профиля
- UI истории
- Сохраненные стили


### Этап 6: Аналитика (1 неделя)

- Интеграция Яндекс.Метрики
- UTM tracking
- Настройка целей
- E-commerce данные
- Админ-панель статистики

