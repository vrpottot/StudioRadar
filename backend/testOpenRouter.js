import dotenv from 'dotenv';
dotenv.config();

import { callAi, analyzeLeadWithAi } from './src/aiService.js';

async function testAi() {
  const useOmni = process.env.USE_OMNIROUTE === 'true';
  const omniUrl = process.env.OMNIROUTE_URL || 'http://127.0.0.1:20128/v1';
  const openRouterKey = (process.env.OPENROUTER_API_KEY || '').trim();
  const model = process.env.OPENROUTER_MODEL || 'deepseek/deepseek-chat';

  console.log('=== Проверка конфигурации ИИ ===');
  console.log('Режим OmniRoute (локальный шлюз):', useOmni ? `ВКЛЮЧЕН (${omniUrl})` : 'Выключен');
  console.log('Облачный OpenRouter ключ:', openRouterKey ? 'УКАЗАН' : 'Не указан');
  console.log('Целевая модель:', model);

  console.log('\n--- Отправка тестового запроса квалификации лида ---');
  const samplePost = `
ГК «РусТехника». Требуется разработка рекламного 3D-видеоролика для презентации нового поколения гусеничного трактора на выставке. Демонстрация гидравлики и двигателя в разрезе.
Бюджет от 650 000 руб.
Контакты для связи: +7 (495) 744-22-11, руководитель отдела маркетинга Смирнов Алексей @rustech_marketing
  `.trim();

  try {
    const result = await analyzeLeadWithAi(samplePost, "Тестовый источник");
    console.log('\n[УСПЕХ] Ответ ИИ (JSON):');
    console.log(JSON.stringify(result, null, 2));

    console.log('\n--- Отправка теста отсева резюме фрилансера ---');
    const resumePost = `
Привет всем! Я моушн-дизайнер 3D/2D, ищу проекты и разовые задачи. Делаю анимацию логотипов, ролики, плашки. Мое портфолио: behance.net/test. Пишите в лс.
    `.trim();

    const resumeResult = await analyzeLeadWithAi(resumePost, "Тестовый источник");
    console.log('[УСПЕХ] Отсев выполнен корректно:');
    console.log('- Является клиентом (is_real_client):', resumeResult.is_real_client);
    console.log('- Причина отсева (rejection_reason):', resumeResult.rejection_reason);
  } catch (err) {
    console.error('\n[Ошибка ИИ]:', err.message);
  }
}

testAi().catch(console.error);
