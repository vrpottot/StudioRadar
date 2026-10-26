import dotenv from 'dotenv';
dotenv.config();

const key = (process.env.Google_api || '').trim();

async function test(modelName) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${key}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: 'Привет! Ответь одним словом: Работает' }] }]
    })
  });
  const data = await res.json();
  if (data.candidates && data.candidates[0]) {
    console.log(`[${modelName}] УСПЕХ:`, data.candidates[0].content.parts[0].text.trim());
    return true;
  } else {
    console.log(`[${modelName}] Ошибка:`, data.error?.message);
    return false;
  }
}

async function run() {
  const models = ['gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-flash-latest', 'gemini-2.5-flash'];
  for (const m of models) {
    const ok = await test(m);
    if (ok) {
      console.log('Выбран рабочий вариант модели:', m);
      break;
    }
  }
}

run().catch(console.error);
