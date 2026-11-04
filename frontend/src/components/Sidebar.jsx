import React, { useState } from 'react';
import { 
  Layers, 
  PhoneCall, 
  Clock, 
  CheckCircle2, 
  Radar, 
  TrendingUp, 
  Sparkles, 
  Radio, 
  LayoutDashboard,
  Settings
} from 'lucide-react';

export default function Sidebar({ 
  activeView,
  setActiveView,
  filterStatus, 
  setFilterStatus, 
  onlyWithPhone, 
  setOnlyWithPhone,
  leadsCount,
  phoneLeadsCount,
  inProgressCount,
  pipelinesCount = 4
}) {
  const [isHovered, setIsHovered] = useState(false);
  const isLeadsView = activeView === 'leads';

  const navItems = [
    {
      id: 'overview',
      label: 'Обзор',
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: 'pipelines',
      label: 'Пайплайны',
      icon: Layers,
      badge: pipelinesCount
    },
    {
      id: 'leads',
      label: 'Лиды',
      icon: TrendingUp,
      badge: leadsCount
    },
    {
      id: 'signals',
      label: 'Каталог сигналов',
      icon: Sparkles,
      badge: null
    },
    {
      id: 'sources',
      label: 'Источники данных',
      icon: Radio,
      badge: null
    },
    {
      id: 'settings',
      label: 'Настройки',
      icon: Settings,
      badge: null
    }
  ];

  return (
    <div className="sidebar-wrapper">
      <aside 
        className={`sidebar ${isHovered ? 'is-hovered' : ''}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Brand Header */}
        <div style={{ 
          height: '68px', 
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          padding: '0',
          position: 'relative'
        }}>
          {/* Logo icon - Exactly centered in 68px (14px + 40px + 14px = 68px) */}
          <div style={{ 
            width: '40px', 
            height: '40px', 
            minWidth: '40px',
            marginLeft: '14px',
            borderRadius: '10px', 
            background: 'linear-gradient(135deg, #3b2a60 0%, #241740 100%)', 
            border: '1px solid rgba(212, 197, 246, 0.25)',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            boxShadow: '0 2px 10px rgba(59, 42, 96, 0.35)',
            flexShrink: 0
          }}>
            <Radar size={22} color="#d4c5f6" strokeWidth={2.2} />
          </div>

          {/* Title & Status - Fades in on hover */}
          <div style={{ 
            marginLeft: '12px',
            opacity: isHovered ? 1 : 0,
            transform: isHovered ? 'translateX(0)' : 'translateX(-8px)',
            transition: 'opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1), transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            pointerEvents: isHovered ? 'auto' : 'none',
            overflow: 'hidden',
            whiteSpace: 'nowrap'
          }}>
            <div className="brand-font" style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text-black)', letterSpacing: '-0.02em' }}>
              StudioRadar
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-headline)', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-accent-green)' }} className="pulse"></span>
              Мониторинг активен
            </div>
          </div>
        </div>

        {/* Navigation Items List */}
        <div style={{ padding: '14px 0', display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, overflowY: 'auto' }}>
          {/* Section title (visible on hover) */}
          <div style={{ 
            height: isHovered ? '24px' : '0px',
            overflow: 'hidden',
            opacity: isHovered ? 1 : 0,
            transition: 'all 0.18s ease',
            paddingLeft: '18px',
            fontSize: '10px',
            fontWeight: 700,
            textTransform: 'uppercase',
            color: 'var(--color-text-headline)',
            letterSpacing: '0.08em',
            fontFamily: 'var(--font-mono)'
          }}>
            РАЗДЕЛЫ ПЛАТФОРМЫ
          </div>

          {navItems.map((item) => {
            const isActive = activeView === item.id;
            const Icon = item.icon;

            return (
              <div key={item.id}>
                <button
                  onClick={() => {
                    setActiveView(item.id);
                    if (item.id === 'leads') {
                      setFilterStatus('all');
                      setOnlyWithPhone(false);
                    }
                  }}
                  title={!isHovered ? item.label : undefined}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    height: '44px',
                    width: isHovered ? 'calc(100% - 16px)' : '100%',
                    margin: isHovered ? '0 8px' : '0',
                    borderRadius: '8px',
                    border: 'none',
                    background: isActive ? 'var(--color-surface-beige-3)' : 'transparent',
                    color: isActive ? 'var(--color-accent-purple)' : 'var(--color-text-body)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    textAlign: 'left'
                  }}
                >
                  {/* Icon - Perfectly aligned with logo */}
                  <div style={{ 
                    width: '40px', 
                    minWidth: '40px', 
                    marginLeft: isHovered ? '6px' : '14px',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Icon size={19} />
                  </div>

                  {/* Label & Badge (Fades in on hover) */}
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    flex: 1,
                    paddingRight: '12px',
                    paddingLeft: '8px',
                    opacity: isHovered ? 1 : 0,
                    transform: isHovered ? 'translateX(0)' : 'translateX(-8px)',
                    transition: 'opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1), transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    pointerEvents: isHovered ? 'auto' : 'none',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap'
                  }}>
                    <span style={{ fontSize: '13px', fontWeight: isActive ? 700 : 500 }}>
                      {item.label}
                    </span>

                    {item.badge !== null && (
                      <span style={{ 
                        fontSize: '11px', 
                        fontFamily: 'var(--font-mono)',
                        padding: '1px 6px', 
                        borderRadius: '4px', 
                        background: isActive ? 'var(--color-accent-purple)' : 'var(--color-surface-beige-3)', 
                        color: isActive ? '#ffffff' : 'var(--color-text-black)',
                        fontWeight: 600
                      }}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                </button>

                {/* Sub-filters for Leads (Visible on hover when on leads screen) */}
                {item.id === 'leads' && isLeadsView && isHovered && (
                  <div style={{ paddingLeft: '56px', paddingRight: '14px', display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '2px', marginBottom: '4px' }}>
                    <button
                      onClick={() => { setFilterStatus('all'); setOnlyWithPhone(true); }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 8px',
                        borderRadius: '4px',
                        border: 'none',
                        background: onlyWithPhone ? 'var(--accent-emerald-subtle)' : 'transparent',
                        color: onlyWithPhone ? 'var(--color-accent-green-text)' : 'var(--color-text-headline)',
                        fontWeight: onlyWithPhone ? 600 : 400,
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <PhoneCall size={12} />
                        <span>С телефоном</span>
                      </div>
                      <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{phoneLeadsCount}</span>
                    </button>

                    <button
                      onClick={() => { setFilterStatus('in_progress'); setOnlyWithPhone(false); }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 8px',
                        borderRadius: '4px',
                        border: 'none',
                        background: filterStatus === 'in_progress' ? '#e0e1f7' : 'transparent',
                        color: filterStatus === 'in_progress' ? 'var(--color-accent-purple)' : 'var(--color-text-headline)',
                        fontWeight: filterStatus === 'in_progress' ? 600 : 400,
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={12} />
                        <span>В работе</span>
                      </div>
                      <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{inProgressCount}</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Profile Footer */}
        <div style={{ 
          height: '64px',
          borderTop: '1px solid var(--border-subtle)', 
          background: 'var(--color-surface-beige-2)',
          display: 'flex',
          alignItems: 'center',
          padding: '0'
        }}>
          {/* Avatar circle - perfectly aligned with logo and icons */}
          <div style={{ 
            width: '38px', 
            height: '38px', 
            minWidth: '38px',
            marginLeft: '15px',
            borderRadius: '50%', 
            background: 'var(--color-accent-purple)', 
            color: '#ffffff', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            fontSize: '12px', 
            fontWeight: 700,
            flexShrink: 0
          }}>
            SR
          </div>

          {/* Profile Name & Plan (Fades in on hover) */}
          <div style={{ 
            marginLeft: '12px',
            opacity: isHovered ? 1 : 0,
            transform: isHovered ? 'translateX(0)' : 'translateX(-8px)',
            transition: 'opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1), transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            pointerEvents: isHovered ? 'auto' : 'none',
            overflow: 'hidden',
            whiteSpace: 'nowrap'
          }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-black)', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              Motion Studio Admin
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-headline)' }}>
              Тариф: Enterprise
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
