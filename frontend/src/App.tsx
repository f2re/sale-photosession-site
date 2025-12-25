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
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-brand">PhotoSession AI</Link>
        <div className="nav-links">
          <Link to="/packages">Пакеты</Link>
          {isAuthenticated && <Link to="/generate">Генерация</Link>}
          {isAuthenticated ? (
            <Link to="/profile" className="nav-profile">
              {user?.first_name} ({user?.images_remaining})
            </Link>
          ) : (
            <Link to="/auth" className="nav-auth-btn">Войти</Link>
          )}
        </div>
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
