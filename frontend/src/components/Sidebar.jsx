import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Sparkles, 
  Layers, 
  TrendingUp, 
  Radio, 
  Settings, 
  HelpCircle,
  Zap,
  Mail,
  Send,
  CreditCard,
  Briefcase
} from 'lucide-react';

export default function Sidebar({ 
  activeView,
  setActiveView,
  leadsCount = 0,
  pipelinesCount = 0
}) {
  const [isHovered, setIsHovered] = useState(false);

  const navItems = [
    { id: 'overview', label: 'Обзор', icon: Sparkles },
    { id: 'signals', label: 'Сигналы', icon: Mail },
    { id: 'leads', label: 'Поиск ЛПР', icon: Send },
    { id: 'pipelines', label: 'Мои компании', icon: Briefcase },
    { id: 'sources', label: 'Автопилот', icon: CreditCard }
  ];

  return (
    <div className="sidebar-wrapper">
      <aside 
        className={`sidebar ${isHovered ? 'is-hovered' : ''}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          width: isHovered ? '240px' : '64px',
          background: '#ffffff',
          borderRight: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '16px 0',
          transition: 'width 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          boxShadow: isHovered ? '4px 0 24px rgba(16, 24, 40, 0.08)' : 'none'
        }}
      >
        {/* Top: Minimalist Logo + Nav Icons */}
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
          {/* Circular Logo (Reference screenshot style: soft purple circle with letter) */}
          <div style={{ 
            height: '48px', 
            display: 'flex', 
            alignItems: 'center', 
            paddingLeft: '16px',
            marginBottom: '16px'
          }}>
            <div style={{ 
              width: '32px', 
              height: '32px', 
              borderRadius: '50%', 
              background: '#e0e7ff', 
              color: '#4f46e5',
              fontWeight: 800,
              fontSize: '15px',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              flexShrink: 0
            }}>
              g
            </div>
            {isHovered && (
              <span style={{ 
                marginLeft: '12px', 
                fontWeight: 700, 
                fontSize: '15px', 
                color: 'var(--color-text-black)',
                letterSpacing: '-0.02em',
                fontFamily: 'var(--font-heading)'
              }}>
                StudioRadar
              </span>
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
                    height: '40px',
                    width: '100%',
                    padding: '0 12px',
                    borderRadius: '8px',
                    border: 'none',
                    background: isActive ? '#f4f4f5' : 'transparent',
                    color: isActive ? '#4f46e5' : '#64748b',
                    cursor: 'pointer',
                    transition: 'all 0.14s ease'
                  }}
                  title={item.label}
                  type="button"
                >
                  <div style={{ width: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} color={isActive ? '#4f46e5' : '#64748b'} />
                  </div>
                  {isHovered && (
                    <span style={{ 
                      marginLeft: '12px', 
                      fontSize: '13px', 
                      fontWeight: isActive ? 600 : 500,
                      color: isActive ? '#101828' : '#475467'
                    }}>
                      {item.label}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom: Settings, Notification Pill & User Avatar */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', width: '100%', padding: '0 12px' }}>
          
          <button 
            type="button"
            onClick={() => setActiveView('settings')}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: '#94a3b8', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              width: '100%',
              padding: isHovered ? '6px 12px' : '0',
              justifyContent: isHovered ? 'flex-start' : 'center',
              gap: '12px'
            }}
            title="Настройки"
          >
            <Settings size={18} strokeWidth={1.8} />
            {isHovered && <span style={{ fontSize: '13px', color: '#64748b' }}>Настройки</span>}
          </button>

          {/* Unread Pill "0" */}
          <div style={{
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            background: '#f1f5f9',
            color: '#64748b',
            fontSize: '11px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            0
          </div>

          {/* User Avatar: Pink circle with "V" (Exact match with user's reference screenshot) */}
          <div 
            title="Профиль: vrpottot"
            style={{ 
              width: '32px', 
              height: '32px', 
              borderRadius: '50%', 
              background: '#e11d48', 
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '13px',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            V
          </div>
        </div>
      </aside>
    </div>
  );
}
