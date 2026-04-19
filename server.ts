import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { Telegraf } from 'telegraf';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';
import fs from 'fs';
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { onRequest } from 'firebase-functions/v2/https';
import firebaseConfig from './firebase-applet-config.json' assert { type: 'json' };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: firebaseConfig.projectId,
  });
}
// Correct way to get a named database instance in Newer Firebase Admin SDK
const firestore = getFirestore(firebaseConfig.firestoreDatabaseId);

const botToken = process.env.TELEGRAM_BOT_TOKEN;
const adminId = process.env.ADMIN_TELEGRAM_ID;
const appUrl = process.env.APP_URL;

const bot = new Telegraf(botToken || '');

const strings = {
  be: {
    welcome: '👋 Вітаем! Гэта шматмоўны бот Scamlab.\nАбярыце дзеянне:',
    about: '🛡️ **Scamlab** - гэта сімулятар кібербяспекі.\nДаныя захоўваюцца ў воблаку праз Firebase (Firestore).',
    help: '❓ **Дапамога:**\nВы можаце звярнуцца да падтрымкі, проста даслаўшы паведамленне.',
    ping: '🏓 Понг!',
    leaders: '🏆 **Топ гульцоў:**\n\n',
    no_leaders: 'Пакуль ніхто не зарэгістраваны.',
    support_sent: '✅ Ваша паведамленне адпраўлена адміністратару. Чакайце адказу.',
    admin_reply_success: '✅ Адказ адпраўлен карыстальніку!',
    select_lang: 'Абярыце мову / Выберите язык:',
    btn_about: '🛡️ Пра праект',
    btn_help: '❓ Дапамога',
    btn_lang: '🌐 Змяніць мову',
    btn_leaders: '🏆 Лідары',
    btn_game: '🎮 Адкрыць Scamlab'
  },
  ru: {
    welcome: '👋 Привет! Это многоязычный бот Scamlab.\nВыберите действие:',
    about: '🛡️ **Scamlab** - это симулятор кибербезопасности.\nДанные хранятся локально через SQLite.',
    help: '❓ **Помощь:**\nВы можете обратиться в поддержку, просто отправив сообщение.',
    ping: '🏓 Понг!',
    leaders: '🏆 **Топ игроков:**\n\n',
    no_leaders: 'Пока никто не зарегистрирован.',
    support_sent: '✅ Ваше сообщение отправлено администратору. Ожидайте ответа.',
    admin_reply_success: '✅ Ответ отправлен пользователю!',
    select_lang: 'Выберите язык / Абярыце мову:',
    btn_about: '🛡️ О проекте',
    btn_help: '❓ Помощь',
    btn_lang: '🌐 Изменить язык',
    btn_leaders: '🏆 Лидеры',
    btn_game: '🎮 Открыть Scamlab'
  }
};

const getKB = (lang: 'be' | 'ru') => ({
  reply_markup: {
    keyboard: [
      [{ text: strings[lang].btn_about }, { text: strings[lang].btn_leaders }],
      [{ text: strings[lang].btn_lang }, { text: strings[lang].btn_game, web_app: { url: process.env.APP_URL || '' } }]
    ],
    resize_keyboard: true
  }
});

const langKB = {
  reply_markup: {
    keyboard: [[{ text: 'Беларуская 🇧🇾' }, { text: 'Русский 🇷🇺' }]],
    resize_keyboard: true,
    one_time_keyboard: true
  }
};

