import React, { useState } from 'react';
import { 
  Sparkles, 
  Search, 
  Filter, 
  Plus, 
  CheckCircle2, 
  Layers, 
  Clock, 
  Building2, 
  HelpCircle,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { SIGNALS_CATALOG, SIGNAL_CATEGORIES } from '../data/signalsData';

export default function SignalsView({ onAddSignalToPipeline, onCreatePipeline }) {
  const [selectedCategory, setSelectedCategory] = useState("Все категории");
  const [searchQuery, setSearchQuery] = useState("");
  const [addedSignals, setAddedSignals] = useState({});

  const filteredSignals = SIGNALS_CATALOG.filter(sig => {
    const matchesCategory = selectedCategory === "Все категории" || sig.category === selectedCategory;
    const matchesQuery = !searchQuery || 
      sig.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sig.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sig.indicators.some(i => i.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesQuery;
  });

  const handleAdd = (id) => {
    setAddedSignals(prev => ({ ...prev, [id]: true }));
    if (onAddSignalToPipeline) onAddSignalToPipeline(id);
    setTimeout(() => {
      setAddedSignals(prev => ({ ...prev, [id]: false }));
    }, 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-text-black)', letterSpacing: '-0.02em' }}>
            Каталог сигналов спроса
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--color-text-headline)', marginTop: '2px' }}>
            Классификатор событий в компаниях, указывающих на потребность в услугах 3D/2D моушн-дизайна
          </p>
        </div>

        <button 
          onClick={onCreatePipeline}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Sparkles size={16} />
          <span>Собрать пайплайн</span>
        </button>
      </div>

      {/* Search & Categories Bar (Раздел 13.6 ТЗ) */}
      <div className="card" style={{ padding: '16px 20px', display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={16} color="var(--color-text-headline)" style={{ position: 'absolute', left: '12px', top: '10px' }} />
          <input 
            type="text" 
            placeholder="Поиск по названию сигнала, описанию или маркерам спроса..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-control"
            style={{ width: '100%', paddingLeft: '36px' }}
          />
        </div>

        {/* Categories selector */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {SIGNAL_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: isSelected ? 600 : 500,
                  cursor: 'pointer',
                  background: isSelected ? 'var(--color-accent-purple)' : 'var(--color-surface-beige-3)',
                  color: isSelected ? '#ffffff' : 'var(--color-text-black)',
                  transition: 'all 0.15s ease'
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Signals Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
        {filteredSignals.map((sig) => {
          const isAdded = addedSignals[sig.id];
          return (
            <div 
              key={sig.id}
              className="card"
              style={{
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '14px'
              }}
            >
              {/* Header */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-headline)', background: 'var(--color-surface-beige-3)', padding: '2px 8px', borderRadius: '4px' }}>
                    {sig.category}
                  </span>

                  <span style={{ fontSize: '11px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-accent-purple)', background: '#f3effb', padding: '2px 8px', borderRadius: '4px' }}>
                    +{sig.weight} баллов
                  </span>
                </div>

                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text-black)', lineHeight: 1.3 }}>
                  {sig.title}
                </h3>

                <p style={{ fontSize: '12px', color: 'var(--color-text-body)', marginTop: '8px', lineHeight: 1.45 }}>
                  {sig.description}
                </p>
              </div>

              {/* Real World Example (из ТЗ) */}
              <div style={{ padding: '10px 12px', background: 'var(--color-surface-beige-1)', borderRadius: '6px', borderLeft: '3px solid var(--color-accent-lavender)' }}>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 700, color: 'var(--color-accent-purple)', letterSpacing: '0.04em' }}>
                  Пример подтверждающего события:
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-black)', marginTop: '4px', fontStyle: 'italic' }}>
                  «{sig.example}»
                </div>
              </div>

              {/* Matched Services & Sources */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-headline)', marginBottom: '4px' }}>
                    Подходящие услуги студии:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {sig.relevantServices.map((srv, idx) => (
                      <span key={idx} style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', background: '#f3effb', color: 'var(--color-accent-purple)', fontWeight: 500 }}>
                        {srv}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--color-text-headline)', paddingTop: '6px', borderTop: '1px solid var(--border-subtle)' }}>
                  <span>Срок актуальности: <strong style={{ color: 'var(--color-text-black)' }}>{sig.validityDays} дн.</strong></span>
                  <span>Источники: {sig.sources.join(', ')}</span>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => handleAdd(sig.id)}
                className={isAdded ? "btn btn-outline" : "btn btn-outline"}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  background: isAdded ? 'var(--accent-emerald-subtle)' : '#ffffff',
                  color: isAdded ? 'var(--color-accent-green-text)' : 'var(--color-text-black)',
                  borderColor: isAdded ? 'var(--color-accent-green)' : 'var(--border-subtle)',
                  fontSize: '12px',
                  padding: '8px'
                }}
              >
                {isAdded ? (
                  <>
                    <CheckCircle2 size={14} color="var(--color-accent-green-text)" />
                    <span>Добавлено в активные стратегии</span>
                  </>
                ) : (
                  <>
                    <Plus size={14} />
                    <span>Использовать сигнал в поиске</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
