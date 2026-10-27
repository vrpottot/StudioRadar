import React, { useState } from 'react';
import { 
  Layers, 
  Sparkles, 
  Play, 
  Pause, 
  Copy, 
  Trash2, 
  Clock, 
  Building2, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle,
  Plus,
  ArrowRight,
  Filter
} from 'lucide-react';

export default function PipelinesView({ 
  pipelines = [], 
  onTogglePipelineStatus, 
  onRunPipeline, 
  onDeletePipeline, 
  onDuplicatePipeline,
  onCreatePipeline 
}) {
  const [filter, setFilter] = useState('all'); // 'all' | 'active' | 'paused'

  const filteredPipelines = pipelines.filter(p => {
    if (filter === 'active') return p.status === 'active';
    if (filter === 'paused') return p.status === 'paused';
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-text-black)', letterSpacing: '-0.02em' }}>
            Пайплайны поиска
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--color-text-headline)', marginTop: '2px' }}>
            Настраиваемые автоматизированные стратегии мониторинга компаний по целевым сигналам спроса
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Status Filter */}
          <div style={{ display: 'flex', background: 'var(--color-surface-beige-3)', padding: '3px', borderRadius: '6px' }}>
            <button
              onClick={() => setFilter('all')}
              style={{
                border: 'none',
                padding: '5px 12px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                background: filter === 'all' ? '#ffffff' : 'transparent',
                color: filter === 'all' ? 'var(--color-accent-purple)' : 'var(--color-text-headline)',
                boxShadow: filter === 'all' ? 'var(--shadow-sm)' : 'none'
              }}
            >
              Все ({pipelines.length})
            </button>
            <button
              onClick={() => setFilter('active')}
              style={{
                border: 'none',
                padding: '5px 12px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                background: filter === 'active' ? '#ffffff' : 'transparent',
                color: filter === 'active' ? 'var(--color-accent-purple)' : 'var(--color-text-headline)',
                boxShadow: filter === 'active' ? 'var(--shadow-sm)' : 'none'
              }}
            >
              Активные ({pipelines.filter(p => p.status === 'active').length})
            </button>
            <button
              onClick={() => setFilter('paused')}
              style={{
                border: 'none',
                padding: '5px 12px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                background: filter === 'paused' ? '#ffffff' : 'transparent',
                color: filter === 'paused' ? 'var(--color-accent-purple)' : 'var(--color-text-headline)',
                boxShadow: filter === 'paused' ? 'var(--shadow-sm)' : 'none'
              }}
            >
              На паузе ({pipelines.filter(p => p.status === 'paused').length})
            </button>
          </div>

          <button 
            onClick={onCreatePipeline}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={16} />
            <span>Создать пайплайн</span>
          </button>
        </div>
      </div>

      {/* Pipeline Cards Grid (Раздел 13.4 ТЗ) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
        {filteredPipelines.map((pipe) => {
          const isActive = pipe.status === 'active';
          return (
            <div 
              key={pipe.id}
              className="card"
              style={{ 
                padding: '20px', 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'space-between',
                gap: '16px',
                border: isActive ? '1px solid var(--border-medium)' : '1px dashed var(--border-subtle)',
                background: isActive ? '#ffffff' : 'var(--color-surface-beige-1)',
                opacity: isActive ? 1 : 0.85
              }}
            >
              {/* Header: Title & Status */}
              <div>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span 
                      style={{ 
                        width: '8px', 
                        height: '8px', 
                        borderRadius: '50%', 
                        background: isActive ? 'var(--color-accent-green)' : 'var(--color-text-headline)' 
                      }} 
                      className={isActive ? 'pulse' : ''}
                    />
                    <span style={{ fontSize: '11px', fontWeight: 600, color: isActive ? 'var(--color-accent-green-text)' : 'var(--color-text-headline)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {isActive ? 'Мониторинг активен' : 'Приостановлен'}
                    </span>
                  </div>

                  <span 
                    style={{ 
                      fontSize: '11px', 
                      fontFamily: 'var(--font-mono)', 
                      padding: '2px 8px', 
                      borderRadius: '4px', 
                      background: 'var(--color-surface-beige-3)',
                      color: 'var(--color-text-black)',
                      fontWeight: 600
                    }}
                  >
                    Мин. скор: {pipe.priorityMinScore}%
                  </span>
                </div>

                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text-black)', lineHeight: 1.3 }}>
                  {pipe.name}
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--color-text-body)', marginTop: '6px', lineHeight: 1.4 }}>
                  {pipe.description}
                </p>
              </div>

              {/* Targets: Services & Spheres Tags */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {pipe.targetServices.map((srv, idx) => (
                    <span 
                      key={idx}
                      style={{
                        fontSize: '11px',
                        padding: '2px 7px',
                        borderRadius: '4px',
                        background: '#f3effb',
                        color: 'var(--color-accent-purple)',
                        fontWeight: 600
                      }}
                    >
                      {srv}
                    </span>
                  ))}
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {pipe.targetIndustries.map((ind, idx) => (
                    <span 
                      key={idx}
                      style={{
                        fontSize: '10px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: 'var(--color-surface-beige-3)',
                        color: 'var(--color-text-headline)'
                      }}
                    >
                      {ind}
                    </span>
                  ))}
                </div>
              </div>

              {/* Pipeline Metrics (Раздел 13.4 ТЗ) */}
              <div style={{ 
                padding: '12px', 
                background: 'var(--color-surface-beige-2)', 
                borderRadius: '6px', 
                display: 'grid', 
                gridTemplateColumns: 'repeat(3, 1fr)', 
                gap: '8px', 
                textAlign: 'center' 
              }}>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-text-black)', fontFamily: 'var(--font-mono)' }}>
                    {pipe.trackedCompanies}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-headline)' }}>
                    Компаний
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-accent-purple)', fontFamily: 'var(--font-mono)' }}>
                    +{pipe.newSignalsToday}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-headline)' }}>
                    Сигналов / сут.
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-accent-green-text)', fontFamily: 'var(--font-mono)' }}>
                    {pipe.highPriorityLeads}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-headline)' }}>
                    Лидов (A/A+)
                  </div>
                </div>
              </div>

              {/* Bottom Actions Bar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '11px', color: 'var(--color-text-headline)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={12} /> {pipe.lastRunAt || 'Сегодня'}
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {/* Pause / Resume */}
                  <button
                    onClick={() => onTogglePipelineStatus(pipe.id)}
                    className="btn btn-outline"
                    style={{ padding: '6px 10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                    title={isActive ? 'Приостановить пайплайн' : 'Возобновить мониторинг'}
                  >
                    {isActive ? <Pause size={13} /> : <Play size={13} color="var(--color-accent-green-text)" />}
                    <span>{isActive ? 'Пауза' : 'Пуск'}</span>
                  </button>

                  {/* Run Now */}
                  <button
                    onClick={() => onRunPipeline(pipe.id)}
                    className="btn btn-primary"
                    style={{ padding: '6px 10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                    title="Запустить немедленный сбор по этому пайплайну"
                  >
                    <Play size={13} />
                    <span>Сканировать</span>
                  </button>

                  {/* Duplicate */}
                  <button
                    onClick={() => onDuplicatePipeline(pipe.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--color-text-headline)', padding: '6px', cursor: 'pointer', borderRadius: '4px' }}
                    title="Дублировать пайплайн"
                  >
                    <Copy size={15} />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => onDeletePipeline(pipe.id)}
                    style={{ background: 'none', border: 'none', color: '#9f1239', padding: '6px', cursor: 'pointer', borderRadius: '4px' }}
                    title="Удалить стратегию"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
