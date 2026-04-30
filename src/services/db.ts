
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  lastActive: any;
  createdAt: any;
}

class DBService {
  private mode: 'firestore' | 'sqlite' = 'sqlite';
  private firestore: admin.firestore.Firestore | null = null;
  private sqlite: Database.Database | null = null;

  constructor() {
    this.init();
  }

  private init() {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    let hasFirebase = false;

    if (fs.existsSync(configPath)) {
      try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        if (config.projectId && admin.apps.length === 0) {
          admin.initializeApp();
          hasFirebase = true;
        } else if (admin.apps.length > 0) {
          hasFirebase = true;
        }
      } catch (e) {
        console.error('Failed to parse firebase config, falling back to SQLite');
      }
    }

    if (hasFirebase) {
      this.mode = 'firestore';
      // Load config again to get databaseId
      try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        this.firestore = config.firestoreDatabaseId 
          ? getFirestore(config.firestoreDatabaseId)
          : getFirestore();

        // Immediate health check to catch "API not used" or "Permission Denied"
        this.firestore.collection('health_check').doc('ping').get()
          .then(() => console.log('📦 Database Service: Using Firestore'))
          .catch((err) => {
            console.error('❌ Firestore connection failed, falling back to SQLite:', err.message);
            this.switchToSqlite();
          });
      } catch (e) {
        console.error('❌ Firestore initialization error:', e);
        this.switchToSqlite();
      }
    } else {
      this.switchToSqlite();
    }
  }

  private switchToSqlite() {
    this.mode = 'sqlite';
    this.firestore = null;
    const dbPath = path.join(process.cwd(), 'bot.db');
    this.sqlite = new Database(dbPath);
    this.initSqlite();
    console.log('📦 Database Service: Switched to SQLite (bot.db)');
  }

  private initSqlite() {
    if (!this.sqlite) return;
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

  private async safeFirestore<T>(op: (fs: admin.firestore.Firestore) => Promise<T>): Promise<T> {
    if (this.mode === 'firestore' && this.firestore) {
      try {
        return await op(this.firestore);
      } catch (err: any) {
        if (err.message?.includes('Cloud Firestore API has not been used') || 
            err.message?.includes('PERMISSION_DENIED') || 
            err.message?.includes('disabled')) {
          console.error('❌ Firestore error detected, switching to SQLite permanently:', err.message);
          this.switchToSqlite();
          throw new Error('FALLBACK_TO_SQLITE');
        }
        throw err;
      }
    }
    throw new Error('NOT_IN_FIRESTORE_MODE');
  }

  async ensureUser(id: number | string, username: string = '', firstName: string = ''): Promise<User> {
    const sId = id.toString();
    try {
      return await this.safeFirestore(async (fs) => {
        const userRef = fs.collection('users').doc(sId);
        const doc = await userRef.get();
        if (!doc.exists) {
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
            lastActive: admin.firestore.FieldValue.serverTimestamp(),
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          };
          await userRef.set(newUser);
          return newUser;
        }
        return doc.data() as User;
      });
    } catch (err: any) {
      if (this.sqlite) {
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
      throw err;
    }
  }

  async addSupportMessage(userId: string, role: 'user' | 'admin', message: string, fileId?: string, fileType?: string) {
    try {
      await this.safeFirestore(async (fs) => {
        await fs.collection('support_messages').add({
          userId,
          role,
          message,
          fileId: fileId || null,
          fileType: fileType || null,
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
      });
    } catch (err: any) {
      if (this.sqlite) {
        const now = new Date().toISOString();
        this.sqlite.prepare('INSERT INTO support_messages (userId, role, message, fileId, fileType, timestamp) VALUES (?, ?, ?, ?, ?, ?)')
          .run(userId, role, message, fileId || null, fileType || null, now);
      }
    }
  }

  async getSupportHistory(userId: string, limit: number = 20) {
    try {
      return await this.safeFirestore(async (fs) => {
        const snapshot = await fs.collection('support_messages')
          .where('userId', '==', userId)
          .orderBy('timestamp', 'desc')
          .limit(limit)
          .get();
        return snapshot.docs.map(doc => doc.data()).reverse();
      });
    } catch (err: any) {
      if (this.sqlite) {
        return this.sqlite.prepare('SELECT * FROM support_messages WHERE userId = ? ORDER BY timestamp DESC LIMIT ?').all(userId, limit).reverse();
      }
      return [];
    }
  }

  async updateUser(id: number | string, data: Partial<User>) {
    const sId = id.toString();
    try {
      await this.safeFirestore(async (fs) => {
        const userRef = fs.collection('users').doc(sId);
        const updateData = { ...data, lastActive: admin.firestore.FieldValue.serverTimestamp() };
        await userRef.update(updateData);
      });
    } catch (err: any) {
      if (this.sqlite) {
        const keys = Object.keys(data).filter(k => k !== 'id');
        if (keys.length === 0) return;
        const setClause = keys.map(k => `${k} = ?`).join(', ');
        const values = keys.map(k => (data as any)[k]);
        const now = new Date().toISOString();
        this.sqlite.prepare(`UPDATE users SET ${setClause}, lastActive = ? WHERE id = ?`)
          .run(...values, now, sId);
      }
    }
  }

  async getLeaders(limit: number = 10): Promise<User[]> {
    try {
      return await this.safeFirestore(async (fs) => {
        const snapshot = await fs.collection('users')
          .orderBy('xp', 'desc')
          .limit(limit)
          .get();
        return snapshot.docs.map(doc => doc.data() as User);
      });
    } catch (err: any) {
      if (this.sqlite) {
        return this.sqlite.prepare('SELECT * FROM users ORDER BY xp DESC LIMIT ?').all(limit) as User[];
      }
      return [];
    }
  }

  async addLog(userId: string, action: string, details: string = '') {
    try {
      await this.safeFirestore(async (fs) => {
        await fs.collection('logs').add({
          userId,
          action,
          details,
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
      });
    } catch (err: any) {
      if (this.sqlite) {
        const now = new Date().toISOString();
        this.sqlite.prepare('INSERT INTO logs (userId, action, details, timestamp) VALUES (?, ?, ?, ?)')
          .run(userId, action, details, now);
      }
    }
  }

  getMode() {
    return this.mode;
  }

  async getUser(id: string): Promise<User | null> {
    try {
      return await this.safeFirestore(async (fs) => {
        const doc = await fs.collection('users').doc(id).get();
        return doc.exists ? doc.data() as User : null;
      });
    } catch (err: any) {
      if (this.sqlite) {
        return this.sqlite.prepare('SELECT * FROM users WHERE id = ?').get(id) as User || null;
      }
      return null;
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      return await this.safeFirestore(async (fs) => {
        const snapshot = await fs.collection('users').get();
        return snapshot.docs.map(doc => doc.data() as User);
      });
    } catch (err: any) {
      if (this.sqlite) {
        return this.sqlite.prepare('SELECT * FROM users').all() as User[];
      }
      return [];
    }
  }
}

export const dbService = new DBService();
