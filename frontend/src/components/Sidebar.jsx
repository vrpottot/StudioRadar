import React from 'react';
import { 
  Layers, 
  PhoneCall, 
  Clock, 
  CheckCircle2, 
  Bookmark,
  Box,
  TrendingUp
} from 'lucide-react';

export default function Sidebar({ 
  filterStatus, 
  setFilterStatus, 
  onlyWithPhone, 
  setOnlyWithPhone,
  leadsCount,
  phoneLeadsCount,
  inProgressCount
}) {
  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div style={{ padding: '20px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ 
            width: '34px', 
            height: '34px', 
            borderRadius: '8px', 
            background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(124, 58, 237, 0.25)'
          }}>
            <Box size={18} color="#ffffff" />
          </div>
          <div>
            <div className="brand-font" style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
              StudioRadar
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} className="pulse"></span>
              Мониторинг активен
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div style={{ padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
        <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em', padding: '0 8px 6px 8px' }}>
          Навигация
        </div>

        {/* All Leads */}
        <button
          onClick={() => { setFilterStatus('all'); setOnlyWithPhone(false); }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '9px 12px',
            borderRadius: '8px',
            border: 'none',
            background: filterStatus === 'all' && !onlyWithPhone ? 'var(--primary-subtle)' : 'transparent',
            color: filterStatus === 'all' && !onlyWithPhone ? 'var(--primary)' : 'var(--text-secondary)',
            fontWeight: 600,
            fontSize: '13px',
            cursor: 'pointer',
            textAlign: 'left'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
            <Layers size={16} />
            <span>Все заявки</span>
          </div>
          <span style={{ 
            fontSize: '11px', 
            padding: '2px 7px', 
            borderRadius: '6px', 
            background: filterStatus === 'all' && !onlyWithPhone ? 'var(--primary)' : '#f1f5f9', 
            color: filterStatus === 'all' && !onlyWithPhone ? '#ffffff' : 'var(--text-secondary)',
            fontWeight: 700
          }}>
            {leadsCount}
          </span>
        </button>

        {/* Ready to Call (With Phone) */}
        <button
          onClick={() => { setFilterStatus('all'); setOnlyWithPhone(true); }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '9px 12px',
            borderRadius: '8px',
            border: 'none',
            background: onlyWithPhone ? 'var(--accent-emerald-subtle)' : 'transparent',
            color: onlyWithPhone ? 'var(--accent-emerald-text)' : 'var(--text-secondary)',
            fontWeight: 600,
            fontSize: '13px',
            cursor: 'pointer',
            textAlign: 'left'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
            <PhoneCall size={16} />
            <span>Готовы к звонку</span>
          </div>
          <span style={{ 
            fontSize: '11px', 
            padding: '2px 7px', 
            borderRadius: '6px', 
            background: onlyWithPhone ? 'var(--accent-emerald)' : '#f1f5f9', 
            color: onlyWithPhone ? '#ffffff' : 'var(--text-secondary)',
            fontWeight: 700
          }}>
            {phoneLeadsCount}
          </span>
        </button>

        {/* In Progress */}
        <button
          onClick={() => { setFilterStatus('in_progress'); setOnlyWithPhone(false); }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '9px 12px',
            borderRadius: '8px',
            border: 'none',
            background: filterStatus === 'in_progress' ? '#eff6ff' : 'transparent',
            color: filterStatus === 'in_progress' ? '#1d4ed8' : 'var(--text-secondary)',
            fontWeight: 600,
            fontSize: '13px',
            cursor: 'pointer',
            textAlign: 'left'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
            <Clock size={16} />
            <span>В работе</span>
          </div>
          <span style={{ 
            fontSize: '11px', 
            padding: '2px 7px', 
            borderRadius: '6px', 
            background: filterStatus === 'in_progress' ? '#2563eb' : '#f1f5f9', 
            color: filterStatus === 'in_progress' ? '#ffffff' : 'var(--text-secondary)',
            fontWeight: 700
          }}>
            {inProgressCount}
          </span>
        </button>

        {/* Closed deals */}
        <button
          onClick={() => { setFilterStatus('closed'); setOnlyWithPhone(false); }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '9px 12px',
            borderRadius: '8px',
            border: 'none',
            background: filterStatus === 'closed' ? '#f0fdf4' : 'transparent',
            color: filterStatus === 'closed' ? '#15803d' : 'var(--text-secondary)',
            fontWeight: 600,
            fontSize: '13px',
            cursor: 'pointer',
            textAlign: 'left'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
            <CheckCircle2 size={16} />
            <span>Сделки / КП</span>
          </div>
        </button>
      </div>

      {/* Services Footer Widget */}
      <div style={{ padding: '16px', borderTop: '1px solid var(--border-subtle)', background: '#fafafa' }}>
        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Услуги студии:
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          <span className="badge" style={{ background: '#f1f5f9', color: '#475569', fontSize: '10px' }}>2D моушен</span>
          <span className="badge" style={{ background: '#f1f5f9', color: '#475569', fontSize: '10px' }}>3D моушен</span>
          <span className="badge" style={{ background: '#f1f5f9', color: '#475569', fontSize: '10px' }}>ИИ видео</span>
          <span className="badge" style={{ background: '#f1f5f9', color: '#475569', fontSize: '10px' }}>Мультипликация</span>
          <span className="badge" style={{ background: '#f1f5f9', color: '#475569', fontSize: '10px' }}>3D Web</span>
        </div>
      </div>
    </aside>
  );
}
