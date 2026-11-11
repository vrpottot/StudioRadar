export async function requestJson(url, options) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || `Сервер вернул HTTP ${response.status}. Проверьте терминал backend.`);
  if (data === null) throw new Error('Backend вернул некорректный ответ');
  if (data.success === false || data.error) throw new Error(data.error || 'Операция не выполнена');
  return data;
}
