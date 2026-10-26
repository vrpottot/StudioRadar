import React from 'react';
import { 
  Loader2, 
  ShieldCheck, 
  PhoneCall, 
  Sparkles,
  Search,
  Target
} from 'lucide-react';

export default function Header({ 
  onAiHunt,
  isAiHunting,
  onHhScan,
  isHhScanning,
  leadsCount,
  aiProgressMessage
}) {
  return (
    <header className="top-bar" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        {/* Left: Title & Status indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
              Поток B2B-заявок
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#059669', fontWeight: 500 }}>
                <ShieldCheck size={14} /> Прямые клиенты
              </span>
              <span>•</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#0284c7', fontWeight: 500 }}>
                <PhoneCall size={14} /> С номерами телефонов
              </span>
            </div>
          </div>

          {/* Daily Goal Pill */}
          <div style={{ 
            background: 'var(--primary-subtle)', 
            border: '1px solid var(--primary-border)', 
            padding: '5px 12px', 
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '7px'
          }}>
            <Target size={14} color="#7c3aed" />
            <div style={{ fontSize: '12px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Дневной план: </span>
              <strong style={{ color: '#0f172a' }}>{leadsCount}</strong>
              <span style={{ color: '#7c3aed', fontWeight: 600 }}> / 20–30 лидов</span>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* HeadHunter Scan Button */}
          <button 
            onClick={onHhScan} 
            disabled={isHhScanning || isAiHunting}
            className="btn btn-outline"
            style={{ padding: '8px 14px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
            title="Просканировать свежие вакансии-проекты на hh.ru"
          >
            {isHhScanning ? (
              <>
                <Loader2 size={14} className="spin" />
                <span>HH.ru поиск...</span>
              </>
            ) : (
              <>
                <Search size={14} color="#d97706" />
                <span>Сбор с HH.ru</span>
              </>
            )}
          </button>

          {/* Gemini AI Autonomous Lead Hunter Button */}
          <button 
            onClick={onAiHunt} 
            disabled={isAiHunting || isHhScanning}
            className="btn btn-primary"
            style={{ 
              minWidth: '200px', 
              background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
              border: 'none',
              boxShadow: '0 2px 8px rgba(124, 58, 237, 0.25)'
            }}
          >
            {isAiHunting ? (
              <>
                <Loader2 size={15} className="spin" />
                <span>ИИ ищет клиентов…</span>
              </>
            ) : (
              <>
                <Sparkles size={15} />
                <span>ИИ-Поиск (Gemini)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Live AI Progress Ticker Bar */}
      {aiProgressMessage && (
        <div style={{
          width: '100%',
          background: 'linear-gradient(90deg, #f5f3ff, #ede9fe)',
          border: '1px solid #ddd6fe',
          borderRadius: '8px',
          padding: '6px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '12px',
          color: '#5b21b6'
        }}>
          <Sparkles size={14} color="#7c3aed" className={isAiHunting ? "spin" : ""} />
          <span style={{ fontWeight: 600 }}>ИИ-Ассистент:</span>
          <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {aiProgressMessage}
          </span>
        </div>
      )}
    </header>
  );
}
