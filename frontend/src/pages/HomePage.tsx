import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import './HomePage.css';

const HomePage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    // Track UTM parameters
    const params = new URLSearchParams(window.location.search);
    const utm = {
      source: params.get('utm_source'),
      medium: params.get('utm_medium'),
      campaign: params.get('utm_campaign'),
    };
    if (utm.source && !sessionStorage.getItem('utm_tracked')) {
      sessionStorage.setItem('utm_data', JSON.stringify(utm));
      sessionStorage.setItem('utm_tracked', 'true');
    }
  }, []);

  return (
    <div className="home-page">
      <section className="hero">
        <div className="hero-content">
          <h1>AI Фотосессии для вашего продукта</h1>
          <p>Создавайте профессиональные фото ваших товаров с помощью AI за минуты</p>

          {isAuthenticated ? (
            <div className="user-stats">
              <p>Добро пожаловать, {user?.first_name}!</p>
              <p className="balance">Осталось фотосессий: <strong>{user?.images_remaining}</strong></p>
              <Link to="/generate" className="cta-button">Создать фотосессию</Link>
            </div>
          ) : (
            <Link to="/auth" className="cta-button">Начать бесплатно</Link>
          )}
        </div>
      </section>

      <section className="features">
        <h2>Почему выбирают нас?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🎨</div>
            <h3>AI Генерация</h3>
            <p>Используем передовые AI модели для создания реалистичных фотосессий</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <h3>Быстро</h3>
            <p>Получите результат за 2-3 минуты вместо многочасовых фотосессий</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">💰</div>
            <h3>Выгодно</h3>
            <p>В 10 раз дешевле традиционной фотосессии</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🖼️</div>
            <h3>4 фото за раз</h3>
            <p>Каждая фотосессия включает 4 уникальных изображения</p>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <h2>Готовы попробовать?</h2>
        <p>Первые 2 фотосессии бесплатно!</p>
        {!isAuthenticated && (
          <Link to="/auth" className="cta-button-secondary">Создать аккаунт</Link>
        )}
        <Link to="/packages" className="cta-button-outline">Посмотреть пакеты</Link>
      </section>
    </div>
  );
};

export default HomePage;
