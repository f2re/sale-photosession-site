import React, { useEffect, useState } from 'react';
import { authApi } from '../../services/authApi';

interface Props {
  onSuccess: (token: string, user: any) => void;
}

declare global {
  interface Window {
    onTelegramAuth?: (user: any) => void;
  }
}

const TelegramWidgetAuth: React.FC<Props> = ({ onSuccess }) => {
  const [botInfo, setBotInfo] = useState<{ bot_username: string; bot_name: string } | null>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch bot info
    authApi.getBotInfo().then(setBotInfo).catch(console.error);

    // Define callback
    window.onTelegramAuth = async (user) => {
      setLoading(true);
      setError('');
      try {
        const response = await authApi.loginWithWidget(user);
        onSuccess(response.access_token, response.user);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Ошибка авторизации');
      } finally {
        setLoading(false);
      }
    };

    return () => {
      delete window.onTelegramAuth;
    };
  }, [onSuccess]);

  useEffect(() => {
    if (!botInfo) return;

    // Load Telegram Widget script
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', botInfo.bot_username);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    script.setAttribute('data-request-access', 'write');
    script.async = true;

    const container = document.getElementById('telegram-login-container');
    if (container) {
      container.innerHTML = '';
      container.appendChild(script);
    }

    return () => {
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [botInfo]);

  return (
    <div className="telegram-widget-auth">
      <h2>Вход через Telegram</h2>
      <p>Нажмите на кнопку ниже для авторизации через Telegram</p>

      {error && <div className="error-message">{error}</div>}
      {loading && <div className="loading">Авторизация...</div>}

      <div id="telegram-login-container" className="telegram-widget-container"></div>

      <div className="auth-info">
        <p>✓ Быстрая авторизация в 1 клик</p>
        <p>✓ Безопасно через официальный Telegram</p>
        <p>✓ Не требует дополнительных действий</p>
      </div>
    </div>
  );
};

export default TelegramWidgetAuth;
