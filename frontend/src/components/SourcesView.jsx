import React from 'react';
import { Search, Play, Globe } from 'lucide-react';

const SOURCES = [
  { name: 'HeadHunter', description: 'Проектные запросы компаний на студию или подрядчика. Обычные штатные вакансии исключены.' },
  { name: 'Telegram', description: 'Публичные посты с прямым заказчиком и явно указанным бюджетом проекта от 900 000 ₽.' },
  { name: 'LinkedIn', description: 'Публичные публикации компаний с текущим запросом на производство графики, видео или интерактива.' },
  { name: 'Facebook', description: 'Публичные посты и доступные поисковикам публикации групп с прямыми проектными запросами.' }
];
export default function SourcesView({ onFullScan, isScanningAll, isAiHunting }) {
  const busy = isScanningAll || isAiHunting;
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 700 }}>Источники прямых заказов</h2>
      <p style={{ marginTop: 8, color: 'var(--color-text-headline)' }}>Россия и СНГ · все настроенные отрасли · без фриланс-бирж и тендеров</p>
    </div>
    <div className="card" style={{ padding: 20 }}>
      <p style={{ display: 'flex', gap: 8, alignItems: 'center' }}><Globe size={18} /> Поиск через Exa и Tavily по открытым публикациям</p>
      <p style={{ marginTop: 10, lineHeight: 1.6, color: 'var(--color-text-headline)' }}>Проверяем явный запрос на подряд, отрасль, страну и актуальность за последние 30 дней. Закрытые группы, переписки и страницы за авторизацией недоступны. Без подтверждающего текста заказ не добавляется.</p>
      <button className="btn btn-primary" onClick={onFullScan} disabled={busy} style={{ marginTop: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
        {busy ? <Search size={16} /> : <Play size={16} />}{busy ? 'Поиск выполняется…' : 'Искать во всех источниках'}
      </button>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
      {SOURCES.map(source => <div className="card" key={source.name} style={{ padding: 20 }}>
        <h3 style={{ fontSize: 17, fontWeight: 700 }}>{source.name}</h3>
        <p style={{ marginTop: 10, lineHeight: 1.6, color: 'var(--color-text-headline)' }}>{source.description}</p>
      </div>)}
    </div>
  </div>;
}
