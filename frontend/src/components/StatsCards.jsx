import React from 'react';
import { 
  PhoneCall, 
  ShieldCheck, 
  Sparkles,
  DollarSign,
  Clock
} from 'lucide-react';

export default function StatsCards({ leads }) {
  const totalLeads = leads.length;
  const withPhone = leads.filter(l => l.phone).length;
  const inProgress = leads.filter(l => l.status === 'in_progress' || l.status === 'called' || l.status === 'negotiation').length;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '20px' }}>
      {/* Total Leads Card */}
      <div className="card stat-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-headline)' }}>Входящие лиды (сегодня)</span>
          <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: '#e0e1f7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={16} color="var(--color-accent-purple)" />
          </div>
        </div>
        <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--color-text-black)', marginTop: '8px', letterSpacing: '-0.03em' }}>
          {totalLeads}
        </div>
        <div style={{ fontSize: '11px', color: 'var(--color-accent-purple)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontWeight: 600 }}>
          <span>Норма 10–30 лидов/день</span>
        </div>
      </div>

      {/* Direct Phone Numbers */}
      <div className="card stat-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-headline)' }}>С прямым телефоном ЛПР</span>
          <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: 'var(--accent-emerald-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <PhoneCall size={16} color="var(--color-accent-green-text)" />
          </div>
        </div>
        <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--color-text-black)', marginTop: '8px', letterSpacing: '-0.03em' }}>
          {withPhone} <span style={{ fontSize: '13px', color: 'var(--color-text-headline)', fontWeight: 500, fontFamily: 'var(--font-mono)' }}>({totalLeads ? Math.round((withPhone/totalLeads)*100) : 0}%)</span>
        </div>
        <div style={{ fontSize: '11px', color: 'var(--color-text-headline)', marginTop: '4px' }}>
          Готовы к прямому созвону
        </div>
      </div>

      {/* Verified Direct (No Brokers) */}
      <div className="card stat-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-headline)' }}>Прямые клиенты (No Broker)</span>
          <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: 'var(--color-surface-beige-3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck size={16} color="var(--color-accent-purple)" />
          </div>
        </div>
        <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--color-text-black)', marginTop: '8px', letterSpacing: '-0.03em' }}>
          100%
        </div>
        <div style={{ fontSize: '11px', color: 'var(--color-accent-purple)', marginTop: '4px', fontWeight: 600 }}>
          Конечные компании-заказчики
        </div>
      </div>

      {/* Active Pipeline */}
      <div className="card stat-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-headline)' }}>В обработке менеджером</span>
          <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: '#fdf0e6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={16} color="#7b3306" />
          </div>
        </div>
        <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--color-text-black)', marginTop: '8px', letterSpacing: '-0.03em' }}>
          {inProgress}
        </div>
        <div style={{ fontSize: '11px', color: '#7b3306', marginTop: '4px', fontWeight: 600 }}>
          Созвоны и подготовка КП
        </div>
      </div>
    </div>
  );
}
