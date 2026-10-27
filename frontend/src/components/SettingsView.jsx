import React, { useState } from 'react';
import { 
  Save, 
  Send, 
  ShieldCheck, 
  Sliders, 
  Bell, 
  AlertTriangle, 
  CheckCircle2,
  Trash2,
  Plus
} from 'lucide-react';
import { TARGET_INDUSTRIES, TARGET_SERVICES } from '../data/leadsData';

export default function SettingsView() {
  const [botToken, setBotToken] = useState('');
  const [chatId, setChatId] = useState('');
  const [notifyOnAOnly, setNotifyOnAOnly] = useState(true);
  const [dailyDigestTime, setDailyDigestTime] = useState('09:00');
  const [minScoreThreshold, setMinScoreThreshold] = useState(70);
  const [isSaved, setIsSaved] = useState(false);

  const [staffStopWords, setStaffStopWords] = useState([
    "в штат", "полная ставка", "junior", "стажер", "оклад", "курьер", "офис-менеджер"
  ]);

  const [cheapStopWords, setCheapStopWords] = useState([
    "рилс", "reels", "shorts", "шортс", "нарезка", "бюджет 500", "за отзыв"
  ]);

  const [educationStopWords, setEducationStopWords] = useState([
    "обучение", "курсы", "наставничество", "вебинар", "марафон", "онлайн-школа"
  ]);

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '900px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-text-black)', letterSpacing: '-0.02em' }}>
            Настройки платформы StudioRadar
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--color-text-headline)', marginTop: '2px' }}>
            Конфигурация параметров отбора, стоп-фильтров и Telegram-уведомлений
          </p>
        </div>

        <button 
          onClick={handleSave}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          {isSaved ? <CheckCircle2 size={16} /> : <Save size={16} />}
          <span>{isSaved ? 'Сохранено!' : 'Сохранить настройки'}</span>
        </button>
      </div>

      {/* Telegram Bot Notification Section (Раздел 11 ТЗ) */}
      <div className="card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <div style={{ width: '34px', height: '34px', borderRadius: '6px', background: '#e0e1f7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bell size={18} color="var(--color-accent-purple)" />
          </div>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text-black)' }}>
              Telegram-бот уведомлений для студии
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--color-text-headline)' }}>
              Мгновенные оповещения в рабочий чат при обнаружении горячих заказчиков и утренний дайджест
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-black)', display: 'block', marginBottom: '6px' }}>
              Telegram Bot Token
            </label>
            <input 
              type="password" 
              placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
              value={botToken}
              onChange={(e) => setBotToken(e.target.value)}
              className="input-control"
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-black)', display: 'block', marginBottom: '6px' }}>
              Chat ID или @канал для лидов
            </label>
            <input 
              type="text" 
              placeholder="@studioradar_leads или -1001234567890"
              value={chatId}
              onChange={(e) => setChatId(e.target.value)}
              className="input-control"
              style={{ width: '100%' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--border-subtle)' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={notifyOnAOnly} 
              onChange={(e) => setNotifyOnAOnly(e.target.checked)}
              style={{ accentColor: 'var(--color-accent-purple)' }} 
            />
            <span>Мгновенно присылать только лиды высшего приоритета (Грейд A / A+)</span>
          </label>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px' }}>
            <span>Время отправки ежедневного дайджеста (10–30 лидов):</span>
            <input 
              type="time" 
              value={dailyDigestTime} 
              onChange={(e) => setDailyDigestTime(e.target.value)}
              className="input-control" 
              style={{ padding: '4px 8px' }}
            />
          </div>
        </div>
      </div>

      {/* Qualification & Scoring Settings (Раздел 7 ТЗ) */}
      <div className="card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <div style={{ width: '34px', height: '34px', borderRadius: '6px', background: 'var(--color-surface-beige-3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sliders size={18} color="var(--color-accent-purple)" />
          </div>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text-black)' }}>
              Правила ИИ-квалификации и веса критериев
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--color-text-headline)' }}>
              Формула оценки совпадения потребностей заказчика с возможностями студии
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '16px' }}>
          <div style={{ padding: '12px', background: 'var(--color-surface-beige-1)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '11px', color: 'var(--color-text-headline)' }}>Прямой сигнал спроса</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text-black)', marginTop: '4px' }}>30 баллов</div>
          </div>
          <div style={{ padding: '12px', background: 'var(--color-surface-beige-1)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '11px', color: 'var(--color-text-headline)' }}>Соответствие 5 услугам</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text-black)', marginTop: '4px' }}>25 баллов</div>
          </div>
          <div style={{ padding: '12px', background: 'var(--color-surface-beige-1)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '11px', color: 'var(--color-text-headline)' }}>Соответствие 7 сферам</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text-black)', marginTop: '4px' }}>20 баллов</div>
          </div>
          <div style={{ padding: '12px', background: 'var(--color-surface-beige-1)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '11px', color: 'var(--color-text-headline)' }}>Свежесть сигнала</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text-black)', marginTop: '4px' }}>15 баллов</div>
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-black)' }}>
              Минимальный скоринг для попадания в главный отчет:
            </label>
            <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-accent-purple)' }}>{minScoreThreshold}%</strong>
          </div>
          <input 
            type="range" 
            min="50" 
            max="90" 
            step="5" 
            value={minScoreThreshold} 
            onChange={(e) => setMinScoreThreshold(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--color-accent-purple)', cursor: 'pointer' }}
          />
        </div>
      </div>

      {/* Stop Words Filters (Раздел 6.2 ТЗ) */}
      <div className="card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <div style={{ width: '34px', height: '34px', borderRadius: '6px', background: '#fdf0e6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck size={18} color="#7b3306" />
          </div>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text-black)' }}>
              Словари стоп-слов и жесткой фильтрации
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--color-text-headline)' }}>
              Исключение соискателей, мелкого монтажа, инфобизнеса и нерелевантных бирж
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-black)', marginBottom: '6px' }}>
              Фильтр штатного найма (не проектный подряд):
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {staffStopWords.map((word, idx) => (
                <span key={idx} style={{ fontSize: '11px', background: 'var(--color-surface-beige-3)', padding: '4px 8px', borderRadius: '4px', color: 'var(--color-text-body)' }}>
                  {word}
                </span>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-black)', marginBottom: '6px' }}>
              Фильтр мелкого монтажа и копеечных чеков:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {cheapStopWords.map((word, idx) => (
                <span key={idx} style={{ fontSize: '11px', background: 'var(--color-surface-beige-3)', padding: '4px 8px', borderRadius: '4px', color: 'var(--color-text-body)' }}>
                  {word}
                </span>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-black)', marginBottom: '6px' }}>
              Фильтр инфобизнеса и обучающих курсов:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {educationStopWords.map((word, idx) => (
                <span key={idx} style={{ fontSize: '11px', background: 'var(--color-surface-beige-3)', padding: '4px 8px', borderRadius: '4px', color: 'var(--color-text-body)' }}>
                  {word}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
