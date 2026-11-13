export const DEFAULT_SETTINGS = {
  notify_on_a_only: true, daily_digest_time: '09:00', min_score_threshold: 70,
  staff_stop_words: ['в штат', 'полная ставка', 'junior', 'стажер', 'оклад', 'курьер', 'офис-менеджер'],
  cheap_stop_words: ['рилс', 'reels', 'shorts', 'шортс', 'нарезка', 'бюджет 500', 'за отзыв'],
  education_stop_words: ['обучение', 'курсы', 'наставничество', 'вебинар', 'марафон', 'онлайн-школа'],
  ai_provider: 'gemini'
};

export function cleanSettings(settings = {}) {
  const allowed = new Set([...Object.keys(DEFAULT_SETTINGS), 'updated_at']);
  return Object.fromEntries(Object.entries(settings).filter(([key]) => allowed.has(key)).map(([key, value]) =>
    [key, key === 'ai_provider' ? 'gemini' : value]));
}
