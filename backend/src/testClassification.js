import dotenv from 'dotenv';
dotenv.config();

const key = (process.env.Google_api || '').trim();

async function testPrompt() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${key}`;
  const prompt = `
Ты опытный коммерческий директор студии 3D/Motion графики.
Твоя задача — определить, является ли автор сообщения РЕАЛЬНЫМ ЗАКАЗЧИКОМ (покупателем) или это ФРИЛАНСЕР/СОИСКАТЕЛЬ (продавец услуг).

Сообщение 1:
"Привет, я 2D Motion Designer Анатолий @Creooutsourse. Специализируюсь на создании гемблинг креативов... В поиске новых проектов и задач. Готов к работе..."

Сообщение 2:
"ГК «ВостокТрак Инжиниринг». Ищем студию для разработки 3D-видеоролика обновленного карьерного самосвала и кинематики подвески. Бюджет от 600 000 руб. Контакт: @artem_vostoktruck"

Проанализируй каждое и верни JSON массив:
[
  {
    "id": 1,
    "is_real_client": false,
    "reason": "Фрилансер предлагает свои услуги (соискатель)"
  },
  {
    "id": 2,
    "is_real_client": true,
    "reason": "Прямая компания ищет студию под конкретную задачу с бюджетом",
    "company": "ГК «ВостокТрак Инжиниринг»",
    "budget": "от 600 000 руб"
  }
]
`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" }
    })
  });
  const data = await res.json();
  if (data.candidates && data.candidates[0]) {
    console.log('Gemini AI Output:\n', data.candidates[0].content.parts[0].text);
  } else {
    console.log('Error:', data.error?.message);
  }
}

testPrompt().catch(console.error);
