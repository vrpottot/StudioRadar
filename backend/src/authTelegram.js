import readline from 'readline';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ENV_PATH = path.join(__dirname, '..', '.env');
const SESSION_FILE = path.join(__dirname, '..', 'telegram.session');

dotenv.config({ path: ENV_PATH });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (q) => new Promise((resolve) => rl.question(q, resolve));

async function main() {
  console.log("=".repeat(60));
  console.log(" StudioRadar - Авторизация Telegram (Node.js GramJS)");
  console.log("=".repeat(60));
  console.log("\nДля сбора сообщений с реальных каналов через MTProto требуются API ключи.");
  console.log("Их можно получить бесплатно на сайте: https://my.telegram.org/apps\n");

  let apiId = process.env.TELEGRAM_API_ID ? parseInt(process.env.TELEGRAM_API_ID) : 0;
  let apiHash = process.env.TELEGRAM_API_HASH || '';

  if (!apiId || !apiHash) {
    const enteredId = await question("Введите API ID (цифры): ");
    const enteredHash = await question("Введите API HASH: ");

    apiId = parseInt(enteredId.trim());
    apiHash = enteredHash.trim();

    await fs.appendFile(ENV_PATH, `\nTELEGRAM_API_ID=${apiId}\nTELEGRAM_API_HASH=${apiHash}\n`, 'utf-8');
    console.log("[OK] Ключи сохранены в .env!");
  }

  let sessionString = '';
  try {
    sessionString = (await fs.readFile(SESSION_FILE, 'utf-8')).trim();
  } catch (e) {}

  const stringSession = new StringSession(sessionString);
  const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
  });

  await client.start({
    phoneNumber: async () => await question("Введите ваш номер телефона (+7...): "),
    password: async () => await question("Введите облачный пароль (если включена 2FA): "),
    phoneCode: async () => await question("Введите код подтверждения из Telegram: "),
    onError: (err) => console.log("[Ошибка]:", err),
  });

  console.log("[OK] Успешная авторизация!");
  const saved = client.session.save();
  await fs.writeFile(SESSION_FILE, saved, 'utf-8');
  console.log(`[OK] Сессия сохранена в ${SESSION_FILE}`);

  const me = await client.getMe();
  console.log(`Авторизован как: ${me.firstName} (@${me.username || 'нет юзернейма'})`);
  console.log("Теперь бэкенд может читать каналы в фоне!\n");

  rl.close();
  await client.disconnect();
}

main().catch(console.error);
