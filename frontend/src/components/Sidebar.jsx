import React, { useState } from 'react';
import { 
  Radar,
  Compass, 
  BarChart3, 
  Radio, 
  Layers, 
  Globe, 
  Settings, 
  HelpCircle,
  SlidersHorizontal,
  ShieldCheck,
  Zap
} from 'lucide-react';

export default function Sidebar({ 
  activeView,
  setActiveView,
  leadsCount = 0,
  pipelinesCount = 0
}) {
  const [isHovered, setIsHovered] = useState(false);

  const navItems = [
    { id: 'leads', label: 'Радар лидов', icon: Compass, count: leadsCount },
    { id: 'overview', label: 'Аналитика', icon: BarChart3 },
    { id: 'signals', label: 'Сигналы спроса', icon: Radio },
    { id: 'pipelines', label: 'Пайплайны', icon: Layers, count: pipelinesCount },
    { id: 'sources', label: 'Источники', icon: Globe },
  ];

  return (
    <div className="sidebar-wrapper">
      <aside 
        className={`sidebar ${isHovered ? 'is-hovered' : ''}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          width: isHovered ? '230px' : '64px',
          background: '#ffffff',
          borderRight: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '16px 0',
          transition: 'width 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          boxShadow: isHovered ? '4px 0 24px rgba(15, 23, 42, 0.08)' : 'none'
        }}
      >
        {/* Top: StudioRadar Beacon Logo + Navigation Links */}
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
          
          {/* Logo Brand Header */}
          <div 
            onClick={() => setActiveView('leads')}
            style={{ 
              height: '44px', 
              display: 'flex', 
              alignItems: 'center', 
              paddingLeft: '14px',
              marginBottom: '16px',
              cursor: 'pointer'
            }}
            title="StudioRadar AI"
          >
            <div style={{ 
              width: '36px', 
              height: '36px', 
              borderRadius: '10px', 
              background: 'linear-gradient(135deg, #3730a3 0%, #4f46e5 100%)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 2px 6px rgba(79, 70, 229, 0.3)',
              position: 'relative'
            }}>
              <Radar size={19} color="#ffffff" />
              <div style={{
                position: 'absolute',
                top: '4px',
                right: '4px',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#10b981'
              }} />
            </div>

            {isHovered && (
              <div style={{ marginLeft: '12px', display: 'flex', flexDirection: 'column' }}>
                <span style={{ 
                  fontWeight: 800, 
                  fontSize: '15px', 
                  color: '#0f172a',
                  letterSpacing: '-0.02em',
                  fontFamily: 'var(--font-heading)'
                }}>
                  StudioRadar
                </span>
                <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>
                  B2B AI Engine
                </span>
              </div>
            )}
          </div>

          {/* Navigation Items */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '0 8px' }}>
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeView === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    height: '42px',
                    width: '100%',
                    padding: '0 10px',
                    borderRadius: '8px',
                    border: 'none',
                    background: isActive ? '#eef2ff' : 'transparent',
                    color: isActive ? '#4f46e5' : '#64748b',
                    cursor: 'pointer',
                    transition: 'all 0.14s ease',
                    position: 'relative'
                  }}
                  title={item.label}
                  type="button"
                >
                  <div style={{ width: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} color={isActive ? '#4f46e5' : '#64748b'} />
                  </div>

                  {isHovered && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginLeft: '10px' }}>
                      <span style={{ 
                        fontSize: '13px', 
                        fontWeight: isActive ? 600 : 500,
                        color: isActive ? '#0f172a' : '#475467'
                      }}>
                        {item.label}
                      </span>
                      {item.count !== undefined && item.count > 0 && (
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: '9999px',
                          background: isActive ? '#ffffff' : '#f1f5f9',
                          color: isActive ? '#4f46e5' : '#64748b',
                          fontFamily: 'var(--font-mono)'
                        }}>
                          {item.count}
                        </span>
                      )}
                    </div>
                  )}

                  {isActive && (
                    <div style={{
                      position: 'absolute',
                      left: 0,
                      top: '8px',
                      bottom: '8px',
                      width: '3px',
                      borderRadius: '0 3px 3px 0',
                      background: '#4f46e5'
                    }} />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom: Settings, Help & Studio Avatar */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', width: '100%', padding: '0 8px' }}>
          
          <button 
            type="button"
            onClick={() => setActiveView('settings')}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: '#64748b', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              width: '100%',
              padding: isHovered ? '8px 10px' : '0',
              justifyContent: isHovered ? 'flex-start' : 'center',
              gap: '10px',
              borderRadius: '8px'
            }}
            title="Настройки"
          >
            <Settings size={18} strokeWidth={1.8} />
            {isHovered && <span style={{ fontSize: '13px', color: '#475467', fontWeight: 500 }}>Настройки</span>}
          </button>

          {/* Studio Profile Avatar */}
          <div 
            onClick={() => setActiveView('settings')}
            title="Studio Workspace (Аккаунт студии)"
            style={{ 
              width: '36px', 
              height: '36px', 
              borderRadius: '8px', 
              background: '#0f172a', 
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '12px',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              cursor: 'pointer',
              fontFamily: 'var(--font-mono)',
              boxShadow: '0 1px 3px rgba(15, 23, 42, 0.2)'
            }}
          >
            SR
          </div>
        </div>
      </aside>
    </div>
  );
}
