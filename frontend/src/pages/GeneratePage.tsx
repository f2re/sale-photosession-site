import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { generationApi } from '../services/generationApi';
import { useAuth } from '../hooks/useAuth';
import { GenerationStatus } from '../types';
import './GeneratePage.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const GeneratePage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<'upload' | 'style' | 'generating' | 'result'>('upload');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [styleName, setStyleName] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [status, setStatus] = useState<GenerationStatus | null>(null);
  const [resultImages, setResultImages] = useState<string[]>([]);
  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (step === 'generating' && user) {
      const websocket = new WebSocket(`ws://localhost:8000/api/generation/ws/${user.id}`);
      websocket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.status) {
          setStatus(data);
          if (data.status === 'completed') {
            setResultImages(data.images || []);
            setStep('result');
          }
        }
      };
      setWs(websocket);
      return () => websocket.close();
    }
  }, [step, user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!imageFile) return;

    setStep('generating');

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = (reader.result as string).split(',')[1];
      try {
        await generationApi.createGeneration({
          image_base64: base64,
          style_name: styleName || undefined,
          aspect_ratio: aspectRatio,
        });
      } catch (error) {
        console.error('Generation error:', error);
        alert('Ошибка генерации');
        setStep('style');
      }
    };
    reader.readAsDataURL(imageFile);
  };

  if (!isAuthenticated) return null;

  return (
    <div className="generate-page">
      {step === 'upload' && (
        <div className="step-container">
          <h2>Шаг 1: Загрузите изображение</h2>
          <div className="upload-area" onClick={() => document.getElementById('file-input')?.click()}>
            {imagePreview ? (
              <img src={imagePreview} alt="Preview" />
            ) : (
              <div className="upload-placeholder">
                <div className="upload-icon">📤</div>
                <p>Нажмите или перетащите изображение</p>
              </div>
            )}
          </div>
          <input
            id="file-input"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          {imageFile && (
            <button onClick={() => setStep('style')} className="next-btn">
              Далее →
            </button>
          )}
        </div>
      )}

      {step === 'style' && (
        <div className="step-container">
          <h2>Шаг 2: Выберите стиль</h2>
          <div className="style-input">
            <label>Описание стиля</label>
            <input
              type="text"
              placeholder="например: на белом фоне, в студии, на природе"
              value={styleName}
              onChange={(e) => setStyleName(e.target.value)}
            />
          </div>
          <div className="aspect-ratio-selector">
            <label>Соотношение сторон</label>
            <div className="ratio-buttons">
              {['1:1', '3:4', '4:3', '16:9', '9:16'].map((ratio) => (
                <button
                  key={ratio}
                  className={aspectRatio === ratio ? 'active' : ''}
                  onClick={() => setAspectRatio(ratio)}
                >
                  {ratio}
                </button>
              ))}
            </div>
          </div>
          <div className="button-group">
            <button onClick={() => setStep('upload')} className="back-btn">← Назад</button>
            <button onClick={handleGenerate} className="generate-btn">Сгенерировать</button>
          </div>
        </div>
      )}

      {step === 'generating' && status && (
        <div className="step-container generating">
          <h2>Генерация...</h2>
          <div className="progress-bar">
            <div className="progress" style={{ width: `${status.progress}%` }}></div>
          </div>
          <p className="status-message">{status.message}</p>
          <div className="generation-steps">
            <div className={status.status === 'uploading' ? 'active' : ''}>📤 Загрузка</div>
            <div className={status.status === 'analyzing' ? 'active' : ''}>🔍 Анализ</div>
            <div className={status.status === 'generating_prompt' ? 'active' : ''}>🤖 Промпт</div>
            <div className={status.status === 'generating_images' ? 'active' : ''}>🎨 Генерация</div>
          </div>
        </div>
      )}

      {step === 'result' && (
        <div className="step-container">
          <h2>Готово! 🎉</h2>
          <div className="result-grid">
            {resultImages.map((img, idx) => (
              <div key={idx} className="result-image">
                <img src={img} alt={`Result ${idx + 1}`} />
                <a href={img} download className="download-btn">Скачать</a>
              </div>
            ))}
          </div>
          <button onClick={() => { setStep('upload'); setImageFile(null); setImagePreview(''); }} className="new-btn">
            Создать еще
          </button>
        </div>
      )}
    </div>
  );
};

export default GeneratePage;
