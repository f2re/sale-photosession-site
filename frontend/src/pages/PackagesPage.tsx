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
      <h1>Выберите пакет</h1>
      <p className="subtitle">Все пакеты включают 4 изображения на каждую фотосессию</p>

      <div className="packages-grid">
        {packages.map((pkg) => (
          <div key={pkg.id} className={`package-card ${pkg.name === 'Бизнес' ? 'popular' : ''}`}>
            {pkg.name === 'Бизнес' && <div className="popular-badge">🔥 Популярный</div>}

            <h3>{pkg.name}</h3>
            <div className="price">
              <span className="amount">{pkg.price_rub}₽</span>
              <span className="per-unit">
                {Math.round(pkg.price_rub / pkg.photoshoots_count)}₽ за фотосессию
              </span>
            </div>

            <div className="features">
              <div className="feature">📸 {pkg.photoshoots_count} фотосессий</div>
              <div className="feature">🖼️ {pkg.photoshoots_count * 4} изображений</div>
              <div className="feature">✓ AI генерация</div>
              <div className="feature">✓ Любые стили</div>
            </div>

            <button onClick={() => handlePurchase(pkg)} className="buy-btn">
              Купить
            </button>
          </div>
        ))}
      </div>

      {!isAuthenticated && (
        <div className="auth-reminder">
          <p>Войдите, чтобы купить пакет</p>
          <button onClick={() => navigate('/auth')}>Войти</button>
        </div>
      )}
    </div>
  );
};

export default PackagesPage;
