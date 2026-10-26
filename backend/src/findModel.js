import dotenv from 'dotenv';
dotenv.config();

const key = (process.env.Google_api || '').trim();

async function test(modelName) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${key}`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Привет! Назови 1 слово.' }] }]
      })
    });
    const data = await res.json();
    if (data.candidates && data.candidates[0]) {
      console.log(`[${modelName}] -> РАБОТАЕТ! Ответ:`, data.candidates[0].content.parts[0].text.trim());
      return true;
    } else {
      console.log(`[${modelName}] -> ${data.error?.message?.slice(0, 70)}`);
      return false;
    }
  } catch (e) {
    console.log(`[${modelName}] -> Ошибка сети:`, e.message);
    return false;
  }
}

async function run() {
  const models = [
    'gemini-flash-latest',
    'gemini-flash-lite-latest',
    'gemini-pro-latest',
    'gemini-3.5-flash-lite',
    'gemini-3.1-flash-lite',
    'gemini-3.1-pro-preview',
    'gemini-3.6-flash',
    'gemini-3.7-flash',
    'gemini-3.8-flash-lite-tts'
  ];
  for (const m of models) {
    const ok = await test(m);
    if (ok) {
      console.log('\n>>> РЕКОМЕНДУЕМАЯ МОДЕЛЬ:', m);
      break;
    }
  }
}

run().catch(console.error);
