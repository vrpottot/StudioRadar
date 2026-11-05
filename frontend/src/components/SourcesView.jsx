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
  Tv,
  Send,
  Briefcase,
  Layers,
  FileCode
} from 'lucide-react';

export default function SourcesView({ 
  onAiHunt, 
  isAiHunting,
  onFullScan,
  isScanningAll
}) {
  const sourcesList = [
    { name: "Корпоративные порталы брендов (МТС, Ozon, VK, ПИК, Самолёт)", focus: "Прямые коммерческие закупки и открытые запросы предложений на 3D и видео", status: "online" },
    { name: "Telegram-каналы продюсеров и агентств (CG Freelance, Norm Rabota, Finder.vc)", focus: "Срочный агентский субподряд, проектные задачи на 3D/моушн с прямыми контактами", status: "online" },
    { name: "HeadHunter (hh.ru — проектные контракты)", focus: "Проектная работа и аутсорс компьютерной графики для студий и команд", status: "online" },
    { name: "Хабр Заказы (freelance.habr.com) & Workspace.ru", focus: "B2B заказы на 3D-графику, WebGL, мокапы и видеопродакшн под ключ", status: "online" },
    { name: "Отраслевые медиа (Sostav, AdIndex, VC)", focus: "Анонсы рекламных кампаний брендов, запуски продуктов и ребрендинги для прямого выхода на ЛПР", status: "online" },
    { name: "Коммерческая секция B2B-Center", focus: "Тендеры девелоперов и корпораций на презентационные фильмы и 3D туры", status: "online" }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-text-black)', letterSpacing: '-0.02em' }}>
            Источники данных и каналы поиска
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--color-text-headline)', marginTop: '2px' }}>
            Многоканальный интернет-радар: корпоративные порталы, Telegram-сообщества продюсеров, проектные контракты и открытые брифы
          </p>
        </div>
      </div>

      {/* 4 Main Multichannel Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        
        {/* Channel 1: Corporate Portals */}
        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#e0e1f7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Building2 size={18} color="var(--color-accent-purple)" />
                </div>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-black)' }}>Порталы брендов</h3>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-headline)' }}>МТС, Ozon, VK, ПИК, Самолёт</div>
                </div>
              </div>
              <span className="badge badge-verified">
                <CheckCircle2 size={12} /> Активен
              </span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--color-text-body)', lineHeight: 1.4 }}>
              Прямые коммерческие закупки крупных частных холдингов без бюрократии 44-ФЗ. Запросы на 3D-туры, ролики и графику.
            </p>
            <div style={{ marginTop: '10px', fontSize: '11px', color: '#047857', fontWeight: 600 }}>
              • Прямые бюджеты от 1 500 000 ₽
            </div>
          </div>
          <button
            onClick={onAiHunt}
            disabled={isAiHunting}
            className="btn btn-outline"
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px' }}
          >
            <Play size={13} />
            <span>Сканировать закупки</span>
          </button>
        </div>

        {/* Channel 2: Telegram Channels */}
        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Send size={18} color="#0284c7" />
                </div>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-black)' }}>Telegram-сообщества</h3>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-headline)' }}>CG Freelance, Norm, Finder</div>
                </div>
              </div>
              <span className="badge badge-verified">
                <CheckCircle2 size={12} /> Активен
              </span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--color-text-body)', lineHeight: 1.4 }}>
              Продюсеры агентств и брендов ищут команды на субподряд по 3D, CGI и моушн-дизайну с прямым откликом в Telegram.
            </p>
            <div style={{ marginTop: '10px', fontSize: '11px', color: '#0284c7', fontWeight: 600 }}>
              • Горячие задачи с быстрым стартом
            </div>
          </div>
          <button
            onClick={onAiHunt}
            disabled={isAiHunting}
            className="btn btn-outline"
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px' }}
          >
            <Play size={13} />
            <span>Сканировать Telegram</span>
          </button>
        </div>

        {/* Channel 3: HeadHunter Projects */}
        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Briefcase size={18} color="#dc2626" />
                </div>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-black)' }}>HeadHunter (Контракты)</h3>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-headline)' }}>Проектная работа и аутсорс</div>
                </div>
              </div>
              <span className="badge badge-verified">
                <CheckCircle2 size={12} /> Активен
              </span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--color-text-body)', lineHeight: 1.4 }}>
              Поиск компаний, нанимающих проектные продакшн-команды и студии под выпуск серий роликов и презентационной графики.
            </p>
            <div style={{ marginTop: '10px', fontSize: '11px', color: '#dc2626', fontWeight: 600 }}>
              • Подтвержденные контакты работодателей
            </div>
          </div>
          <button
            onClick={onAiHunt}
            disabled={isAiHunting}
            className="btn btn-outline"
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px' }}
          >
            <Play size={13} />
            <span>Сканировать HeadHunter</span>
          </button>
        </div>

        {/* Channel 4: Habr Freelance & Workspace */}
        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--accent-emerald-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Globe size={18} color="var(--color-accent-green-text)" />
                </div>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-black)' }}>Хабр Заказы & Workspace</h3>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-headline)' }}>Технологичные 3D и видео брифы</div>
                </div>
              </div>
              <span className="badge badge-verified">
                <CheckCircle2 size={12} /> Активен
              </span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--color-text-body)', lineHeight: 1.4 }}>
              Открытые заявки бизнеса на 3D WebGL, визуализацию техники, брендовые эксплейнеры и рекламное видео.
            </p>
            <div style={{ marginTop: '10px', fontSize: '11px', color: 'var(--color-accent-green-text)', fontWeight: 600 }}>
              • Прямая кнопка подачи заявки
            </div>
          </div>
          <button
            onClick={onFullScan}
            disabled={isScanningAll}
            className="btn btn-primary"
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px' }}
          >
            {isScanningAll ? <RefreshCw size={13} className="spin" /> : <Sparkles size={13} />}
            <span>Запустить сквозной поиск</span>
          </button>
        </div>

      </div>

      {/* Detailed Sources List Table */}
      <div className="card" style={{ padding: '20px' }}>
        <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-black)', marginBottom: '12px' }}>
          Список подключенных источников мониторинга
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="leads-table">
            <thead>
              <tr>
                <th>Канал данных</th>
                <th>Специализация и охват</th>
                <th style={{ textAlign: 'center' }}>Статус</th>
              </tr>
            </thead>
            <tbody>
              {sourcesList.map((src, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 600, color: 'var(--color-text-black)' }}>{src.name}</td>
                  <td style={{ color: 'var(--color-text-headline)', fontSize: '12px' }}>{src.focus}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span className="badge badge-verified">
                      <CheckCircle2 size={11} /> Активен
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
