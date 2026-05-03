import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { Telegraf, Markup } from 'telegraf';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { dbService } from './src/services/db.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim();
const adminId = process.env.ADMIN_TELEGRAM_ID?.trim();
const appUrl = process.env.APP_URL?.trim();

const bot = new Telegraf(botToken || '');

bot.catch((err: any, ctx) => {
  console.error(`❌ Telegraf Error for ${ctx.updateType}:`, err);
});

const strings = {
  be: {
    welcome: '👋 Вітаем! Гэта шматмоўны бот Scamlab.\nАбярыце дзеянне:',
    about: () => `🛡️ **Scamlab** - гэта сімулятар кібербяспекі.\nДаныя захоўваюцца лакальна ў базе SQLite.`,
    help: '❓ **Дапамога:**\nВы можаце звярнуцца да падтрымкі, проста даслаўшы паведамленне.',
    ping: '🏓 Понг!',
    leaders: '🏆 **Топ гульцоў:**\n\n',
    no_leaders: 'Пакуль ніхто не зарэгістраваны.',
    support_sent: '✅ Ваша паведамленне адпраўлена адміністратару. Чакайце адказу.',
    admin_reply_success: '✅ Адказ адпраўлен карыстальніку!',
    select_lang: 'Абярыце мову / Выберите язык:',
    lang_changed: '✅ Мова зменена на беларускую!',
    btn_about: '🛡️ Пра праект',
    btn_help: '❓ Дапамога',
    btn_lang: '🌐 Змяніць мову',
    btn_leaders: '🏆 Лідары',
    btn_game: '🎮 Адкрыць Scamlab',
    btn_back: '⬅️ Назад'
  },
  ru: {
    welcome: '👋 Привет! Это многоязычный бот Scamlab.\nВыберите действие:',
    about: () => `🛡️ **Scamlab** - это симулятор кибербезопасности.\nДанные хранятся локально в базе SQLite.`,
    help: '❓ **Помощь:**\nВы можете обратиться в поддержку, просто отправив сообщение.',
    ping: '🏓 Понг!',
    leaders: '🏆 **Топ игроков:**\n\n',
    no_leaders: 'Пока никто не зарегистрирован.',
    support_sent: '✅ Ваше сообщение отправлено администратору. Ожидайте ответа.',
    admin_reply_success: '✅ Ответ отправлен пользователю!',
    select_lang: 'Выберите язык / Абярыце мову:',
    lang_changed: '✅ Язык изменен на русский!',
    btn_about: '🛡️ О проекте',
    btn_help: '❓ Помощь',
    btn_lang: '🌐 Изменить язык',
    btn_leaders: '🏆 Лидеры',
    btn_game: '🎮 Открыть Scamlab',
    btn_back: '⬅️ Назад'
  }
};

const getKB = (lang: 'be' | 'ru') => {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback(strings[lang].btn_about, 'nav_about'),
      Markup.button.callback(strings[lang].btn_leaders, 'nav_leaders')
    ],
    [
      Markup.button.webApp(strings[lang].btn_game, appUrl || ''),
      Markup.button.callback(strings[lang].btn_lang, 'nav_lang')
    ]
  ]);
};

const getInlineLangKB = (lang: 'be' | 'ru') => {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('Беларуская 🇧🇾', 'set_lang_be'),
      Markup.button.callback('Русский 🇷🇺', 'set_lang_ru')
    ],
    [
      Markup.button.callback(strings[lang].btn_back, 'nav_main')
    ]
  ]);
};

const getBackKB = (lang: 'be' | 'ru') => {
  return Markup.inlineKeyboard([
    [Markup.button.callback(strings[lang].btn_back, 'nav_main')]
  ]);
};

bot.start(async (ctx) => {
  const userId = ctx.from.id;
  const user = await dbService.ensureUser(userId, ctx.from.username || '', ctx.from.first_name);
  const lang = (user.lang || 'ru') as 'be' | 'ru';
  
  if (!user.lang) {
    return ctx.reply(strings.ru.select_lang, getInlineLangKB('ru'));
  }
  
  ctx.reply(strings[lang].welcome, getKB(lang));
});

bot.action('nav_main', async (ctx) => {
  const user = await dbService.getUser(ctx.from.id.toString());
  const lang = (user?.lang || 'ru') as 'be' | 'ru';
  await ctx.answerCbQuery();
  try {
    await ctx.editMessageText(strings[lang].welcome, getKB(lang));
  } catch (e) {
    // If text is same, just ignore error
  }
});

