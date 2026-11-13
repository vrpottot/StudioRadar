import React, { useState, useEffect } from 'react';
import { 
  Save, 
  ShieldCheck, 
  Sliders, 
  Bell, 
  AlertTriangle, 
  CheckCircle2,
  Trash2,
  Plus,
  Bot,
  Globe
} from 'lucide-react';
import { TARGET_INDUSTRIES, TARGET_SERVICES } from '../data/leadsData';

const API_BASE = (typeof window !== 'undefined' && (window.location.origin.includes(':5173') || window.location.origin.includes(':3000')))
  ? "http://127.0.0.1:8001" 
  : "";

export default function SettingsView() {
  const [notifyOnAOnly, setNotifyOnAOnly] = useState(true);
  const [dailyDigestTime, setDailyDigestTime] = useState('09:00');
  const [minScoreThreshold, setMinScoreThreshold] = useState(70);
  const [saveError, setSaveError] = useState('');
  const [aiCheck, setAiCheck] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [staffStopWords, setStaffStopWords] = useState([
    "в штат", "полная ставка", "junior", "стажер", "оклад", "курьер", "офис-менеджер"
  ]);

  const [cheapStopWords, setCheapStopWords] = useState([
    "рилс", "reels", "shorts", "шортс", "нарезка", "бюджет 500", "за отзыв"
  ]);

  const [educationStopWords, setEducationStopWords] = useState([
    "обучение", "курсы", "наставничество", "вебинар", "марафон", "онлайн-школа"
  ]);

  // Загрузка настроек с бэкенда
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/settings`);
        if (res.ok) {
          const data = await res.json();
          if (data.notify_on_a_only !== undefined) setNotifyOnAOnly(data.notify_on_a_only);
          if (data.daily_digest_time) setDailyDigestTime(data.daily_digest_time);
          if (data.min_score_threshold) setMinScoreThreshold(data.min_score_threshold);
          if (data.staff_stop_words) setStaffStopWords(data.staff_stop_words);
          if (data.cheap_stop_words) setCheapStopWords(data.cheap_stop_words);
          if (data.education_stop_words) setEducationStopWords(data.education_stop_words);
        }
      } catch (e) {
        console.warn("Ошибка загрузки настроек:", e.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaveError('');
    try {
      const payload = {
        notify_on_a_only: notifyOnAOnly,
        daily_digest_time: dailyDigestTime,
        min_score_threshold: minScoreThreshold,
        staff_stop_words: staffStopWords,
        cheap_stop_words: cheapStopWords,
        education_stop_words: educationStopWords,
        ai_provider: 'gemini'
      };

      const res = await fetch(`${API_BASE}/api/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Не удалось сохранить настройки');
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2500);
    } catch (e) {
      console.error("Ошибка сохранения настроек:", e);
      setIsSaved(false);
      setSaveError(e.message);
    }
  };

  const handleCheckAi = async () => {
    setIsChecking(true);
    setAiCheck('Проверяем подключение…');
    try {
      const res = await fetch(`${API_BASE}/api/ai/check`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'AI-квалификатор недоступен');
      setAiCheck(data.message);
    } catch (error) { setAiCheck(error.message); }
    finally { setIsChecking(false); }
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
            Конфигурация параметров отбора, стоп-фильтров и порогов скоринга
          </p>
        </div>

        <button 
          onClick={handleSave}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          {isSaved ? <CheckCircle2 size={16} /> : <Save size={16} />}
          <span>{isSaved ? 'Сохранено в БД!' : 'Сохранить настройки'}</span>
        </button>
      </div>

      {saveError && <div role="alert" style={{ color: '#b42318' }}>{saveError}</div>}
      <div className="card" style={{ padding: 16 }}>
        <p>Exa и Tavily ищут страницы. Google Gemini проверяет, является ли публикация заказом. Для этого нужен действующий ключ Gemini.</p>
        <button className="btn btn-outline" disabled={isChecking} onClick={handleCheckAi} style={{ marginTop: 12 }}>Проверить подключение AI</button>
        <p style={{ marginTop: 8 }}>Сначала сохраните настройки. Проверка выполняет небольшой запрос к выбранному AI-провайдеру.</p>
        {aiCheck && <p role="status" style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>{aiCheck}</p>}
      </div>
      {/* AI Engine & Web Access Settings */}
      <div className="card" style={{ padding: '20px', border: '1px solid var(--color-accent-purple)', background: '#faf9ff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--color-accent-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <Bot size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-text-black)' }}>
              Режим работы ИИ и Автономного поиска в интернете
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--color-text-headline)' }}>
              StudioRadar ищет прямые проектные заказы компаний по всему миру, включая Россию и СНГ
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <p>Движок ИИ-анализа: Google Gemini</p>
          <p>Ключи Gemini, Exa и Tavily задаются в переменных окружения сервера. Они не хранятся в настройках базы данных.</p>

          <div style={{ background: '#fff', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '12px', fontSize: '12px', color: 'var(--color-text-body)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: 'var(--color-text-black)', marginBottom: '4px' }}>
              <Globe size={14} color="var(--color-accent-purple)" />
              <span>Публичные источники поиска через Exa и Tavily:</span>
            </div>
            <ul style={{ paddingLeft: '18px', margin: '4px 0 0 0', lineHeight: 1.6 }}>
              <li><strong>HH</strong> — запросы компаний на студию или команду для проектного подряда.</li>
              <li><strong>Telegram</strong> — публичные заказы с подтверждённым бюджетом проекта от 900 000 ₽.</li>
              <li><strong>LinkedIn и Facebook</strong> — публичные публикации компаний о поиске подрядчика.</li>
              <li>Штатный найм, фриланс-биржи и тендеры исключаются.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Notifications & Digest Schedule */}
      <div className="card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <div style={{ width: '34px', height: '34px', borderRadius: '6px', background: '#e0e1f7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bell size={18} color="var(--color-accent-purple)" />
          </div>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text-black)' }}>
              Регламент оповещений и расписание дайджеста
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--color-text-headline)' }}>
              Мгновенные алерты в системе при обнаружении горячих заказчиков и утренний дайджест
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
            <span>Время формирования ежедневного дайджеста (10–30 лидов):</span>
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
