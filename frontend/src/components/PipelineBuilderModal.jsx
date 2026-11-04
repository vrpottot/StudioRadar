import React, { useState } from 'react';
import { 
  X, 
  Check, 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  Layers, 
  Database, 
  Sliders, 
  CheckCircle2, 
  Upload, 
  AlertTriangle,
  Info
} from 'lucide-react';
import { TARGET_INDUSTRIES, TARGET_SERVICES } from '../data/leadsData';
import { SIGNALS_CATALOG } from '../data/signalsData';

export default function PipelineBuilderModal({ isOpen, onClose, onSavePipeline }) {
  const [currentStep, setCurrentStep] = useState(1);

  // Шаг 1: Основные настройки
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedServices, setSelectedServices] = useState([
    "3D моушен-дизайн и анимация",
    "2D моушен-дизайн и анимация"
  ]);
  const [region, setRegion] = useState('Россия / СНГ (Удаленно)');

  // Шаг 2: Источник компаний
  const [sourceType, setSourceType] = useState('auto'); // 'auto' | 'upload'
  const [selectedIndustries, setSelectedIndustries] = useState([
    "Рекламные агентства и продакшн",
    "Продукты питания и напитки"
  ]);
  const [uploadedFileName, setUploadedFileName] = useState(null);

  // Шаг 3: Сигналы
  const [selectedSignals, setSelectedSignals] = useState([
    "sig_direct_tender",
    "sig_direct_order"
  ]);

  // Шаг 4: Приоритеты и скоринг
  const [minScore, setMinScore] = useState(70);
  const [excludeResumes, setExcludeResumes] = useState(true);
  const [excludeCheap, setExcludeCheap] = useState(true);
  const [excludeCourses, setExcludeCourses] = useState(true);

  if (!isOpen) return null;

  const toggleService = (srv) => {
    if (selectedServices.includes(srv)) {
      if (selectedServices.length > 1) {
        setSelectedServices(selectedServices.filter(s => s !== srv));
      }
    } else {
      setSelectedServices([...selectedServices, srv]);
    }
  };

  const toggleIndustry = (ind) => {
    if (selectedIndustries.includes(ind)) {
      if (selectedIndustries.length > 1) {
        setSelectedIndustries(selectedIndustries.filter(i => i !== ind));
      }
    } else {
      setSelectedIndustries([...selectedIndustries, ind]);
    }
  };

  const toggleSignal = (sigId) => {
    if (selectedSignals.includes(sigId)) {
      if (selectedSignals.length > 1) {
        setSelectedSignals(selectedSignals.filter(id => id !== sigId));
      }
    } else {
      setSelectedSignals([...selectedSignals, sigId]);
    }
  };

  const handleFinish = () => {
    const newPipeline = {
      id: `pipe_${Date.now()}`,
      name: name.trim() || 'Новый поисковый пайплайн',
      description: description.trim() || 'Автоматизированный мониторинг целевых B2B-заказов',
      status: 'active',
      targetServices: selectedServices,
      targetIndustries: selectedIndustries,
      selectedSignals: selectedSignals,
      sources: ["��� �������", "Web Search", "Habr Design"],
      priorityMinScore: minScore,
      minGrade: minScore >= 80 ? "A" : "B",
      trackedCompanies: Math.floor(Math.random() * 25) + 15,
      newSignalsToday: Math.floor(Math.random() * 6) + 2,
      highPriorityLeads: Math.floor(Math.random() * 4) + 1,
      lastRunAt: "Только что создан"
    };

    onSavePipeline(newPipeline);
    onClose();
  };

  const steps = [
    { num: 1, title: 'Аудитория', icon: Layers },
    { num: 2, title: 'Источники', icon: Database },
    { num: 3, title: 'Сигналы', icon: Sparkles },
    { num: 4, title: 'Приоритеты', icon: Sliders },
    { num: 5, title: 'Запуск', icon: CheckCircle2 }
  ];

  return (
    <div className="drawer-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
      <div 
        className="card slide-in-bottom" 
        style={{ 
          width: '100%', 
          maxWidth: '720px', 
          maxHeight: '90vh', 
          display: 'flex', 
          flexDirection: 'column', 
          boxShadow: 'var(--shadow-drawer)',
          borderRadius: '12px',
          overflow: 'hidden',
          background: '#ffffff'
        }}
      >
        {/* Modal Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--color-surface-white)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge badge-score" style={{ background: '#e0e1f7', color: 'var(--color-accent-purple)', border: 'none' }}>
                Конструктор поиска (Gradly Wizard)
              </span>
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-black)', marginTop: '4px' }}>
              Создание поискового пайплайна
            </h2>
          </div>

          <button 
            onClick={onClose}
            style={{ background: 'var(--color-surface-beige-3)', border: 'none', width: '32px', height: '32px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={18} color="var(--color-text-headline)" />
          </button>
        </div>

        {/* Step Indicator Bar (Раздел 13.5 ТЗ) */}
        <div style={{ padding: '12px 24px', background: 'var(--color-surface-beige-1)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between' }}>
          {steps.map((s) => {
            const isCompleted = currentStep > s.num;
            const isCurrent = currentStep === s.num;
            return (
              <div 
                key={s.num} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  opacity: isCurrent || isCompleted ? 1 : 0.45 
                }}
              >
                <div 
                  style={{ 
                    width: '24px', 
                    height: '24px', 
                    borderRadius: '50%', 
                    background: isCurrent ? 'var(--color-accent-purple)' : isCompleted ? 'var(--color-accent-green)' : 'var(--color-surface-beige-3)',
                    color: isCurrent ? '#ffffff' : isCompleted ? 'var(--color-accent-green-text)' : 'var(--color-text-headline)',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)'
                  }}
                >
                  {isCompleted ? <Check size={13} /> : s.num}
                </div>
                <span style={{ fontSize: '12px', fontWeight: isCurrent ? 700 : 500, color: isCurrent ? 'var(--color-accent-purple)' : 'var(--color-text-body)' }}>
                  {s.title}
                </span>
              </div>
            );
          })}
        </div>

        {/* Modal Body: Steps content */}
        <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
          {/* STEP 1: Основные настройки */}
          {currentStep === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-black)', display: 'block', marginBottom: '6px' }}>
                  Название пайплайна *
                </label>
                <input 
                  type="text" 
                  placeholder="Например: Поиск клиентов для 2D/3D Motion Design"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-control"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-black)', display: 'block', marginBottom: '6px' }}>
                  Краткое описание гипотезы
                </label>
                <textarea 
                  rows={2}
                  placeholder="Опишите цель стратегии (какие компании и под какие задачи ищем)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input-control"
                  style={{ width: '100%', resize: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-black)', display: 'block', marginBottom: '6px' }}>
                  Целевые услуги студии (из ТЗ) *
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {TARGET_SERVICES.filter(s => s !== "Все услуги").map((srv) => {
                    const isSelected = selectedServices.includes(srv);
                    return (
                      <button
                        key={srv}
                        type="button"
                        onClick={() => toggleService(srv)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          border: `1px solid ${isSelected ? 'var(--color-accent-purple)' : 'var(--border-subtle)'}`,
                          background: isSelected ? '#f3effb' : '#ffffff',
                          color: isSelected ? 'var(--color-accent-purple)' : 'var(--color-text-body)',
                          fontSize: '12px',
                          fontWeight: isSelected ? 600 : 400,
                          cursor: 'pointer'
                        }}
                      >
                        {isSelected && '✓ '} {srv}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-black)', display: 'block', marginBottom: '6px' }}>
                  Регион поиска
                </label>
                <input 
                  type="text" 
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="input-control"
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          )}

          {/* STEP 2: Источник компаний */}
          {currentStep === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div 
                  onClick={() => setSourceType('auto')}
                  style={{
                    padding: '16px',
                    borderRadius: '8px',
                    border: `2px solid ${sourceType === 'auto' ? 'var(--color-accent-purple)' : 'var(--border-subtle)'}`,
                    background: sourceType === 'auto' ? 'var(--color-surface-beige-1)' : '#ffffff',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-black)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sparkles size={16} color="var(--color-accent-purple)" /> Способ А: Автопоиск
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--color-text-headline)', marginTop: '4px' }}>
                    Поиск по 7 целевым отраслям в тендерах, медиа и интернете
                  </p>
                </div>

                <div 
                  onClick={() => setSourceType('upload')}
                  style={{
                    padding: '16px',
                    borderRadius: '8px',
                    border: `2px solid ${sourceType === 'upload' ? 'var(--color-accent-purple)' : 'var(--border-subtle)'}`,
                    background: sourceType === 'upload' ? 'var(--color-surface-beige-1)' : '#ffffff',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-black)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Upload size={16} color="var(--color-accent-purple)" /> Способ Б: Своя база
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--color-text-headline)', marginTop: '4px' }}>
                    Загрузка CSV / Excel со списком ИНН или сайтов компаний
                  </p>
                </div>
              </div>

              {sourceType === 'auto' ? (
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-black)', display: 'block', marginBottom: '8px' }}>
                    Выберите целевые сферы (из таблицы заказчика):
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px' }}>
                    {TARGET_INDUSTRIES.filter(i => i !== "Все сферы").map((ind) => {
                      const isSelected = selectedIndustries.includes(ind);
                      return (
                        <div
                          key={ind}
                          onClick={() => toggleIndustry(ind)}
                          style={{
                            padding: '8px 12px',
                            borderRadius: '6px',
                            border: `1px solid ${isSelected ? 'var(--color-accent-purple)' : 'var(--border-subtle)'}`,
                            background: isSelected ? '#f3effb' : '#ffffff',
                            color: isSelected ? 'var(--color-accent-purple)' : 'var(--color-text-black)',
                            fontSize: '12px',
                            fontWeight: isSelected ? 600 : 400,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                          }}
                        >
                          <span>{ind}</span>
                          {isSelected && <Check size={14} />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div style={{ padding: '30px', border: '2px dashed var(--border-medium)', borderRadius: '8px', textAlign: 'center' }}>
                  <Upload size={28} color="var(--color-accent-purple)" style={{ margin: '0 auto 10px auto' }} />
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-black)' }}>
                    Перетащите CSV файл с компаниями сюда
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-headline)', marginTop: '4px' }}>
                    Поддерживаемые поля: Название, Сайт, ИНН, Отрасль, Контакты
                  </div>
                  <button 
                    type="button"
                    onClick={() => setUploadedFileName('client_companies_2026.csv')}
                    className="btn btn-outline"
                    style={{ marginTop: '12px', fontSize: '12px' }}
                  >
                    {uploadedFileName ? `Файл загружен: ${uploadedFileName}` : 'Выбрать файл'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Выбор сигналов */}
          {currentStep === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--color-text-headline)', background: 'var(--color-surface-beige-2)', padding: '8px 12px', borderRadius: '6px' }}>
                <Info size={15} color="var(--color-accent-purple)" />
                <span>Рекомендация по ТЗ: для точной гипотезы выбирайте от 2 до 4 основных сигналов на один пайплайн.</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {SIGNALS_CATALOG.map((sig) => {
                  const isSelected = selectedSignals.includes(sig.id);
                  return (
                    <div 
                      key={sig.id}
                      onClick={() => toggleSignal(sig.id)}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '6px',
                        border: `1px solid ${isSelected ? 'var(--color-accent-purple)' : 'var(--border-subtle)'}`,
                        background: isSelected ? 'var(--color-surface-beige-1)' : '#ffffff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        gap: '12px'
                      }}
                    >
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <div style={{ width: '18px', height: '18px', borderRadius: '4px', border: `1px solid ${isSelected ? 'var(--color-accent-purple)' : 'var(--border-medium)'}`, background: isSelected ? 'var(--color-accent-purple)' : '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '2px' }}>
                          {isSelected && <Check size={12} color="#ffffff" />}
                        </div>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-black)' }}>
                            {sig.title}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--color-text-headline)', marginTop: '2px' }}>
                            {sig.description}
                          </div>
                          <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                            <span style={{ fontSize: '10px', background: 'var(--color-surface-beige-3)', padding: '2px 6px', borderRadius: '4px', color: 'var(--color-text-headline)' }}>
                              {sig.category}
                            </span>
                            <span style={{ fontSize: '10px', background: '#f3effb', padding: '2px 6px', borderRadius: '4px', color: 'var(--color-accent-purple)', fontWeight: 600 }}>
                              Срок: {sig.validityDays} дн.
                            </span>
                          </div>
                        </div>
                      </div>

                      <span style={{ fontSize: '11px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-accent-purple)' }}>
                        +{sig.weight}б
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 4: Настройка приоритетов */}
          {currentStep === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-black)' }}>
                    Минимальный порог квалификации лида
                  </label>
                  <span style={{ fontSize: '14px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-accent-purple)' }}>
                    {minScore}% (Грейд {minScore >= 80 ? 'A' : 'B'})
                  </span>
                </div>
                <input 
                  type="range" 
                  min="40" 
                  max="95" 
                  step="5"
                  value={minScore} 
                  onChange={(e) => setMinScore(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--color-accent-purple)', cursor: 'pointer' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-text-headline)', marginTop: '4px' }}>
                  <span>40% (Мягкий отбор)</span>
                  <span>70% (Рекомендуемый)</span>
                  <span>90% (Строгий отбор)</span>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-black)', display: 'block', marginBottom: '8px' }}>
                  Автоматические исключения (по правилам ТЗ):
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={excludeResumes} 
                      onChange={(e) => setExcludeResumes(e.target.checked)}
                      style={{ accentColor: 'var(--color-accent-purple)' }} 
                    />
                    <span>Исключать соискателей и резюме фрилансеров (не заказчики)</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={excludeCheap} 
                      onChange={(e) => setExcludeCheap(e.target.checked)}
                      style={{ accentColor: 'var(--color-accent-purple)' }} 
                    />
                    <span>Исключать копеечный монтаж, Shorts и Reels</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={excludeCourses} 
                      onChange={(e) => setExcludeCourses(e.target.checked)}
                      style={{ accentColor: 'var(--color-accent-purple)' }} 
                    />
                    <span>Исключать заявки на обучение, курсы и инфобизнес</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Проверка и запуск */}
          {currentStep === 5 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ padding: '16px', background: 'var(--accent-emerald-subtle)', border: '1px solid var(--color-accent-green)', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-accent-green-text)', fontWeight: 700, fontSize: '14px' }}>
                  <CheckCircle2 size={18} /> Пайплайн готов к немедленной активации
                </div>
                <p style={{ fontSize: '12px', color: 'var(--color-accent-green-text)', marginTop: '4px' }}>
                  Система начнет сбор информации по подключенным тендерам и открытому вебу в фоновом режиме.
                </p>
              </div>

              {/* Summary table */}
              <div style={{ background: 'var(--color-surface-beige-1)', borderRadius: '8px', border: '1px solid var(--border-subtle)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-headline)' }}>Название:</span>
                  <strong style={{ color: 'var(--color-text-black)' }}>{name || 'Новый пайплайн'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-headline)' }}>Целевые услуги:</span>
                  <span style={{ color: 'var(--color-text-black)', textAlign: 'right' }}>{selectedServices.join(', ')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-headline)' }}>Целевые сферы:</span>
                  <span style={{ color: 'var(--color-text-black)', textAlign: 'right' }}>{selectedIndustries.slice(0, 3).join(', ')}{selectedIndustries.length > 3 ? '...' : ''}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-headline)' }}>Активные сигналы:</span>
                  <span style={{ color: 'var(--color-accent-purple)', fontWeight: 600 }}>{selectedSignals.length} сигнала спроса</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-headline)' }}>Порог отбора:</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>≥ {minScore}%</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer: Navigation Buttons */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-subtle)', background: 'var(--color-surface-white)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {currentStep > 1 ? (
            <button
              onClick={() => setCurrentStep(currentStep - 1)}
              className="btn btn-outline"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <ArrowLeft size={15} />
              <span>Назад</span>
            </button>
          ) : <div />}

          {currentStep < 5 ? (
            <button
              onClick={() => setCurrentStep(currentStep + 1)}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <span>Далее</span>
              <ArrowRight size={15} />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--color-accent-purple)' }}
            >
              <Sparkles size={16} />
              <span>Запустить мониторинг</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

