import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useDispatch } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import { userApi } from '../services/userApi';
import { paymentApi } from '../services/paymentApi';
import { ProcessedImage, Order } from '../types';
import './ProfilePage.css';

const ProfilePage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [images, setImages] = useState<ProcessedImage[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [tab, setTab] = useState<'images' | 'orders'>('images');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    loadData();
  }, [isAuthenticated, navigate]);

  const loadData = async () => {
    try {
      const [imagesData, ordersData] = await Promise.all([
        userApi.getMyImages(),
        paymentApi.getMyOrders(),
      ]);
      setImages(imagesData);
      setOrders(ordersData);
    } catch (error) {
      console.error('Failed to load profile data:', error);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  if (!isAuthenticated || !user) return null;

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="user-info">
          <h1>Привет, {user.first_name}!</h1>
          <p>@{user.username}</p>
        </div>
        <button onClick={handleLogout} className="logout-btn">Выйти</button>
      </div>

      <div className="balance-card">
        <div className="balance-item">
          <span className="label">Фотосессий осталось</span>
          <span className="value">{user.images_remaining}</span>
        </div>
        <div className="balance-item">
          <span className="label">Всего обработано</span>
          <span className="value">{user.total_images_processed}</span>
        </div>
        <div className="balance-item">
          <span className="label">Рефералов</span>
          <span className="value">{user.total_referrals}</span>
        </div>
      </div>

      <div className="tabs">
        <button className={tab === 'images' ? 'active' : ''} onClick={() => setTab('images')}>
          Мои фото
        </button>
        <button className={tab === 'orders' ? 'active' : ''} onClick={() => setTab('orders')}>
          Покупки
        </button>
      </div>

      {tab === 'images' && (
        <div className="images-grid">
          {images.length === 0 ? (
            <p className="empty-state">У вас пока нет сгенерированных фото</p>
          ) : (
            images.map((image) => (
              <div key={image.id} className="image-card">
                <div className="image-info">
                  <span>{image.style_name || 'Без стиля'}</span>
                  <span className="date">{new Date(image.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'orders' && (
        <div className="orders-list">
          {orders.length === 0 ? (
            <p className="empty-state">У вас пока нет покупок</p>
          ) : (
            orders.map((order) => (
              <div key={order.id} className="order-card">
                <div className="order-info">
                  <h3>Заказ #{order.id}</h3>
                  <p className="order-status">{order.status === 'paid' ? 'Оплачен' : 'В ожидании'}</p>
                </div>
                <div className="order-details">
                  <span>{order.amount}₽</span>
                  <span className="date">{new Date(order.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
