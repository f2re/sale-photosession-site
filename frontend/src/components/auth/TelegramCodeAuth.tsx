import React, { useState, useEffect } from 'react';
import { authApi } from '../../services/authApi';

interface Props {
  onSuccess: (token: string, user: any) => void;
}

const TelegramCodeAuth: React.FC<Props> = ({ onSuccess }) => {
  const [botInfo, setBotInfo] = useState<{ bot_username: string; bot_name: string } | null>(null);
  const [username, setUsername] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'username' | 'code'>('username');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    authApi.getBotInfo().then(setBotInfo).catch(console.error);
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authApi.requestCode(username);
      setStep('code');
      setCountdown(300); // 5 minutes
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка отправки кода');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authApi.verifyCode(username, code);
      onSuccess(response.access_token, response.user);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Неверный код');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="telegram-code-auth">
      <h2>Вход через код</h2>

      {step === 'username' ? (
        <form onSubmit={handleRequestCode}>
          <p>
            Сначала запустите бота{' '}
            <a
              href={botInfo ? `https://t.me/${botInfo.bot_username}` : '#'}
              target="_blank"
              rel="noopener noreferrer"
            >
              @{botInfo?.bot_username || '...'}
            </a>
          </p>

          <div className="form-group">
            <label>Telegram Username</label>
            <input
              type="text"
              placeholder="@username"
              value={username}
              onChange={(e) => setUsername(e.target.value.replace('@', ''))}
              required
              disabled={loading}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" disabled={loading || !username}>
            {loading ? 'Отправка...' : 'Получить код'}
          </button>

          <div className="auth-info">
            <p>1. Запустите бота {botInfo?.bot_name}</p>
            <p>2. Введите ваш Telegram username</p>
            <p>3. Получите код в боте</p>
          </div>
        </form>
      ) : (
        <form onSubmit={handleVerifyCode}>
          <p>Код отправлен в бот. Введите его ниже:</p>

          <div className="form-group">
            <label>Код подтверждения</label>
            <input
              type="text"
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              required
              disabled={loading}
              maxLength={6}
              className="code-input"
            />
          </div>

          {countdown > 0 && (
            <div className="countdown">Код действителен: {formatTime(countdown)}</div>
          )}

          {error && <div className="error-message">{error}</div>}

          <button type="submit" disabled={loading || code.length !== 6}>
            {loading ? 'Проверка...' : 'Войти'}
          </button>

          <button
            type="button"
            className="back-btn"
            onClick={() => {
              setStep('username');
              setCode('');
              setError('');
            }}
          >
            Изменить username
          </button>
        </form>
      )}
    </div>
  );
};

export default TelegramCodeAuth;
