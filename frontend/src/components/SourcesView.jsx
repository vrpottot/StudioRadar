import React from 'react';
import { 
  Search, 
  Sparkles, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Play, 
  RefreshCw, 
  ShieldCheck, 
  Globe,
  Building2,
  Tv
} from 'lucide-react';

export default function SourcesView({ 
  onAiHunt, 
  isAiHunting,
  onFullScan,
  isScanningAll
}) {
  const sourcesList = [
    { name: "Google Gemini Web Search", focus: "Прямой поиск открытых потребностей и ТЗ брендов в открытом вебе", status: "online" },
    { name: "Корпоративные порталы брендов", focus: "Прямые запросы коммерческих предложений на 3D, CGI и видео", status: "online" },
    { name: "Отраслевые медиа (Habr / VC / Sostav)", focus: "Кейсы студий, анонсы запусков брендов, ребрендинги и рекламные кампании", status: "online" },
    { name: "Деловые форумы и выставки (Expo)", focus: "Участники ПМЭФ, ИННОПРОМ, ЦИПР с потребностью в видеостенах и 3D", status: "online" },
    { name: "Партнерская B2B-сеть агентств", focus: "Запросы на субподряд по сложной 3D анимации и графике", status: "online" }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-text-black)', letterSpacing: '-0.02em' }}>
            Источники данных и мониторинг
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--color-text-headline)', marginTop: '2px' }}>
            Прямой поиск коммерческих B2B-заказчиков и брендов через открытый веб и отраслевые медиа
          </p>
        </div>
      </div>

      {/* Main Sources Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        {/* AI Autonomous Hunter Card */}
        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--accent-emerald-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles size={18} color="var(--color-accent-green-text)" />
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text-black)' }}>ИИ-Хантер (Google Gemini)</h3>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-headline)' }}>Прямой Web-поиск B2B-клиентов</div>
                </div>
              </div>

              <span className="badge badge-verified">
                <CheckCircle2 size={12} /> Активен
              </span>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--color-text-body)', lineHeight: 1.4 }}>
              Автономный поиск прямых коммерческих брендов, девелоперов, финтеха и производителей с открытыми запросами на 3D, CGI и промо-ролики.
            </p>

            <div style={{ marginTop: '12px', padding: '10px', background: 'var(--color-surface-beige-1)', borderRadius: '6px', fontSize: '11px', color: 'var(--color-text-headline)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div>• Поиск по 7 целевым коммерческим направлениям студии</div>
              <div>• Автоматическое определение контактов ЛПР и персонализированный оффер</div>
            </div>
          </div>

          <button
            onClick={onAiHunt}
            disabled={isAiHunting}
            className="btn btn-primary"
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px' }}
          >
            {isAiHunting ? (
              <>
                <RefreshCw size={14} className="spin" />
                <span>ИИ ищет прямых заказчиков...</span>
              </>
            ) : (
              <>
                <Sparkles size={14} />
                <span>Запустить поиск прямых клиентов</span>
              </>
            )}
          </button>
        </div>

        {/* Brand Portals Card */}
        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#e0e1f7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Building2 size={18} color="var(--color-accent-purple)" />
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text-black)' }}>Порталы брендов & B2B</h3>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-headline)' }}>Прямые коммерческие запросы</div>
                </div>
              </div>

              <span className="badge badge-verified">
                <CheckCircle2 size={12} /> Активен
              </span>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--color-text-body)', lineHeight: 1.4 }}>
              Мониторинг сайтов крупных брендов и холдингов, запрашивающих коммерческие предложения на графику и видеопроизводство.
            </p>

            <div style={{ marginTop: '12px', padding: '10px', background: 'var(--color-surface-beige-1)', borderRadius: '6px', fontSize: '11px', color: 'var(--color-text-headline)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div>• Проверка коммерческих бюджетов от 1 000 000 ₽</div>
              <div>• Прямой выход на бренд-директоров и отделы маркетинга</div>
            </div>
          </div>

          <button
            onClick={onAiHunt}
            disabled={isAiHunting}
            className="btn btn-outline"
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px' }}
          >
            {isAiHunting ? (
              <>
                <RefreshCw size={14} className="spin" />
                <span>Сканирование брендов...</span>
              </>
            ) : (
              <>
                <Play size={14} />
                <span>Собрать прямые запросы</span>
              </>
            )}
          </button>
        </div>

        {/* Media & Design Hubs Card */}
        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--color-surface-beige-3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Globe size={18} color="var(--color-accent-purple)" />
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text-black)' }}>Отраслевые медиа & Кейсы</h3>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-headline)' }}>VC, Sostav, Habr Design</div>
                </div>
              </div>

              <span className="badge badge-verified">
                <CheckCircle2 size={12} /> Активен
              </span>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--color-text-body)', lineHeight: 1.4 }}>
              Мониторинг отраслевых публикаций о запусках новых линеек продуктов, рекламных кампаний и ребрендингах.
            </p>

            <div style={{ marginTop: '12px', padding: '10px', background: 'var(--color-surface-beige-1)', borderRadius: '6px', fontSize: '11px', color: 'var(--color-text-headline)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div>• Отслеживание реального спроса на 3D анимацию и видео</div>
              <div>• Классификация по отраслям студии</div>
            </div>
          </div>

          <button
            onClick={onFullScan}
            disabled={isScanningAll}
            className="btn btn-outline"
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px' }}
          >
            {isScanningAll ? (
              <>
                <RefreshCw size={14} className="spin" />
                <span>Сквозной сбор...</span>
              </>
            ) : (
              <>
                <Play size={14} />
                <span>Сквозной сбор по всем источникам</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Detailed Sources List Table */}
      <div className="card" style={{ padding: '20px' }}>
        <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-black)', marginBottom: '12px' }}>
          Список подключенных источников мониторинга
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--color-text-headline)', fontSize: '11px', textTransform: 'uppercase' }}>
                <th style={{ padding: '10px' }}>Площадка / Источник</th>
                <th style={{ padding: '10px' }}>Фокус мониторинга</th>
                <th style={{ padding: '10px' }}>Статус</th>
              </tr>
            </thead>
            <tbody>
              {sourcesList.map((ch, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid var(--color-surface-beige-2)' }}>
                  <td style={{ padding: '10px', fontWeight: 600, color: 'var(--color-text-black)' }}>
                    {ch.name}
                  </td>
                  <td style={{ padding: '10px', color: 'var(--color-text-body)' }}>
                    {ch.focus}
                  </td>
                  <td style={{ padding: '10px' }}>
                    <span className="badge badge-verified" style={{ fontSize: '10px' }}>
                      Онлайн
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
