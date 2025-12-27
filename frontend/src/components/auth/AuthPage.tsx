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
          <div className="auth-header">
            <h1>Войти в систему</h1>
            <p className="auth-description">
              Выберите удобный способ авторизации через Telegram
            </p>
          </div>

          <div className="auth-methods">
            <div className="auth-method-card glass-card" onClick={() => setAuthMethod(AuthMethod.WIDGET)}>
              <div className="method-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </div>
              <h3>Telegram Login Widget</h3>
              <p>Быстрая авторизация в 1 клик через официальный виджет Telegram</p>
              <button className="method-btn btn-molten">Выбрать</button>
            </div>

            <div className="auth-method-card glass-card" onClick={() => setAuthMethod(AuthMethod.CODE)}>
              <div className="method-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="7" height="7"></rect>
                  <rect x="14" y="3" width="7" height="7"></rect>
                  <rect x="14" y="14" width="7" height="7"></rect>
                  <rect x="3" y="14" width="7" height="7"></rect>
                </svg>
              </div>
              <h3>Верификация через код</h3>
              <p>Получите код в боте и введите его на сайте (требуется запустить бота)</p>
              <button className="method-btn btn-molten">Выбрать</button>
            </div>
          </div>

          <div className="auth-footer mono">
            <span>🔒 Безопасная авторизация • Данные защищены</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <button className="back-btn glass-card" onClick={() => setAuthMethod(null)}>
          ← Назад к выбору метода
        </button>

        <div className="auth-method-content">
          {authMethod === AuthMethod.WIDGET ? (
            <TelegramWidgetAuth onSuccess={handleAuthSuccess} />
          ) : (
            <TelegramCodeAuth onSuccess={handleAuthSuccess} />
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