bot.command('id', (ctx) => {
  ctx.reply(`🆔 Ваш Telegram ID: \`${ctx.from.id}\``, { parse_mode: 'Markdown' });
});

bot.command('ping', (ctx) => {
  ctx.reply('🏓 Понг!');
});

bot.command('broadcast', async (ctx) => {
  if (!adminId || ctx.from.id.toString() !== adminId) return;
  const text = ctx.message.text.split(' ').slice(1).join(' ');
  if (!text) return ctx.reply('❌ Использование: /broadcast [текст]');

  const users = await dbService.getAllUsers();
  let successCount = 0;

  ctx.reply(`📢 Начинаю рассылку для ${users.length} пользователей...`);

  for (const user of users) {
    try {
      await bot.telegram.sendMessage(user.id, `🆕 **Новости проекта:**\n\n${text}`, { parse_mode: 'Markdown' });
      successCount++;
      // Anti-flood: 30 messages per second limit for bots
      if (successCount % 25 === 0) await new Promise(r => setTimeout(r, 1000));
    } catch (err) {
      console.error(`Failed to send broadcast to ${user.id}`);
    }
  }

  ctx.reply(`✅ Рассылка завершена! Успешно: ${successCount}/${users.length}`);
});

// Handle Language switching via Inline buttons
bot.action(/set_lang_(be|ru)/, async (ctx) => {
  const lang = ctx.match[1] as 'be' | 'ru';
  const userId = ctx.from.id;
  
  await dbService.updateUser(userId, { lang });
  await ctx.answerCbQuery();
  
  try {
    await ctx.editMessageText(strings[lang].lang_changed + '\n\n' + strings[lang].welcome, getKB(lang));
  } catch (e) {
    await ctx.reply(strings[lang].welcome, getKB(lang));
  }
});

// Navigation handlers
bot.action('nav_about', async (ctx) => {
  const user = await dbService.getUser(ctx.from.id.toString());
  const lang = (user?.lang || 'ru') as 'be' | 'ru';
  await ctx.answerCbQuery();
  try {
    await ctx.editMessageText(strings[lang].about(), { parse_mode: 'Markdown', ...getBackKB(lang) });
  } catch (e) {}
});

bot.action('nav_leaders', async (ctx) => {
  const user = await dbService.getUser(ctx.from.id.toString());
  const lang = (user?.lang || 'ru') as 'be' | 'ru';
  
  const leaders = await dbService.getLeaders(10);
  await ctx.answerCbQuery();
  
  let msg = '';
  if (leaders.length === 0) {
    msg = strings[lang].no_leaders;
  } else {
    msg = strings[lang].leaders;
    leaders.forEach((p, i) => {
      msg += `${i + 1}. ${p.firstName || p.username || 'Anon'} — ✨ Lvl ${p.level} (${p.xp} XP)\n`;
    });
  }
  
  try {
    await ctx.editMessageText(msg, { parse_mode: 'Markdown', ...getBackKB(lang) });
  } catch (e) {}
});

bot.action('nav_lang', async (ctx) => {
  const user = await dbService.getUser(ctx.from.id.toString());
  const lang = (user?.lang || 'ru') as 'be' | 'ru';
  await ctx.answerCbQuery();
  try {
    await ctx.editMessageText(strings[lang].select_lang, getInlineLangKB(lang));
  } catch (e) {}
});

bot.command('leaders', async (ctx) => {
  const userId = ctx.from.id;
  const user = await dbService.ensureUser(userId, ctx.from.username || '', ctx.from.first_name);
  const lang = (user.lang || 'ru') as 'be' | 'ru';
  
  const leaders = await dbService.getLeaders(10);
  if (leaders.length === 0) return ctx.reply(strings[lang].no_leaders);

  let msg = strings[lang].leaders;
  leaders.forEach((p, i) => {
    msg += `${i + 1}. ${p.firstName || p.username || 'Anon'} — ✨ Lvl ${p.level} (${p.xp} XP)\n`;
  });
  return ctx.reply(msg, { parse_mode: 'Markdown', ...getKB(lang) });
});

