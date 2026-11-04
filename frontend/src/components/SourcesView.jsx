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
  FileText, 
  Globe 
} from 'lucide-react';

export default function SourcesView({ 
  onAiHunt, 
  isAiHunting,
  onFullScan,
  isScanningAll
}) {
  const tenderCategories = [
    { name: "ЕИС Госзакупки (44-ФЗ)", focus: "Тендеры на видеопроизводство, презентационные ролики и анимацию", status: "online" },
    { name: "ЕИС Закупки (223-ФЗ)", focus: "Коммерческие конкурсы госкорпораций на 3D графику и визуализацию", status: "online" },
    { name: "Habr Design Hub", focus: "Кейсы студий, анонсы запусков брендов и редизайнов", status: "online" },
    { name: "Открытый веб (Web Search)", focus: "Прямые запросы коммерческих КП и открытые конкурсы", status: "online" },
    { name: "Отраслевые выставки (Expo)", focus: "Анонсы участников форумов ПМЭФ, ИННОПРОМ, Армия", status: "online" }
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
            Управление подключаемыми модулями сбора информации по закупкам, тендерам и открытому вебу
          </p>
        </div>
      </div>

      {/* Main Sources Cards Grid (Раздел 5 ТЗ) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        {/* Tender EIS Card */}
        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#e0e1f7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={18} color="var(--color-accent-purple)" />
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text-black)' }}>ЕИС Закупки (Тендеры)</h3>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-headline)' }}>44-ФЗ и 223-ФЗ конкурсы</div>
                </div>
              </div>

              <span className="badge badge-verified">
                <CheckCircle2 size={12} /> Активен
              </span>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--color-text-body)', lineHeight: 1.4 }}>
              Прямой мониторинг официальных закупок и запросов КП на видеопроизводство, 3D анимацию и презентационные фильмы.
            </p>

            <div style={{ marginTop: '12px', padding: '10px', background: 'var(--color-surface-beige-1)', borderRadius: '6px', fontSize: '11px', color: 'var(--color-text-headline)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div>• Проверка закупок по 7 ключевым поисковым матрицам</div>
              <div>• Автоматическое извлечение прямых контактов ответственных ЛПР</div>
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
                <span>Идет поиск по тендерам...</span>
              </>
            ) : (
              <>
                <Play size={14} />
                <span>Собрать тендеры ЕИС</span>
              </>
            )}
          </button>
        </div>

        {/* AI Autonomous Hunter Card */}
        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--accent-emerald-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles size={18} color="var(--color-accent-green-text)" />
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text-black)' }}>ИИ-Хантер (Web Search)</h3>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-headline)' }}>DuckDuckGo + DeepSeek / Gemini</div>
                </div>
              </div>

              <span className="badge badge-verified">
                <CheckCircle2 size={12} /> Автономный
              </span>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--color-text-body)', lineHeight: 1.4 }}>
              Автономный поиск прямых коммерческих тендеров, конкурсов и запросов КП на создание 3D видео в российском сегменте интернета.
            </p>

            <div style={{ marginTop: '12px', padding: '10px', background: 'var(--color-surface-beige-1)', borderRadius: '6px', fontSize: '11px', color: 'var(--color-text-headline)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div>• Поиск конкурсов на видеоролики и промо-графику</div>
              <div>• Автоматическое определение прямых телефонов с сайтов компаний</div>
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
                <span>ИИ ищет тендеры в сети...</span>
              </>
            ) : (
              <>
                <Sparkles size={14} />
                <span>Запустить ИИ-Поиск тендеров</span>
              </>
            )}
          </button>
        </div>

        {/* Habr Design Card */}
        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--color-surface-beige-3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Globe size={18} color="var(--color-accent-purple)" />
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text-black)' }}>Habr Design & Медиа</h3>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-headline)' }}>Кейсы и анонсы брендов</div>
                </div>
              </div>

              <span className="badge badge-verified">
                <CheckCircle2 size={12} /> Активен
              </span>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--color-text-body)', lineHeight: 1.4 }}>
              Мониторинг отраслевых публикаций о запуске новых продуктов, ребрендингах и технологических инициативах.
            </p>

            <div style={{ marginTop: '12px', padding: '10px', background: 'var(--color-surface-beige-1)', borderRadius: '6px', fontSize: '11px', color: 'var(--color-text-headline)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div>• Отслеживание прямых потребностей в визуализациях</div>
              <div>• Проверка соответствия 7 целевым отраслям студии</div>
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
                <span>Сканирование медиа...</span>
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
              {tenderCategories.map((ch, idx) => (
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