// Helper: Ensure user exists in Firestore
async function ensureUser(id: number, username: string, firstName: string) {
  const userRef = firestore.collection('users').doc(id.toString());
  const doc = await userRef.get();
  
  if (!doc.exists) {
    const newUser = {
      id: id.toString(),
      username: username || '',
      firstName: firstName || '',
      lang: 'ru',
      xp: 0,
      level: 1,
      lastActive: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    await userRef.set(newUser);
    return newUser;
  }
  return doc.data();
}

bot.start(async (ctx) => {
  await ensureUser(ctx.from.id, ctx.from.username || '', ctx.from.first_name);
  ctx.reply(strings.ru.select_lang, langKB);
});

// Handle text-based commands from Reply Keyboard
bot.on('message', async (ctx, next) => {
  if (!ctx.message || !('text' in ctx.message)) return next();
  const text = ctx.message.text;
  const userId = ctx.from.id;
  const user = await ensureUser(userId, ctx.from.username || '', ctx.from.first_name);

  if (text === 'Беларуская 🇧🇾' || text === 'Русский 🇷🇺') {
    const lang = text === 'Беларуская 🇧🇾' ? 'be' : 'ru';
    const userRef = firestore.collection('users').doc(userId.toString());
    await userRef.update({ 
      lang,
      lastActive: admin.firestore.FieldValue.serverTimestamp()
    });
    return ctx.reply(strings[lang].welcome, getKB(lang));
  }

  const lang = (user.lang || 'ru') as 'be' | 'ru';

  if (text === strings[lang].btn_about) {
    return ctx.reply(strings[lang].about, { parse_mode: 'Markdown', ...getKB(lang) });
  }

  if (text === strings[lang].btn_leaders) {
    const snapshot = await firestore.collection('users')
      .orderBy('xp', 'desc')
      .limit(10)
      .get();
    
    if (snapshot.empty) return ctx.reply(strings[lang].no_leaders);

    let msg = strings[lang].leaders;
    snapshot.docs.forEach((doc, i) => {
      const p = doc.data();
      msg += `${i + 1}. ${p.firstName || p.username || 'Anon'} — ✨ Lvl ${p.level} (${p.xp} XP)\n`;
    });
    return ctx.reply(msg, { parse_mode: 'Markdown', ...getKB(lang) });
  }

  if (text === strings[lang].btn_help) {
    return ctx.reply(strings[lang].help, { parse_mode: 'Markdown', ...getKB(lang) });
  }

  if (text === strings[lang].btn_lang) {
    return ctx.reply(strings[lang].select_lang, langKB);
  }

  return next();
});

// Management via Reply logic
bot.on('message', async (ctx) => {
  if (!ctx.message || !('text' in ctx.message)) return;
  const userId = ctx.from.id;
  const user = await ensureUser(userId, ctx.from.username || '', ctx.from.first_name);
  const lang = (user.lang || 'ru') as 'be' | 'ru';

  // If Admin replies to a message
  if (userId.toString() === adminId && ctx.message.reply_to_message) {
    const replyTo = ctx.message.reply_to_message as any;
    const originalUserId = replyTo.forward_from?.id || (replyTo.text?.match(/ID: (\d+)/)?.[1]);
    
    if (originalUserId) {
      try {
        await bot.telegram.sendMessage(originalUserId, `💬 **Администратор:**\n\n${ctx.message.text}`, { parse_mode: 'Markdown' });
        await ctx.reply(strings.ru.admin_reply_success);
        await firestore.collection('logs').add({
          userId: userId.toString(),
          action: 'admin_reply',
          details: JSON.stringify({ to: originalUserId }),
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
      } catch (e) {
        await ctx.reply('❌ Ошибка отправки.');
      }
      return;
    }
  }

  // If regular user sends a message (Feedback)
  if (userId.toString() !== adminId) {
    if (adminId) {
      await bot.telegram.sendMessage(adminId, `📥 **Новое сообщение!**\nОт: ${ctx.from.first_name} (@${ctx.from.username || 'none'})\nID: ${userId}\n\n${ctx.message.text}`);
      await ctx.reply(strings[lang].support_sent);
      await firestore.collection('logs').add({
        userId: userId.toString(),
        action: 'feedback_sent',
        details: JSON.stringify({ text: ctx.message.text }),
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Telegram Webhook route
  app.post('/api/webhook', (req, res) => {
    bot.handleUpdate(req.body, res);
  });

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', mode: 'firestore' });
  });

  // API to get all player results (for Mini App)
  app.get('/api/results', async (req, res) => {
    try {
      console.log(`🔍 Fetching results from DB: ${firebaseConfig.firestoreDatabaseId}`);
      const snapshot = await firestore.collection('users')
        .orderBy('xp', 'desc')
        .limit(50)
        .get();
      const players = snapshot.docs.map(doc => doc.data());
      res.json(players);
    } catch (err: any) {
      console.error('Results error details:', {
        code: err.code,
        message: err.message,
        details: err.details,
        stack: err.stack
      });
      res.status(500).json({ error: 'Database error', details: err.message });
    }
  });

  // API to get specific user data
  app.get('/api/user/:id', async (req, res) => {
    try {
      const userRef = firestore.collection('users').doc(req.params.id);
      const doc = await userRef.get();
      if (!doc.exists) return res.status(404).json({ error: 'User not found' });
      res.json(doc.data());
    } catch (err) {
      console.error('Get user error:', err);
      res.status(500).json({ error: 'Database error' });
    }
  });

  // API to sync user data (called from Mini App)
  app.post('/api/sync', async (req, res) => {
    try {
      const { id, username, firstName, xp, level, lang } = req.body;
      if (!id) return res.status(400).json({ error: 'Missing userId' });

      const userRef = firestore.collection('users').doc(id.toString());
      const doc = await userRef.get();
      
      const updateData: any = {
        lastActive: admin.firestore.FieldValue.serverTimestamp()
      };
      if (username !== undefined) updateData.username = username;
      if (firstName !== undefined) updateData.firstName = firstName;
      if (xp !== undefined) updateData.xp = xp;
      if (level !== undefined) updateData.level = level;
      if (lang !== undefined) updateData.lang = lang;

      if (!doc.exists) {
        updateData.createdAt = admin.firestore.FieldValue.serverTimestamp();
        await userRef.set(updateData);
      } else {
        await userRef.update(updateData);
        
        // Notify level up via bot if level changed
        const oldLevel = doc.data()?.level || 1;
        if (level > oldLevel) {
          const msg = lang === 'be' 
            ? `🎉 Поспех! Вы дасягнулі ўзроўню **${level}**! Так трымаць! 🛡️`
            : `🎉 Успех! Вы достигли уровня **${level}**! Так держать! 🛡️`;
          
          bot.telegram.sendMessage(id, msg, { parse_mode: 'Markdown' }).catch(e => console.error('Notify level error:', e));
        }
      }
      
      res.json({ success: true });
    } catch (err) {
      console.error('Sync error:', err);
      res.status(500).json({ error: 'Database error' });
    }
  });

  // API to send notification via Bot
  app.post('/api/notify', async (req, res) => {
    try {
      const { userId, message } = req.body;
      if (!userId || !message) return res.status(400).json({ error: 'Missing userId or message' });

      await bot.telegram.sendMessage(userId, message, { parse_mode: 'Markdown' });
      res.json({ success: true });
    } catch (err) {
      console.error('Notify error:', err);
      res.status(500).json({ error: 'Failed to send notification' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production' && !process.env.FIREBASE_CONFIG) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // In Firebase, Hosting handles static files, so we don't necessarily need express.static
    // but it's good for local production tests
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

// Export for Firebase Functions
export const api = onRequest({ region: 'us-central1' }, async (req, res) => {
  const app = await startServer();
  return app(req, res);
});

// Start initialization and Local Migration/Server
(async () => {
  console.log('🚀 Initializing Scamlab Backend...');
  
  // Migration Logic from SQLite to Firestore
  const dbPath = path.join(__dirname, 'scamlab.db');
  if (fs.existsSync(dbPath)) {
    console.log('💾 Found legacy SQLite database. Starting migration...');
    const db = new Database(dbPath);
    try {
      const users = db.prepare('SELECT * FROM users').all() as any[];
      console.log(`📊 Found ${users.length} users to migrate.`);
      
      const batch = firestore.batch();
      for (const user of users) {
        const userRef = firestore.collection('users').doc(user.id.toString());
        batch.set(userRef, {
          ...user,
          id: user.id.toString(),
          lastActive: admin.firestore.FieldValue.serverTimestamp(),
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          migrated: true
        }, { merge: true });
      }
      await batch.commit();
      console.log('✅ Migration to Firestore completed.');
      
      // Rename file instead of deleting to be safe
      fs.renameSync(dbPath, dbPath + '.migrated');
    } catch (err) {
      console.error('❌ Migration failed:', err);
    }
  }

  if (botToken) {
    if (appUrl && (process.env.NODE_ENV === 'production' || process.env.FIREBASE_CONFIG)) {
      // Use Webhooks in production
      // For Firebase Functions, update this after you get the function URL
      await bot.telegram.setWebhook(`${appUrl}/api/webhook`);
      console.log(`🤖 Telegram Bot set to Webhook mode: ${appUrl}/api/webhook`);
    } else {
      // Use Long Polling in dev
      bot.launch()
        .then(() => {
          console.log('🤖 Telegram Bot started (Long Polling mode)');
        })
        .catch(err => {
          if (err.response?.error_code === 409) {
            console.error('\n❌ 409 Conflict: Other bot instance is already running!');
          } else {
            console.error('Failed to launch Telegram bot:', err);
          }
        });
    }
    
    // Graceful stop
    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));
  }

  // Only listen if not running as a Cloud Function
  if (!process.env.FIREBASE_CONFIG) {
    const app = await startServer();
    const PORT = 3000;
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Local Server running on http://localhost:${PORT}`);
    });
  }
})();
