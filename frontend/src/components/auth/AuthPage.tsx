import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../../store/slices/authSlice';
import { AuthMethod, type AuthMethodType } from '../../types';
import TelegramWidgetAuth from './TelegramWidgetAuth';
import TelegramCodeAuth from './TelegramCodeAuth';
import './AuthPage.css';

const AuthPage: React.FC = () => {
  const [authMethod, setAuthMethod] = useState<AuthMethodType | null>(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleAuthSuccess = (token: string, user: any) => {
    dispatch(setCredentials({ user, token }));
    navigate('/');
  };

  if (!authMethod) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <h1>Войти в PhotoSession</h1>
          <p className="auth-description">
            Выберите способ авторизации через Telegram
          </p>

          <div className="auth-methods">
            <div className="auth-method-card" onClick={() => setAuthMethod(AuthMethod.WIDGET)}>
              <div className="method-icon">🔐</div>
              <h3>Telegram Login Widget</h3>
              <p>Быстрая авторизация в 1 клик через официальный виджет Telegram</p>
              <button className="method-btn">Выбрать</button>
            </div>

            <div className="auth-method-card" onClick={() => setAuthMethod(AuthMethod.CODE)}>
              <div className="method-icon">🔢</div>
              <h3>Верификация через код</h3>
              <p>Получите код в боте и введите его на сайте (требуется запустить бота)</p>
              <button className="method-btn">Выбрать</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <button className="back-btn" onClick={() => setAuthMethod(null)}>
          ← Назад к выбору метода
        </button>

        {authMethod === AuthMethod.WIDGET ? (
          <TelegramWidgetAuth onSuccess={handleAuthSuccess} />
        ) : (
          <TelegramCodeAuth onSuccess={handleAuthSuccess} />
        )}
      </div>
    </div>
  );
};

export default AuthPage;
