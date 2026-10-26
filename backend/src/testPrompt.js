import dotenv from 'dotenv';
dotenv.config();

const key = (process.env.Google_api || '').trim();

async function testPrompt() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${key}`;
  const prompt = `
Твоя задача — классифицировать сообщение из интернета/Telegram для студии 3D/Motion дизайна.
Сообщение:
"Привет, я 2D Motion Designer Анатолий @Creooutsourse. Специализируюсь на создании гемблинг креативов... В поиске новых проектов и задач. Готов к работе..."

Ответь в формате JSON:
{
  "is_client": false,
  "reason": "Это соискатель/фрилансер, предлагающий свои услуги",
  "client_name": null,
  "industry": null,
  "budget": null
}
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
    console.log('Gemini AI Output:');
    console.log(data.candidates[0].content.parts[0].text);
  } else {
    console.log('Error:', data.error?.message);
  }
}

testPrompt().catch(console.error);
