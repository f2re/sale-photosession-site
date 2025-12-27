import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import './HomePage.css';

const HomePage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const compareContainerRef = useRef<HTMLDivElement>(null);
  const compareBeforeRef = useRef<HTMLDivElement>(null);

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

    // Comparison slider effect
    const container = compareContainerRef.current;
    const before = compareBeforeRef.current;

    if (container && before) {
      const handleMouseMove = (e: MouseEvent) => {
        const rect = container.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percent = (x / rect.width) * 100;
        before.style.width = `${percent}%`;
      };

      const handleMouseLeave = () => {
        before.style.transition = 'width 0.5s ease';
        before.style.width = '50%';
        setTimeout(() => { before.style.transition = 'none'; }, 500);
      };

      container.addEventListener('mousemove', handleMouseMove);
      container.addEventListener('mouseleave', handleMouseLeave);

      return () => {
        container.removeEventListener('mousemove', handleMouseMove);
        container.removeEventListener('mouseleave', handleMouseLeave);
      };
    }
  }, []);

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="status-dot"></span>
            <span className="mono">POWERED BY CLAUDE 3.5 SONNET & GEMINI 2.0</span>
          </div>
          <h1 className="hero-title">
            Продающий контент<br />
            <span className="gradient-text">в один клик.</span>
          </h1>
          <p className="hero-description">
            Превратите обычные фото товара в профессиональные снимки. Искусственный интеллект проанализирует ваш продукт и создаст идеальное окружение.
          </p>
          <div className="hero-actions">
            {isAuthenticated ? (
              <Link to="/generate" className="btn-molten">Создать фотосессию</Link>
            ) : (
              <Link to="/auth" className="btn-molten">Начать бесплатно</Link>
            )}
            <div className="social-proof">
              <div className="avatars">
                <div className="avatar"></div>
                <div className="avatar"></div>
                <div className="avatar"></div>
              </div>
              <div className="proof-text">10k+ селлеров<br />уже с нами</div>
            </div>
          </div>
        </div>
        <div className="hero-visual">
          <div className="compare-container" ref={compareContainerRef}>
            <div className="compare-after"></div>
            <div className="compare-before" ref={compareBeforeRef}></div>
            <div className="compare-border"></div>
          </div>
          <div className="floating-stat glass-card">
            <div className="stat-value stat-glow">5 мин</div>
            <div className="stat-label mono">Скорость генерации</div>
          </div>
        </div>
      </section>

      {/* Styles Grid */}
      <section id="styles" className="styles-section">
        <div className="section-header">
          <h2>Библиотека стилей</h2>
          <p className="section-subtitle">Четыре ключевых направления для любого типа товаров</p>
        </div>
        <div className="styles-grid">
          <div className="style-card glass-card">
            <div className="style-overlay"></div>
            <img src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=600" alt="Lifestyle" className="style-image" />
            <div className="style-label">
              <span className="style-number mono">01</span>
              <h3>Lifestyle</h3>
              <p>В естественной среде</p>
            </div>
          </div>
          <div className="style-card glass-card">
            <div className="style-overlay"></div>
            <img src="https://images.unsplash.com/photo-1534452283282-730d1c8c6a3a?auto=format&fit=crop&q=80&w=600" alt="Studio" className="style-image" />
            <div className="style-label">
              <span className="style-number mono">02</span>
              <h3>Studio</h3>
              <p>Проф. освещение</p>
            </div>
          </div>
          <div className="style-card glass-card">
            <div className="style-overlay"></div>
            <img src="https://images.unsplash.com/photo-1616489953149-839cc1202202?auto=format&fit=crop&q=80&w=600" alt="Interior" className="style-image" />
            <div className="style-label">
              <span className="style-number mono">03</span>
              <h3>Interior</h3>
              <p>Предметы интерьера</p>
            </div>
          </div>
          <div className="style-card glass-card">
            <div className="style-overlay"></div>
            <img src="https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=600" alt="Creative" className="style-image" />
            <div className="style-label">
              <span className="style-number mono">04</span>
              <h3>Creative</h3>
              <p>Художественный арт</p>
            </div>
          </div>
        </div>
      </section>

      {/* Analytics Section */}
      <section id="analytics" className="analytics-section">
        <div className="analytics-content">
          <div className="analytics-text">
            <h2>Прозрачная аналитика для маркетологов</h2>
            <div className="analytics-features">
              <div className="analytics-feature">
                <div className="feature-icon-box glass-card">
                  <span className="mono" style={{ color: 'var(--pigment-secondary)' }}>UTM</span>
                </div>
                <div>
                  <h4>Deep Links & Tracking</h4>
                  <p className="feature-description">Отслеживайте каждый рубль. Бот поддерживает короткие и полные UTM-метки для Директа, VK и Telegram Ads.</p>
                </div>
              </div>
              <div className="analytics-feature">
                <div className="feature-icon-box glass-card">
                  <span className="mono" style={{ color: 'var(--pigment-primary)' }}>API</span>
                </div>
                <div>
                  <h4>Интеграция с Метрикой</h4>
                  <p className="feature-description">Автоматическая передача офлайн-конверсий. Видьте воронку: Старт → Первое фото → Покупка.</p>
                </div>
              </div>
            </div>
          </div>
          <div className="analytics-dashboard glass-card">
            <div className="dashboard-header">
              <div className="dashboard-title mono">Admin Dashboard Preview</div>
              <div className="window-controls">
                <div className="control-dot red"></div>
                <div className="control-dot yellow"></div>
                <div className="control-dot green"></div>
              </div>
            </div>
            <div className="dashboard-content">
              <div className="command-line glass-card">
                <span className="mono command-text">/utm_funnel</span>
                <span className="status-text">Active</span>
              </div>
              <div className="stats-grid">
                <div className="stat-card glass-card">
                  <div className="stat-title">Regs</div>
                  <div className="stat-number">1,240</div>
                </div>
                <div className="stat-card glass-card highlight">
                  <div className="stat-title">Images</div>
                  <div className="stat-number">8,432</div>
                </div>
                <div className="stat-card glass-card">
                  <div className="stat-title">Sales</div>
                  <div className="stat-number">412</div>
                </div>
              </div>
              <div className="funnel-bars">
                <div className="funnel-bar full"></div>
                <div className="funnel-bar medium"></div>
                <div className="funnel-bar small"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <footer className="cta-footer">
        <h2>Готовы масштабировать контент?</h2>
        <div className="footer-actions">
          <Link to="/auth" className="btn-molten">Запустить Telegram бота</Link>
          <div className="footer-meta mono">
            Secure payments via YooKassa • AI by Anthropic & Google
          </div>
        </div>
        <div className="footer-bottom">
          <div className="mono">© 2024 PHOTO.AI STUDIO</div>
          <div className="footer-links">
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
            <a href="#">Refund Policy</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
