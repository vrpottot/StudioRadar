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
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Входящие лиды (сегодня)</span>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--primary-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={16} color="#7c3aed" />
          </div>
        </div>
        <div style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', marginTop: '8px' }}>
          {totalLeads}
        </div>
        <div style={{ fontSize: '11px', color: '#059669', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontWeight: 500 }}>
          <span>Норма 10–30 лидов/день</span>
        </div>
      </div>

      {/* Direct Phone Numbers */}
      <div className="card stat-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>С прямым телефоном ЛПР</span>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--accent-emerald-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <PhoneCall size={16} color="#059669" />
          </div>
        </div>
        <div style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', marginTop: '8px' }}>
          {withPhone} <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>({totalLeads ? Math.round((withPhone/totalLeads)*100) : 0}%)</span>
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
          Готовы к прямому созвону
        </div>
      </div>

      {/* Verified Direct (No Brokers) */}
      <div className="card stat-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Прямые клиенты (No Broker)</span>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--accent-cyan-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck size={16} color="#0284c7" />
          </div>
        </div>
        <div style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', marginTop: '8px' }}>
          100%
        </div>
        <div style={{ fontSize: '11px', color: '#0284c7', marginTop: '4px', fontWeight: 500 }}>
          Конечные компании-заказчики
        </div>
      </div>

      {/* Active Pipeline */}
      <div className="card stat-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>В обработке менеджером</span>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={16} color="#d97706" />
          </div>
        </div>
        <div style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', marginTop: '8px' }}>
          {inProgress}
        </div>
        <div style={{ fontSize: '11px', color: '#d97706', marginTop: '4px', fontWeight: 500 }}>
          Созвоны и подготовка КП
        </div>
      </div>
    </div>
  );
}
