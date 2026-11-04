import React from 'react';
import { 
  Loader2, 
  ShieldCheck, 
  PhoneCall, 
  Search, 
  Target
} from 'lucide-react';

export default function Header({ 
  onFullScan,
  isScanningAll,
  leadsCount,
  aiProgressMessage
}) {
  return (
    <header className="top-bar" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: '12px' }}>
        {/* Left: Title & Status indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
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

        {/* Right: Unified Action Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button 
            onClick={onFullScan} 
            disabled={isScanningAll}
            className="btn btn-dark"
            style={{ 
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              background: 'var(--color-accent-purple)',
              color: '#ffffff',
              border: '1px solid var(--color-accent-purple)',
              boxShadow: '0 2px 6px rgba(59, 42, 96, 0.25)',
              cursor: isScanningAll ? 'not-allowed' : 'pointer'
            }}
            title="Запустить сквозной поиск по всем источникам (Web Hunter)"
          >
            {isScanningAll ? (
              <>
                <Loader2 size={14} className="spin" color="#ffffff" />
                <span style={{ color: '#ffffff', fontWeight: 600 }}>Поиск...</span>
              </>
            ) : (
              <>
                <Search size={14} color="#ffffff" />
                <span style={{ color: '#ffffff', fontWeight: 600 }}>Поиск</span>
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
          padding: '8px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '12px',
          color: 'var(--color-accent-purple)',
          animation: 'fadeIn 0.2s ease'
        }}>
          <Search size={14} color="var(--color-accent-purple)" className={isScanningAll ? "spin" : ""} />
          <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>Мониторинг:</span>
          <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {aiProgressMessage}
          </span>
        </div>
      )}
    </header>
  );
}
