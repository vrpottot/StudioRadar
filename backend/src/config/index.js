import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

export const PORT = process.env.PORT || 8001;
export const CORS_ORIGINS = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:3000').split(',').map(s => s.trim());

// Data storage paths (relative to backend root)
export const BACKEND_ROOT = path.resolve(__dirname, '../..');
export const LEADS_FILE = path.join(BACKEND_ROOT, 'leads.json');
export const PIPELINES_FILE = path.join(BACKEND_ROOT, 'pipelines.json');
export const SETTINGS_FILE = path.join(BACKEND_ROOT, 'settings.json');
