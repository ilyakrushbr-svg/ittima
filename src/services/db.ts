
import Database from 'better-sqlite3';
import path from 'path';

export interface User {
  id: string;
  username: string;
  firstName: string;
  lang: string;
  xp: number;
  level: number;
  streak: number;
  maxCombo: number;
  totalCorrect: number;
  totalAnswered: number;
  lastActive: string;
  createdAt: string;
}

class DBService {
  private sqlite: Database.Database;

  constructor() {
    const dbPath = path.join(process.cwd(), 'bot.db');
    this.sqlite = new Database(dbPath);
    this.initSqlite();
    console.log('📦 Database Service: SQLite only (bot.db)');
  }

  private initSqlite() {
    this.sqlite.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT,
        firstName TEXT,
        lang TEXT DEFAULT 'ru',
        xp INTEGER DEFAULT 0,
        level INTEGER DEFAULT 1,
        streak INTEGER DEFAULT 0,
        maxCombo INTEGER DEFAULT 0,
        totalCorrect INTEGER DEFAULT 0,
        totalAnswered INTEGER DEFAULT 0,
        lastActive TEXT,
        createdAt TEXT
      );
      CREATE TABLE IF NOT EXISTS logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId TEXT,
        action TEXT,
        details TEXT,
        timestamp TEXT
      );
      CREATE TABLE IF NOT EXISTS support_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId TEXT,
        role TEXT, -- 'user' or 'admin'
        message TEXT,
        fileId TEXT,
        fileType TEXT, -- 'photo', 'document', etc.
        timestamp TEXT
      );
    `);
  }

  async ensureUser(id: number | string, username: string = '', firstName: string = ''): Promise<User> {
    const sId = id.toString();
    const user = this.sqlite.prepare('SELECT * FROM users WHERE id = ?').get(sId) as User | undefined;
    if (!user) {
      const now = new Date().toISOString();
      const newUser: User = {
        id: sId,
        username: username || '',
        firstName: firstName || '',
        lang: 'ru',
        xp: 0,
        level: 1,
        streak: 0,
        maxCombo: 0,
        totalCorrect: 0,
        totalAnswered: 0,
        lastActive: now,
        createdAt: now
      };
      this.sqlite.prepare(`
        INSERT INTO users (id, username, firstName, lang, xp, level, streak, maxCombo, totalCorrect, totalAnswered, lastActive, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(newUser.id, newUser.username, newUser.firstName, newUser.lang, newUser.xp, newUser.level, newUser.streak, newUser.maxCombo, newUser.totalCorrect, newUser.totalAnswered, newUser.lastActive, newUser.createdAt);
      return newUser;
    }
    return user;
  }

  async addSupportMessage(userId: string, role: 'user' | 'admin', message: string, fileId?: string, fileType?: string) {
    const now = new Date().toISOString();
    this.sqlite.prepare('INSERT INTO support_messages (userId, role, message, fileId, fileType, timestamp) VALUES (?, ?, ?, ?, ?, ?)')
      .run(userId, role, message, fileId || null, fileType || null, now);
  }

  async getSupportHistory(userId: string, limit: number = 20) {
    return this.sqlite.prepare('SELECT * FROM support_messages WHERE userId = ? ORDER BY timestamp DESC LIMIT ?').all(userId, limit).reverse();
  }

  async updateUser(id: number | string, data: Partial<User>) {
    const sId = id.toString();
    const keys = Object.keys(data).filter(k => k !== 'id');
    if (keys.length === 0) return;
    const setClause = keys.map(k => `${k} = ?`).join(', ');
    const values = keys.map(k => (data as any)[k]);
    const now = new Date().toISOString();
    this.sqlite.prepare(`UPDATE users SET ${setClause}, lastActive = ? WHERE id = ?`)
      .run(...values, now, sId);
  }

  async getLeaders(limit: number = 10): Promise<User[]> {
    return this.sqlite.prepare('SELECT * FROM users ORDER BY xp DESC LIMIT ?').all(limit) as User[];
  }

  async addLog(userId: string, action: string, details: string = '') {
    const now = new Date().toISOString();
    this.sqlite.prepare('INSERT INTO logs (userId, action, details, timestamp) VALUES (?, ?, ?, ?)')
      .run(userId, action, details, now);
  }

  getMode() {
    return 'sqlite';
  }

  async getUser(id: string): Promise<User | null> {
    return this.sqlite.prepare('SELECT * FROM users WHERE id = ?').get(id) as User || null;
  }

  async getNews(limit: number = 20): Promise<any[]> {
    return this.sqlite.prepare('SELECT * FROM news ORDER BY createdAt DESC LIMIT ?').all(limit);
  }

  async addNews(news: any) {
    const now = new Date().toISOString();
    return this.sqlite.prepare(`
      INSERT INTO news (title_be, title_ru, content_be, content_ru, imageUrl, telegraphUrl, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(news.title_be, news.title_ru, news.content_be, news.content_ru, news.imageUrl, news.telegraphUrl, now);
  }

  async getAllUsers(): Promise<User[]> {
    return this.sqlite.prepare('SELECT * FROM users').all() as User[];
  }
}

export const dbService = new DBService();

