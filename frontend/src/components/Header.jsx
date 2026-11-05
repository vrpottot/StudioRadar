import React from 'react';
import { 
  HelpCircle, 
  Sparkles, 
  Calendar, 
  Zap, 
  Loader2, 
  Search,
  CheckCircle2,
  SlidersHorizontal,
  Compass,
  Layers,
  TrendingUp,
  Radio,
  Settings,
  Flame,
  FileSpreadsheet
} from 'lucide-react';

export default function Header({ 
  activeView,
  setActiveView,
  onFullScan,
  isScanningAll,
  leadsCount,
  aiProgressMessage
}) {
  const currentDate = new Intl.DateTimeFormat('ru-RU', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long' 
  }).format(new Date());

  const navItems = [
    { id: 'overview', label: 'Обзор' },
    { id: 'signals', label: 'Сигналы' },
    { id: 'leads', label: 'Поиск ЛПР' },
    { id: 'pipelines', label: 'Мои компании' },
    { id: 'sources', label: 'Автопилот' }
  ];

  return (
    <header className="top-bar" style={{ background: '#ffffff', borderBottom: '1px solid var(--border-subtle)', padding: '16px 28px' }}>
      {/* Top Row: Title, Floating Pill Navigation, Support & Profile */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: '16px' }}>
        
        {/* Brand Title with subtle Help circle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--color-text-black)', letterSpacing: '-0.03em', fontFamily: 'var(--font-heading)' }}>
            Playbook
          </h1>
          <button 
            type="button"
            title="Интеллектуальная система квалификации и поиска B2B-заказов StudioRadar"
            style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '2px' }}
          >
            <HelpCircle size={16} />
          </button>
        </div>

        {/* Center: Floating Pill Navigation Bar (Exact reference aesthetic) */}
        <nav className="pill-nav" aria-label="Разделы системы">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`pill-nav-item ${activeView === item.id ? 'active' : ''}`}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Right: Support & Business Profile Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button 
            type="button"
            className="pill-button"
            title="Служба поддержки и документация"
            onClick={() => setActiveView('settings')}
          >
            <HelpCircle size={14} color="var(--color-text-headline)" />
            <span>Поддержка</span>
          </button>

          <button 
            type="button"
            className="pill-button"
            style={{ color: 'var(--color-accent-purple)', borderColor: 'var(--color-accent-lavender)', background: '#faf5ff' }}
            title="Настройки профиля бизнеса студии"
            onClick={() => setActiveView('settings')}
          >
            <Sparkles size={14} color="var(--color-accent-purple)" />
            <span>Профиль бизнеса</span>
          </button>
        </div>
      </div>

      {/* Second Row: Subheader with Schedule Status & Main Action Button */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        marginTop: '14px', 
        paddingTop: '12px', 
        borderTop: '1px solid #f2f4f7',
        flexWrap: 'wrap', 
        gap: '12px' 
      }}>
        {/* Date, Refresh Notice & Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="pill-button"
            onClick={() => setActiveView('overview')}
            style={{ padding: '5px 12px', fontSize: '12px', fontWeight: 600 }}
          >
            <Calendar size={13} color="var(--color-text-headline)" />
            <span>Записаться на демо</span>
          </button>

          <span style={{ fontSize: '12px', color: 'var(--color-text-headline)' }}>
            {currentDate} — оценки пересчитаны сегодня в {new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })} — проверено {leadsCount} компаний
          </span>
        </div>

        {/* Action Buttons: "Открыть список" (exact match to Gradly Playbook) and "Сканировать рынок" */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setActiveView('leads')}
            className={`pill-button ${activeView === 'leads' ? 'pill-button-primary' : ''}`}
            style={{ 
              padding: '7px 16px', 
              fontSize: '13px',
              background: activeView === 'leads' ? '#4f46e5' : '#ffffff',
              color: activeView === 'leads' ? '#ffffff' : '#4f46e5',
              borderColor: '#c7d2fe'
            }}
            type="button"
          >
            <Zap size={14} color={activeView === 'leads' ? '#ffffff' : '#4f46e5'} />
            <span>Открыть список</span>
          </button>

          <button
            onClick={onFullScan}
            disabled={isScanningAll}
            className="pill-button pill-button-primary"
            style={{ padding: '7px 16px', fontSize: '13px' }}
            type="button"
          >
            {isScanningAll ? (
              <>
                <Loader2 size={14} className="spin" />
                <span>Поиск в сети...</span>
              </>
            ) : (
              <>
                <Sparkles size={14} />
                <span>Сканировать рынок</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Live Progress Ticker (Clean minimal banner) */}
      {aiProgressMessage && (
        <div style={{
          marginTop: '10px',
          background: '#f8fafc',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '8px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '12px',
          color: 'var(--color-text-body)'
        }}>
          <Loader2 size={13} className="spin" color="var(--color-accent-purple)" />
          <span>{aiProgressMessage}</span>
        </div>
      )}
    </header>
  );
}
