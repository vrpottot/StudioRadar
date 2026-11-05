import React from 'react';
import { 
  Star, 
  Zap, 
  UserCheck, 
  TrendingUp, 
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles
} from 'lucide-react';

export default function StatsCards({ leads = [] }) {
  const totalLeads = leads.length;
  const highPriority = leads.filter(l => (l.score || 0) >= 80).length || totalLeads;
  const withPhone = leads.filter(l => l.phone).length;
  const ordersCount = leads.filter(l => l.leadType === 'order').length;

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', 
      gap: '16px', 
      marginBottom: '24px' 
    }}>
      {/* 1. Hero Card: High Priority Leads (Dark Slate & Electric Indigo Glow) */}
      <div 
        className="card stat-card" 
        style={{ 
          background: 'linear-gradient(145deg, #0f172a 0%, #1e1b4b 100%)', 
          border: '1px solid #312e81',
          color: '#ffffff',
          boxShadow: '0 4px 20px rgba(15, 23, 42, 0.12)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ 
            fontSize: '11px', 
            fontWeight: 700, 
            letterSpacing: '0.06em', 
            textTransform: 'uppercase',
            color: '#a5b4fc',
            fontFamily: 'var(--font-heading)'
          }}>
            Приоритетные лиды
          </span>
          <div style={{
            width: '26px',
            height: '26px',
            borderRadius: '6px',
            background: 'rgba(99, 102, 241, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Star size={14} color="#818cf8" />
          </div>
        </div>
        
        <div style={{ 
          fontSize: '34px', 
          fontWeight: 800, 
          color: '#ffffff', 
          marginTop: '12px', 
          letterSpacing: '-0.03em',
          lineHeight: 1,
          fontFamily: 'var(--font-heading)'
        }}>
          {highPriority}
        </div>

        <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '2px 8px',
            borderRadius: '4px',
            background: 'rgba(99, 102, 241, 0.2)',
            border: '1px solid rgba(129, 140, 248, 0.3)',
            color: '#c7d2fe',
            fontSize: '11px',
            fontWeight: 600,
            fontFamily: 'var(--font-mono)'
          }}>
            Грейд A / A+
          </span>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>
            Чек от 1.5M ₽
          </span>
        </div>
      </div>

      {/* 2. Card: Open Commercial Briefs & RFPs */}
      <div className="card stat-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ 
            fontSize: '11px', 
            fontWeight: 700, 
            letterSpacing: '0.06em', 
            textTransform: 'uppercase',
            color: '#475467' 
          }}>
            Открытые брифы
          </span>
          <div style={{
            width: '26px',
            height: '26px',
            borderRadius: '6px',
            background: '#ecfdf5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Zap size={14} color="#059669" />
          </div>
        </div>

        <div style={{ 
          fontSize: '34px', 
          fontWeight: 800, 
          color: '#0f172a', 
          marginTop: '12px', 
          letterSpacing: '-0.03em',
          lineHeight: 1,
          fontFamily: 'var(--font-heading)'
        }}>
          {ordersCount}
        </div>

        <div style={{ fontSize: '12px', color: '#059669', marginTop: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
          <CheckCircle2 size={13} color="#059669" />
          <span>Прямой приём КП и портфолио</span>
        </div>
      </div>

      {/* 3. Card: Verified LPR Contacts */}
      <div className="card stat-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ 
            fontSize: '11px', 
            fontWeight: 700, 
            letterSpacing: '0.06em', 
            textTransform: 'uppercase',
            color: '#475467' 
          }}>
            Прямые контакты ЛПР
          </span>
          <div style={{
            width: '26px',
            height: '26px',
            borderRadius: '6px',
            background: '#eef2ff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <UserCheck size={14} color="#4f46e5" />
          </div>
        </div>

        <div style={{ 
          fontSize: '34px', 
          fontWeight: 800, 
          color: '#0f172a', 
          marginTop: '12px', 
          letterSpacing: '-0.03em',
          lineHeight: 1,
          fontFamily: 'var(--font-heading)'
        }}>
          {withPhone}
        </div>

        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '14px' }}>
          Маркетинг-директоры и продюсеры
        </div>
      </div>

      {/* 4. Card: Total Pipeline Volume */}
      <div className="card stat-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ 
            fontSize: '11px', 
            fontWeight: 700, 
            letterSpacing: '0.06em', 
            textTransform: 'uppercase',
            color: '#475467' 
          }}>
            Объем рынка в радаре
          </span>
          <div style={{
            width: '26px',
            height: '26px',
            borderRadius: '6px',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <TrendingUp size={14} color="#0f172a" />
          </div>
        </div>

        <div style={{ 
          fontSize: '28px', 
          fontWeight: 800, 
          color: '#0f172a', 
          marginTop: '12px', 
          letterSpacing: '-0.02em',
          lineHeight: 1,
          fontFamily: 'var(--font-mono)'
        }}>
          48.5 млн ₽
        </div>

        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '14px' }}>
          По {totalLeads} активным компаниям
        </div>
      </div>
    </div>
  );
}
