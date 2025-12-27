import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { packageApi } from '../services/packageApi';
import { paymentApi } from '../services/paymentApi';
import type { Package } from '../types';
import { useAuth } from '../hooks/useAuth';
import './PackagesPage.css';

const PackagesPage: React.FC = () => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    try {
      const data = await packageApi.getPackages();
      setPackages(data);
    } catch (error) {
      console.error('Failed to load packages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (pkg: Package) => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }

    try {
      const result = await paymentApi.createPayment(pkg.id, window.location.origin + '/payment/success');
      window.location.href = result.payment_url;
    } catch (error) {
      console.error('Failed to create payment:', error);
      alert('Ошибка создания платежа');
    }
  };

  if (loading) {
    return <div className="loading-container">Загрузка пакетов...</div>;
  }

  return (
    <div className="packages-page">
      <section id="pricing" className="pricing-section">
        <div className="pricing-header">
          <h2>Пакеты фотосессий</h2>
          <p className="pricing-subtitle">Выбирайте объем, который нужен вашему бизнесу. Гибкая система оплаты через YooKassa.</p>
        </div>

        <div className="pricing-grid">
          {packages.map((pkg, index) => {
            const isPopular = pkg.name === 'Бизнес' || index === 1;
            const tierNames = ['Старт', 'Бизнес', 'Agency'];
            const tierName = tierNames[index] || pkg.name;

            return (
              <div
                key={pkg.id}
                className={`pricing-card glass-card ${isPopular ? 'popular' : ''}`}
                style={isPopular ? {
                  borderColor: 'rgba(255,255,255,0.2)',
                  transform: 'scale(1.05)',
                  background: 'rgba(255,255,255,0.05)'
                } : {}}
              >
                {isPopular && (
                  <div className="popular-badge">Popular</div>
                )}

                <div className="card-icon">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                  </svg>
                </div>

                <h3 className="package-name">{tierName}</h3>
                <div className="package-price">{pkg.price_rub} ₽</div>

                <ul className="package-features">
                  <li>✓ {pkg.photoshoots_count} фотосессий</li>
                  <li>✓ {pkg.photoshoots_count * 4} сгенерированных фото</li>
                  <li>✓ Все стили доступны</li>
                  <li>✓ Поддержка 24/7</li>
                  {isPopular && <li>✓ Приоритетная генерация</li>}
                  {index === 2 && <li>✓ API доступ</li>}
                </ul>

                <button
                  onClick={() => handlePurchase(pkg)}
                  className={isPopular ? 'package-btn popular' : 'package-btn'}
                  style={isPopular ? {
                    background: 'var(--pigment-primary)',
                    color: 'white'
                  } : {}}
                >
                  {isPopular ? 'Купить сейчас' : 'Выбрать'}
                </button>
              </div>
            );
          })}
        </div>

        {!isAuthenticated && (
          <div className="auth-reminder">
            <p>Войдите, чтобы купить пакет</p>
            <button onClick={() => navigate('/auth')} className="btn-molten">Войти</button>
          </div>
        )}
      </section>
    </div>
  );
};

export default PackagesPage;