// Support and Admin logic
bot.on(['message', 'photo', 'document'], async (ctx) => {
  const userId = ctx.from.id;
  const user = await dbService.ensureUser(userId, ctx.from.username || '', ctx.from.first_name);
  const lang = (user.lang || 'ru') as 'be' | 'ru';
  
  let messageText = '';
  let fileId = '';
  let fileType = '';

  if ('text' in ctx.message) {
    messageText = ctx.message.text;
  } else if ('photo' in ctx.message) {
    messageText = ctx.message.caption || '[Фото]';
    fileId = ctx.message.photo[ctx.message.photo.length - 1].file_id;
    fileType = 'photo';
  } else if ('document' in ctx.message) {
    messageText = ctx.message.caption || `[Файл: ${ctx.message.document.file_name}]`;
    fileId = ctx.message.document.file_id;
    fileType = 'document';
  }

  // If Admin replies
  const message = ctx.message as any;
  if (adminId && userId.toString() === adminId && message?.reply_to_message) {
    const replyTo = message.reply_to_message as any;
    const originalUserId = replyTo.forward_from?.id || (replyTo.text?.match(/ID: (\d+)/)?.[1]) || (replyTo.caption?.match(/ID: (\d+)/)?.[1]);
    
    if (originalUserId) {
      try {
        if (fileType === 'photo') {
          await bot.telegram.sendPhoto(originalUserId, fileId, { caption: `💬 **Администратор:**\n\n${messageText}`, parse_mode: 'Markdown' });
        } else if (fileType === 'document') {
          await bot.telegram.sendDocument(originalUserId, fileId, { caption: `💬 **Администратор:**\n\n${messageText}`, parse_mode: 'Markdown' });
        } else {
          await bot.telegram.sendMessage(originalUserId, `💬 **Администратор:**\n\n${messageText}`, { parse_mode: 'Markdown' });
        }
        
        await ctx.reply(strings.ru.admin_reply_success);
        await dbService.addSupportMessage(originalUserId, 'admin', messageText, fileId, fileType);
      } catch (e) {
        await ctx.reply('❌ Ошибка отправки.');
      }
      return;
    }
  }

  // Regular user feedback
  if (userId.toString() !== adminId) {
    if (adminId) {
      const adminHeader = `📥 **Новое сообщение!**\nОт: ${ctx.from.first_name} (@${ctx.from.username || 'none'})\nID: ${userId}\n\n`;
      
      if (fileType === 'photo') {
        await bot.telegram.sendPhoto(adminId, fileId, { caption: adminHeader + messageText });
      } else if (fileType === 'document') {
        await bot.telegram.sendDocument(adminId, fileId, { caption: adminHeader + messageText });
      } else {
        await bot.telegram.sendMessage(adminId, adminHeader + messageText);
      }
      await ctx.reply(strings[lang].support_sent);
    } else {
      // No admin configured, still acknowledge the message
      await ctx.reply(lang === 'be' ? 'Дзякуй за паведамленне! Мы атрымалі яго.' : 'Спасибо за сообщение! Мы получили его.');
    }
    
    await dbService.addSupportMessage(userId.toString(), 'user', messageText, fileId, fileType);
  }
});

