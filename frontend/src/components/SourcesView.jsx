import React from 'react';
import { 
  Send, 
  Search, 
  Sparkles, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Play, 
  RefreshCw,
  ShieldCheck,
  Radio
} from 'lucide-react';

export default function SourcesView({ 
  onHhScan, 
  isHhScanning, 
  onTgScan, 
  isTgScanning, 
  onAiHunt, 
  isAiHunting 
}) {
  const telegramChannels = [
    { name: "Brickspacer Career", username: "brickspacer_career", focus: "3D/CGI проекты и вакансии", status: "online" },
    { name: "Designer Work Chat", username: "designerworkchat", focus: "Заказы для моушн и графических дизайнеров", status: "online" },
    { name: "CG Work Hub", username: "CGWorkHub", focus: "3D графика, анимация и кинопроизводство", status: "online" },
    { name: "Jetlag Production", username: "jetlagchat", focus: "Видеопроизводство, рекламные ролики, CGI", status: "online" },
    { name: "Сиджин CG Chat", username: "cidjin_chat", focus: "Профессиональное 3D/CGI сообщество", status: "online" },
    { name: "Desgang Community", username: "desgangchat", focus: "Дизайн, брендинг и моушн", status: "online" },
    { name: "AI Vacancy Channel", username: "aivacancychannel", focus: "Нейросети, генеративная графика и ИИ-видео", status: "online" },
    { name: "Motion Hunter", username: "motionhunter", focus: "Прямые заказы на моушн-дизайн", status: "online" },
    { name: "CG Freelance & Orders", username: "cgfreelance", focus: "Спецзаказы на компьютерную графику", status: "online" }
  ];

  const hhQueries = [
    { query: "3D motion", targetService: "3D моушен-дизайн", interval: "Каждые 4 часа" },
    { query: "моушн дизайн ролик", targetService: "2D/3D моушен-дизайн", interval: "Каждые 4 часа" },
    { query: "3D визуализация", targetService: "3D презентации продуктов", interval: "Каждые 6 часов" },
    { query: "CGI видеоролик", targetService: "Рекламный CGI", interval: "Каждые 6 часов" },
    { query: "3D анимация", targetService: "Анимационные ролики", interval: "Каждые 4 часа" },
    { query: "разработка 3D конфигуратора", targetService: "3D Web-приложения", interval: "Каждые 12 часов" }
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
            Управление подключаемыми модулями сбора информации по Telegram, HeadHunter и открытому вебу
          </p>
        </div>
      </div>

      {/* Main Sources Cards Grid (Раздел 5 ТЗ) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        {/* Telegram Card */}
        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#e0e1f7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Send size={18} color="var(--color-accent-purple)" />
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text-black)' }}>Telegram Модуль</h3>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-headline)' }}>Web Scraper + GramJS MTProto</div>
                </div>
              </div>

              <span className="badge badge-verified">
                <Radio size={12} color="var(--color-accent-green-text)" /> 9 каналов
              </span>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--color-text-body)', lineHeight: 1.4 }}>
              Автоматический сбор публичных постов и чатов профильных сообществ с фильтрацией резюме и спама.
            </p>

            <div style={{ marginTop: '12px', padding: '10px', background: 'var(--color-surface-beige-1)', borderRadius: '6px', fontSize: '11px', color: 'var(--color-text-headline)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div>• Быстрый скрапинг через зеркала t.me/s/ без блокировок</div>
              <div>• Поддержка авторизации личного аккаунта для закрытых чатов</div>
            </div>
          </div>

          <button
            onClick={onTgScan}
            disabled={isTgScanning}
            className="btn btn-outline"
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px' }}
          >
            {isTgScanning ? (
              <>
                <RefreshCw size={14} className="spin" />
                <span>Идет сканирование 9 каналов...</span>
              </>
            ) : (
              <>
                <Play size={14} />
                <span>Запустить сбор из Telegram</span>
              </>
            )}
          </button>
        </div>

        {/* HeadHunter Card */}
        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#fdf0e6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Search size={18} color="#7b3306" />
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text-black)' }}>HeadHunter (hh.ru)</h3>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-headline)' }}>Парсер проектных вакансий</div>
                </div>
              </div>

              <span className="badge badge-verified">
                <CheckCircle2 size={12} /> Активен
              </span>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--color-text-body)', lineHeight: 1.4 }}>
              Поиск компаний, ищущих подрядчиков или ключевых 3D-специалистов, с автоматическим извлечением прямых контактов ЛПР.
            </p>

            <div style={{ marginTop: '12px', padding: '10px', background: 'var(--color-surface-beige-1)', borderRadius: '6px', fontSize: '11px', color: 'var(--color-text-headline)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div>• 7 поисковых матриц по ключевым направлениям студии</div>
              <div>• Глубокое сканирование страницы вакансии и сайта работодателя</div>
            </div>
          </div>

          <button
            onClick={onHhScan}
            disabled={isHhScanning}
            className="btn btn-outline"
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px' }}
          >
            {isHhScanning ? (
              <>
                <RefreshCw size={14} className="spin" />
                <span>Парсинг свежих вакансий...</span>
              </>
            ) : (
              <>
                <Play size={14} />
                <span>Запустить сбор с HeadHunter</span>
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
      </div>

      {/* Detailed Channels List Table */}
      <div className="card" style={{ padding: '20px' }}>
        <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-black)', marginBottom: '12px' }}>
          Список подключенных Telegram-каналов и сообществ
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--color-text-headline)', fontSize: '11px', textTransform: 'uppercase' }}>
                <th style={{ padding: '10px' }}>Канал / Сообщество</th>
                <th style={{ padding: '10px' }}>Фокус мониторинга</th>
                <th style={{ padding: '10px' }}>Ссылка</th>
                <th style={{ padding: '10px' }}>Статус</th>
              </tr>
            </thead>
            <tbody>
              {telegramChannels.map((ch, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid var(--color-surface-beige-2)' }}>
                  <td style={{ padding: '10px', fontWeight: 600, color: 'var(--color-text-black)' }}>
                    {ch.name}
                  </td>
                  <td style={{ padding: '10px', color: 'var(--color-text-body)' }}>
                    {ch.focus}
                  </td>
                  <td style={{ padding: '10px' }}>
                    <a 
                      href={`https://t.me/${ch.username}`} 
                      target="_blank" 
                      rel="noreferrer"
                      style={{ color: 'var(--color-accent-purple)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
                    >
                      @{ch.username} <ExternalLink size={12} />
                    </a>
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
