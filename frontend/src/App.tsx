import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import { useAuth } from './hooks/useAuth';
import { initMetrika, trackPageView } from './utils/metrika';

import AuthPage from './components/auth/AuthPage';
import HomePage from './pages/HomePage';
import PackagesPage from './pages/PackagesPage';
import GeneratePage from './pages/GeneratePage';
import ProfilePage from './pages/ProfilePage';

import './App.css';

const Navigation: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  return (
    <nav style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '1.5rem 2rem',
      maxWidth: '1400px',
      margin: '0 auto',
      position: 'relative',
      zIndex: 10
    }}>
      <Link to="/" style={{
        fontSize: '1.5rem',
        fontWeight: '800',
        letterSpacing: '-0.02em',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        textDecoration: 'none'
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          background: 'white',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            width: '16px',
            height: '16px',
            background: 'black',
            borderRadius: '2px',
            transform: 'rotate(45deg)'
          }}></div>
        </div>
        PHOTO.AI
      </Link>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '2rem',
        fontSize: '0.875rem',
        fontWeight: 500
      }} className="nav-links-desktop">
        <Link to="/#styles" style={{ opacity: 0.7, transition: 'opacity 0.2s' }}>Стили</Link>
        <Link to="/packages" style={{ opacity: 0.7, transition: 'opacity 0.2s' }}>Тарифы</Link>
        {isAuthenticated && <Link to="/generate" style={{ opacity: 0.7, transition: 'opacity 0.2s' }}>Генерация</Link>}
        {isAuthenticated ? (
          <Link to="/profile" className="glass-card" style={{
            padding: '0.5rem 1.25rem',
            borderRadius: '99px',
            fontSize: '0.875rem',
            fontWeight: 600,
            borderColor: 'rgba(255,255,255,0.2)'
          }}>
            {user?.first_name} ({user?.images_remaining})
          </Link>
        ) : (
          <Link to="/auth" className="glass-card" style={{
            padding: '0.5rem 1.25rem',
            borderRadius: '99px',
            fontSize: '0.875rem',
            fontWeight: 600,
            borderColor: 'rgba(255,255,255,0.2)'
          }}>
            Запустить бота
          </Link>
        )}
      </div>
    </nav>
  );
};

const AppContent: React.FC = () => {
  useEffect(() => {
    initMetrika();
  }, []);

  useEffect(() => {
    trackPageView(window.location.pathname);
  }, [window.location.pathname]);

  return (
    <div className="app">
      <div className="noise"></div>
      <div className="pigment-canvas">
        <div className="blob"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>
      <Navigation />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/packages" element={<PackagesPage />} />
        <Route path="/generate" element={<GeneratePage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/payment/success" element={<PaymentSuccess />} />
      </Routes>
    </div>
  );
};

const PaymentSuccess: React.FC = () => {
  useEffect(() => {
    setTimeout(() => {
      window.location.href = '/profile';
    }, 5000);
  }, []);

  return (
    <div className="payment-success">
      <h1>🎉 Оплата прошла успешно!</h1>
      <p>Фотосессии зачислены на ваш баланс</p>
      <p>Переход в профиль через 5 секунд...</p>
      <Link to="/profile">Перейти сейчас</Link>
    </div>
  );
};

function App() {
  return (
    <Provider store={store}>
      <Router>
        <AppContent />
      </Router>
    </Provider>
  );
}

export default App;
