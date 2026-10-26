import { analyzeLeadWithAi } from './geminiService.js';

async function test() {
  console.log('--- 1. Тестируем пост фрилансера Анатолия ---');
  const post1 = `Привет, я 2D Motion Designer Анатолий @Creooutsourse Специализируюсь на создании гемблинг креативов... В гемблинге более 3х лет, работаю на фрилансе/аутсорсе. В поиске новых проектов и задач. Готов к работе...`;
  const res1 = await analyzeLeadWithAi(post1, 'TG');
  console.log('Результат 1:', res1.is_real_client ? 'ПРИНЯТ (Ошибка)' : 'ОТКЛОНЕН ИИ: ' + res1.rejection_reason);

  console.log('\n--- 2. Тестируем реальный заказ компании с HH ---');
  const post2 = `ООО «Ви Эл Пи компани» ищет 3D-дизайнера для проектной работы на аутсорс! Задачи: создание серии 3D-рендеров и рекламных 3D-роликов продуктовой линейки мобильных аксессуаров и электроники. Оплата по согласованию за каждый проект.`;
  const res2 = await analyzeLeadWithAi(post2, 'HH');
  console.log('Результат 2:', res2.is_real_client ? 'ПРИНЯТ ИИ!' : 'ОТКЛОНЕН: ' + res2.rejection_reason);
  if (res2.is_real_client) {
    console.log('  Компания:', res2.company_name);
    console.log('  Сфера:', res2.industry);
    console.log('  Услуга:', res2.service);
    console.log('  Скрипт ИИ:', res2.personalized_pitch);
  }
}

test().catch(console.error);
