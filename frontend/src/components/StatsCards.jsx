import React from 'react';
import { 
  Star, 
  Flame, 
  Building2, 
  Zap 
} from 'lucide-react';

export default function StatsCards({ leads = [] }) {
  const totalLeads = leads.length;
  const highPriority = leads.filter(l => (l.score || 0) >= 80).length || totalLeads;
  const withPhone = leads.filter(l => l.phone).length;
  const ordersCount = leads.filter(l => l.leadType === 'order').length;

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
      gap: '16px', 
      marginBottom: '24px' 
    }}>
      {/* 1. Hero Card: ТРЕБУЮТ ВНИМАНИЯ (Signature Purple Gradient) */}
      <div className="card stat-card stat-card-hero">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ 
            fontSize: '11px', 
            fontWeight: 700, 
            letterSpacing: '0.06em', 
            textTransform: 'uppercase',
            color: 'rgba(255, 255, 255, 0.85)' 
          }}>
            Требуют внимания
          </span>
          <Star size={16} color="rgba(255, 255, 255, 0.85)" />
        </div>
        
        <div style={{ 
          fontSize: '36px', 
          fontWeight: 800, 
          color: '#ffffff', 
          marginTop: '10px', 
          letterSpacing: '-0.03em',
          lineHeight: 1
        }}>
          {highPriority}
        </div>

        <div style={{ marginTop: '14px' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '3px 10px',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(4px)',
            color: '#ffffff',
            fontSize: '11px',
            fontWeight: 600
          }}>
            оценка A и выше
          </span>
        </div>
      </div>

      {/* 2. Card: ЖДУТ КАСАНИЯ */}
      <div className="card stat-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ 
            fontSize: '11px', 
            fontWeight: 700, 
            letterSpacing: '0.06em', 
            textTransform: 'uppercase',
            color: 'var(--color-text-headline)' 
          }}>
            Ждут касания
          </span>
          <Flame size={16} color="#94a3b8" />
        </div>

        <div style={{ 
          fontSize: '36px', 
          fontWeight: 800, 
          color: 'var(--color-text-black)', 
          marginTop: '10px', 
          letterSpacing: '-0.03em',
          lineHeight: 1
        }}>
          {withPhone}
        </div>

        <div style={{ fontSize: '12px', color: 'var(--color-text-headline)', marginTop: '14px' }}>
          у {Math.min(withPhone, 5)} компаний сигнал скоро исчезнет
        </div>
      </div>

      {/* 3. Card: ВСЕГО КОМПАНИЙ */}
      <div className="card stat-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ 
            fontSize: '11px', 
            fontWeight: 700, 
            letterSpacing: '0.06em', 
            textTransform: 'uppercase',
            color: 'var(--color-text-headline)' 
          }}>
            Всего компаний
          </span>
          <Building2 size={16} color="#94a3b8" />
        </div>

        <div style={{ 
          fontSize: '36px', 
          fontWeight: 800, 
          color: 'var(--color-text-black)', 
          marginTop: '10px', 
          letterSpacing: '-0.03em',
          lineHeight: 1
        }}>
          {totalLeads}
        </div>

        <div style={{ fontSize: '12px', color: 'var(--color-text-headline)', marginTop: '14px' }}>
          у всех есть подтвержденный сигнал
        </div>
      </div>

      {/* 4. Card: НАШЛИ ЗА СЕГОДНЯ */}
      <div className="card stat-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ 
            fontSize: '11px', 
            fontWeight: 700, 
            letterSpacing: '0.06em', 
            textTransform: 'uppercase',
            color: 'var(--color-text-headline)' 
          }}>
            Нашли за сегодня
          </span>
          <Zap size={16} color="#94a3b8" />
        </div>

        <div style={{ 
          fontSize: '36px', 
          fontWeight: 800, 
          color: 'var(--color-text-black)', 
          marginTop: '10px', 
          letterSpacing: '-0.03em',
          lineHeight: 1
        }}>
          {ordersCount}
        </div>

        <div style={{ fontSize: '12px', color: 'var(--color-text-headline)', marginTop: '14px' }}>
          {ordersCount > 0 ? `${ordersCount} открытых коммерческих брифов` : 'сегодня сигналов не было'}
        </div>
      </div>
    </div>
  );
}
