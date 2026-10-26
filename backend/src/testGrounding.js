import dotenv from 'dotenv';
dotenv.config();

const key = (process.env.Google_api || '').trim();

async function testGrounding() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${key}`;
  const prompt = `
Ты автономный ИИ-поисковик коммерческих B2B-заказов для 3D/Motion студии.
Найди в интернете актуальные реальные запросы, тендеры или анонсы от компаний в России на создание 3D видеоролика, промо-ролика, графики или анимации.
Исключи резюме соискателей и фрилансеров.
Выведи 1 реальный заказ: название компании, описание задачи, примерный бюджет и контакты или ссылку.
`;

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    tools: [{ googleSearch: {} }]
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  if (data.candidates && data.candidates[0]) {
    const text = data.candidates[0].content.parts[0].text;
    console.log('--- РЕЗУЛЬТАТ ПОИСКА ИИ ЧЕРЕЗ GOOGLE SEARCH ---');
    console.log(text.slice(0, 700));
    if (data.candidates[0].groundingMetadata) {
      console.log('\nИсточники поиска:', data.candidates[0].groundingMetadata.webSearchQueries);
    }
    return true;
  } else {
    console.log('Ошибка grounding:', JSON.stringify(data, null, 2));
    return false;
  }
}

testGrounding().catch(console.error);
