/**
 * Экспорт списка лидов в формат CSV с поддержкой UTF-8 BOM для корректного открытия в Excel
 */
export function exportLeadsToCsv(leads, filename = 'studioradar_leads.csv') {
  if (!leads || leads.length === 0) {
    alert('Нет лидов для экспорта');
    return;
  }

  const headers = [
    'ID',
    'Компания',
    'Отрасль (Сфера)',
    'Услуга',
    'Грейд',
    'Match Score (%)',
    'Телефон',
    'Telegram',
    'Контактное лицо',
    'Источник',
    'Статус',
    'Текст задачи / Запрос',
    'Решение ИИ',
    'Ссылка',
    'Дата'
  ];

  const rows = leads.map(l => [
    l.id || '',
    `"${(l.company || '').replace(/"/g, '""')}"`,
    `"${(l.industry || '').replace(/"/g, '""')}"`,
    `"${(l.service || '').replace(/"/g, '""')}"`,
    l.grade || (l.score >= 90 ? 'A+' : l.score >= 75 ? 'A' : l.score >= 60 ? 'B' : l.score >= 45 ? 'C' : 'D'),
    l.score || '',
    `"${(l.phone || '').replace(/"/g, '""')}"`,
    `"${(l.telegram || '').replace(/"/g, '""')}"`,
    `"${(l.contactName || '').replace(/"/g, '""')}"`,
    `"${(l.source || '').replace(/"/g, '""')}"`,
    `"${(l.status || '').replace(/"/g, '""')}"`,
    `"${(l.requestText || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
    `"${(l.suggestedSolution || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
    `"${(l.url || '').replace(/"/g, '""')}"`,
    `"${(l.date || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = '\uFEFF' + [
    headers.join(';'),
    ...rows.map(r => r.join(';'))
  ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
