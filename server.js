import express from 'express';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

const BOT_TOKEN = '8789479639:AAGb2A82UJaJ9lsl2yBuj-Jur8CbMR2nB5M';
const WEB_APP_URL = 'https://ptest-app-production.up.railway.app';

app.use(express.json());

// Serve static built files
app.use(express.static(path.join(__dirname, 'dist')));

// Serve rasmlar (HD images)
app.use('/rasmlar', express.static(path.join(__dirname, 'rasmlar'), {
  maxAge: '30d',
  immutable: true
}));

// Telegram Bot webhook
app.post(`/webhook/${BOT_TOKEN}`, (req, res) => {
  const msg = req.body?.message;
  if (msg?.text) {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (text === '/start' || text === '/test') {
      sendTelegram('sendMessage', {
        chat_id: chatId,
        text: '📋 *PTest — Тест менеджер*\n\nПроходите тесты ПДД, сортируйте вопросы и экспортируйте результаты.\n\n👇 Нажмите кнопку ниже, чтобы начать:',
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[
            { text: '🚀 Открыть PTest', web_app: { url: WEB_APP_URL } }
          ]]
        }
      });
    }
  }
  res.sendStatus(200);
});

function sendTelegram(method, body) {
  const data = JSON.stringify(body);
  const req = https.request({
    hostname: 'api.telegram.org',
    path: `/bot${BOT_TOKEN}/${method}`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
  });
  req.write(data);
  req.end();
}

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`PTest running on port ${PORT}`);

  // Auto-register webhook on startup
  const webhookUrl = `${WEB_APP_URL}/webhook/${BOT_TOKEN}`;
  sendTelegram('setWebhook', { url: webhookUrl });
  console.log(`Telegram webhook set: ${webhookUrl}`);
});
