const https = require('https');

const TOKEN = '8789479639:AAGb2A82UJaJ9lsl2yBuj-Jur8CbMR2nB5M';
const WEB_APP_URL = 'https://ptest-app-production.up.railway.app';

function api(method, body = {}) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = https.request({
      hostname: 'api.telegram.org',
      path: `/bot${TOKEN}/${method}`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': data.length }
    }, (res) => {
      let buf = '';
      res.on('data', d => buf += d);
      res.on('end', () => {
        try { resolve(JSON.parse(buf)); }
        catch { resolve(buf); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function setup() {
  console.log('1. Проверяю бота...');
  const me = await api('getMe');
  console.log(`   ✅ Бот: @${me.result.username} (${me.result.first_name})`);

  console.log('\n2. Устанавливаю кнопку Mini App...');
  const menuResult = await api('setChatMenuButton', {
    menu_button: {
      type: 'web_app',
      text: '📋 PTest',
      web_app: { url: WEB_APP_URL }
    }
  });
  console.log(`   ${menuResult.ok ? '✅' : '❌'} Menu button: ${JSON.stringify(menuResult)}`);

  console.log('\n3. Устанавливаю команды...');
  const cmdsResult = await api('setMyCommands', {
    commands: [
      { command: 'start', description: 'Запустить PTest' },
      { command: 'test', description: 'Открыть тесты' }
    ]
  });
  console.log(`   ${cmdsResult.ok ? '✅' : '❌'} Commands set`);

  console.log('\n4. Устанавливаю описание...');
  await api('setMyDescription', {
    description: 'PTest — премиум тест-менеджер для ПДД Узбекистана.'
  });
  await api('setMyShortDescription', {
    short_description: 'ПДД тесты Узбекистана'
  });
  console.log('   ✅ Description set');

  console.log('\n========================================');
  console.log('🎉 ГОТОВО! Telegram Mini App настроен!');
  console.log('========================================');
  console.log(`\n📱 Бот: https://t.me/${me.result.username}`);
  console.log('   Нажмите кнопку "📋 PTest" внизу чата');
}

setup().catch(console.error);
