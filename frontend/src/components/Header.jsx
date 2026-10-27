import React from 'react';
import { 
  Loader2, 
  ShieldCheck, 
  PhoneCall, 
  Sparkles,
  Search,
  Target,
  Send
} from 'lucide-react';

export default function Header({ 
  onAiHunt,
  isAiHunting,
  onHhScan,
  isHhScanning,
  onTgScan,
  isTgScanning,
  leadsCount,
  aiProgressMessage
}) {
  return (
    <header className="top-bar" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        {/* Left: Title & Status indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-black)', letterSpacing: '-0.02em' }}>
              Поток B2B-заявок
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--color-text-headline)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-accent-purple)', fontWeight: 500 }}>
                <ShieldCheck size={14} color="var(--color-accent-purple)" /> Прямые клиенты
              </span>
              <span>•</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-accent-purple)', fontWeight: 500 }}>
                <PhoneCall size={14} color="var(--color-accent-purple)" /> С номерами телефонов
              </span>
            </div>
          </div>

          {/* Daily Goal Pill */}
          <div style={{ 
            background: 'var(--color-surface-beige-1)', 
            border: '1px solid var(--border-medium)', 
            padding: '5px 12px', 
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '7px'
          }}>
            <Target size={14} color="var(--color-accent-purple)" />
            <div style={{ fontSize: '12px' }}>
              <span style={{ color: 'var(--color-text-headline)' }}>Дневной план: </span>
              <strong style={{ color: 'var(--color-text-black)', fontFamily: 'var(--font-mono)' }}>{leadsCount}</strong>
              <span style={{ color: 'var(--color-accent-purple)', fontWeight: 600 }}> / 20–30 лидов</span>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* HeadHunter Scan Button */}
          <button 
            onClick={onHhScan} 
            disabled={isHhScanning || isAiHunting || isTgScanning}
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
                <Search size={14} color="var(--color-text-headline)" />
                <span>Сбор с HH.ru</span>
              </>
            )}
          </button>

          {/* Telegram Channels Scan Button */}
          <button 
            onClick={onTgScan} 
            disabled={isTgScanning || isHhScanning || isAiHunting}
            className="btn btn-outline"
            style={{ padding: '8px 14px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
            title="Собрать заказы из Telegram каналов и чатов"
          >
            {isTgScanning ? (
              <>
                <Loader2 size={14} className="spin" />
                <span>TG поиск...</span>
              </>
            ) : (
              <>
                <Send size={14} color="var(--color-accent-purple)" />
                <span>Сбор с Telegram</span>
              </>
            )}
          </button>

          {/* Gemini AI Autonomous Lead Hunter Button - Gradly Signature Button */}
          <button 
            onClick={onAiHunt} 
            disabled={isAiHunting || isHhScanning}
            className="btn btn-primary"
            style={{ 
              minWidth: '200px'
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
          background: 'var(--color-surface-beige-1)',
          border: '1px solid var(--color-accent-lavender)',
          borderRadius: '6px',
          padding: '6px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '12px',
          color: 'var(--color-accent-purple)'
        }}>
          <Sparkles size={14} color="var(--color-accent-purple)" className={isAiHunting ? "spin" : ""} />
          <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>ИИ-Ассистент:</span>
          <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {aiProgressMessage}
          </span>
        </div>
      )}
    </header>
  );
}