async function startServer() {
  const app = express();
  app.use(express.json());

  app.post('/api/webhook', (req, res) => {
    bot.handleUpdate(req.body, res);
  });

  app.get('/api/health', async (req, res) => {
    res.json({ 
      status: 'ok', 
      mode: dbService.getMode(),
      time: new Date().toISOString()
    });
  });

  app.get('/api/results', async (req, res) => {
    try {
      const leaders = await dbService.getLeaders(50);
      res.json(leaders);
    } catch (err: any) {
      res.status(500).json({ error: 'Database error', details: err.message });
    }
  });

  app.get('/api/news', async (req, res) => {
    try {
      const news = await dbService.getNews(10);
      res.json(news);
    } catch (err) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.post('/api/news', async (req, res) => {
    if (!adminId || req.headers['x-admin-id'] !== adminId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    try {
      await dbService.addNews(req.body);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.get('/api/user/:id', async (req, res) => {
    try {
      const user = await dbService.getUser(req.params.id);
      if (!user) return res.status(404).json({ error: 'User not found' });
      res.json(user);
    } catch (err) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.get('/api/support/:id', async (req, res) => {
    try {
      const history = await dbService.getSupportHistory(req.params.id);
      res.json(history);
    } catch (err) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.post('/api/sync', async (req, res) => {
    try {
      const { id, username, firstName, xp, level, lang, streak, maxCombo, totalCorrect, totalAnswered } = req.body;
      if (!id) return res.status(400).json({ error: 'Missing userId' });

      const existingUser = await dbService.getUser(id.toString());
      const updateData: any = { username, firstName, xp, level, lang, streak, maxCombo, totalCorrect, totalAnswered };

      if (!existingUser) {
        await dbService.ensureUser(id, username, firstName);
        await dbService.updateUser(id, updateData);
      } else {
        await dbService.updateUser(id, updateData);
        
        const oldLevel = existingUser.level || 1;
        if (level > oldLevel) {
          const msg = lang === 'be' 
            ? `🎉 Поспех! Вы дасягнулі ўзроўню **${level}**! Так трымаць! 🛡️`
            : `🎉 Успех! Вы достигли уровня **${level}**! Так держать! 🛡️`;
          
          bot.telegram.sendMessage(id, msg, { parse_mode: 'Markdown' }).catch(() => {});
        }
      }
      
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: 'Database error', details: err.message });
    }
  });

  app.post('/api/notify', async (req, res) => {
    try {
      const { userId, message } = req.body;
      if (!userId || !message) return res.status(400).json({ error: 'Missing userId or message' });
      await bot.telegram.sendMessage(userId, message, { parse_mode: 'Markdown' });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Failed to send notification' });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  return app;
}

(async () => {
  console.log('🚀 Hybrid Backend initialized...');
  
  const app = await startServer();
  const PORT = 3000;
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server on http://localhost:${PORT} [${dbService.getMode()}]`);
  });

  if (botToken) {
    if (!adminId) console.warn('⚠️ ADMIN_TELEGRAM_ID is missing. Support replies will not work.');
    if (!appUrl) console.warn('⚠️ APP_URL is missing. Mini App link in bot will not work.');
    
    (async () => {
      try {
        console.log('🤖 Bot initializing in background...');
        const botMe = await bot.telegram.getMe();
        console.log(`🤖 Bot "@${botMe.username}" is online [ID: ${botMe.id}]`);
        
        // Set commands
        await bot.telegram.setMyCommands([
          { command: 'start', description: 'Запустить бота / Запусціць бота' },
          { command: 'id', description: 'Узнать свой ID / Даведацца свой ID' },
          { command: 'ping', description: 'Проверить связь / Праверыць сувязь' },
          { command: 'leaders', description: 'Топ игроков / Топ гульцоў' },
          { command: 'status', description: 'Статус системы / Статус сістэмы' }
        ]);

        bot.command('status', async (ctx) => {
          const users = await dbService.getAllUsers();
          const msg = `📊 **Scamlab System Status**\n\n` +
                      `🔹 Total Users: \`${users.length}\`\n` +
                      `🔹 Time: \`${new Date().toLocaleString()}\``;
          ctx.reply(msg, { parse_mode: 'Markdown' });
        });

        const isDev = process.env.NODE_ENV !== 'production';
        const useWebhook = appUrl && !isDev && process.env.USE_WEBHOOK === 'true';

        if (useWebhook) {
          try {
            const webhookUrl = `${appUrl.replace(/\/$/, '')}/api/webhook`;
            console.log(`🌐 Setting webhook to: ${webhookUrl}`);
            await bot.telegram.setWebhook(webhookUrl, {
              drop_pending_updates: true,
              allowed_updates: ['message', 'callback_query', 'my_chat_member', 'chat_member']
            });
            console.log('✅ Bot Mode: Webhook active');
          } catch (webhookErr: any) {
            console.error('❌ Webhook failed, switching to polling:', webhookErr.message);
            await startPolling();
          }
        } else {
          await startPolling();
        }
      } catch (err) {
        console.error('❌ Bot Global Init Error:', err);
      }
    })();

    async function startPolling() {
      console.log('🔄 Deleting webhook and launching polling...');
      try {
        await bot.telegram.deleteWebhook({ drop_pending_updates: true });
        await bot.launch({ dropPendingUpdates: true });
        console.log('🤖 Bot Mode: Polling active');
      } catch (err: any) {
        console.error('❌ Polling Launch Error:', err.message);
      }
    }
    
    process.once('SIGINT', () => { bot.stop('SIGINT'); server.close(); });
    process.once('SIGTERM', () => { bot.stop('SIGTERM'); server.close(); });
  } else {
    console.warn('⚠️ TELEGRAM_BOT_TOKEN is missing. Bot will not start.');
  }
})();
