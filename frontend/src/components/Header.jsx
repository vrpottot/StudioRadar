import React from 'react';
import { 
  Radar, 
  Sparkles, 
  Search, 
  Loader2, 
  Layers, 
  Radio, 
  BarChart3, 
  Globe, 
  SlidersHorizontal,
  Compass,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Zap
} from 'lucide-react';

export default function Header({ 
  activeView,
  setActiveView,
  onFullScan,
  isScanningAll,
  leadsCount = 0,
  aiProgressMessage = ''
}) {
  const navItems = [
    { id: 'leads', label: 'Радар лидов', icon: Compass, badge: leadsCount },
    { id: 'overview', label: 'Аналитика спроса', icon: BarChart3 },
    { id: 'signals', label: 'Каталог сигналов', icon: Radio },
    { id: 'pipelines', label: 'Пайплайны', icon: Layers },
    { id: 'sources', label: 'Источники данных', icon: Globe },
  ];

  return (
    <header className="top-bar" style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '14px 28px' }}>
      {/* Top Row: Brand & Live Beacon, Segmented Nav, Action Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: '16px' }}>
        
        {/* Brand Identity: StudioRadar AI */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => setActiveView('leads')}>
            {/* Custom Radar Beacon Mark */}
            <div style={{ 
              width: '36px', 
              height: '36px', 
              borderRadius: '10px', 
              background: 'linear-gradient(135deg, #3730a3 0%, #4f46e5 100%)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(79, 70, 229, 0.28)',
              position: 'relative'
            }}>
              <Radar size={20} color="#ffffff" />
              <div style={{
                position: 'absolute',
                top: '4px',
                right: '4px',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#10b981',
                boxShadow: '0 0 6px #10b981'
              }} />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em', fontFamily: 'var(--font-heading)' }}>
                  StudioRadar
                </span>
                <span style={{ 
                  fontSize: '10px', 
                  fontWeight: 700, 
                  background: '#eef2ff', 
                  color: '#4f46e5', 
                  padding: '1px 6px', 
                  borderRadius: '4px',
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '0.04em'
                }}>
                  AI B2B
                </span>
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="pulse-dot" style={{ width: '6px', height: '6px' }} />
                <span>Радар активен · Поиск прямых заказчиков</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center: Modern Segmented Navigation Bar */}
        <nav className="segmented-control" aria-label="Разделы платформы">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`segmented-item ${isActive ? 'active' : ''}`}
                type="button"
              >
                <Icon size={14} color={isActive ? '#4f46e5' : '#64748b'} />
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: '9999px',
                    background: isActive ? '#eef2ff' : '#f1f5f9',
                    color: isActive ? '#4f46e5' : '#64748b',
                    fontFamily: 'var(--font-mono)'
                  }}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right: Quick Scanner Button & Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={onFullScan}
            disabled={isScanningAll}
            className="btn btn-primary"
            style={{ 
              padding: '7px 16px', 
              borderRadius: '8px',
              fontSize: '13px',
              boxShadow: '0 2px 8px rgba(79, 70, 229, 0.25)'
            }}
            type="button"
            title="Запустить глубокий ИИ-поиск коммерческих заказов и открытых брифов"
          >
            {isScanningAll ? (
              <>
                <Loader2 size={14} className="spin" />
                <span>Поиск в открытом вебе...</span>
              </>
            ) : (
              <>
                <Sparkles size={14} />
                <span>Запустить ИИ-радар</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveView('settings')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              background: '#ffffff',
              cursor: 'pointer',
              color: '#334155'
            }}
            title="Настройки профиля студии и параметров поиска"
          >
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '6px',
              background: '#0f172a',
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-mono)'
            }}>
              SR
            </div>
            <span style={{ fontSize: '12px', fontWeight: 600 }}>Профиль студии</span>
          </button>
        </div>
      </div>

      {/* Second Row: Real-time intelligence summary ticker */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        marginTop: '12px', 
        paddingTop: '10px', 
        borderTop: '1px solid #f1f5f9',
        flexWrap: 'wrap', 
        gap: '12px',
        fontSize: '12px',
        color: '#64748b'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#0f172a', fontWeight: 600 }}>
            <ShieldCheck size={14} color="#10b981" />
            <span>Прямые заказчики без посредников (No-Broker)</span>
          </span>

          <span style={{ color: '#94a3b8' }}>•</span>

          <span>
            Обновлено: <strong style={{ color: '#0f172a', fontFamily: 'var(--font-mono)' }}>{new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</strong>
          </span>

          <span style={{ color: '#94a3b8' }}>•</span>

          <span>
            Проверено компаний в РФ/СНГ: <strong style={{ color: '#0f172a', fontFamily: 'var(--font-mono)' }}>{leadsCount}</strong>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '11px', color: '#475467' }}>
            Целевые услуги: 3D моушн, CGI, 2D анимация, видеопродакшн
          </span>
        </div>
      </div>

      {/* Live AI Progress Notification Ticker */}
      {aiProgressMessage && (
        <div style={{
          marginTop: '10px',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '8px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '12px',
          color: '#1e293b'
        }}>
          <Loader2 size={13} className="spin" color="#4f46e5" />
          <span>{aiProgressMessage}</span>
        </div>
      )}
    </header>
  );
}
