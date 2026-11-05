import { WebSocketServer, WebSocket } from 'ws';

let wss = null;

/**
 * Инициализация WebSocket сервера
 * @param {import('http').Server} server 
 */
export function initWs(server) {
  wss = new WebSocketServer({ server });

  wss.on('connection', (ws) => {
    ws.send(JSON.stringify({ 
      type: 'connected', 
      message: 'StudioRadar WebSocket Active' 
    }));
  });

  return wss;
}

/**
 * Рассылка события всем подключенным клиентам
 * @param {object} data - Данные для отправки
 */
export function broadcast(data) {
  if (!wss) return;
  const payload = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}
