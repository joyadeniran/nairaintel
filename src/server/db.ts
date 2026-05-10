import Database from "better-sqlite3";
import admin from "firebase-admin";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin
let dbFirestore: admin.firestore.Firestore | null = null;
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    }
    dbFirestore = admin.firestore();
    console.log("Firebase Admin initialized successfully");
  }
} catch (error) {
  console.error("Error initializing Firebase Admin:", error);
}

const db = new Database("nairaintel.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    email TEXT UNIQUE,
    password TEXT
  );

  CREATE TABLE IF NOT EXISTS investments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    type TEXT, -- 'stock' or 'tbill'
    symbol TEXT,
    name TEXT,
    entry_price REAL,
    quantity INTEGER,
    date_acquired TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS forum_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    category TEXT,
    title TEXT,
    content TEXT,
    likes TEXT DEFAULT '[]', -- JSON array of user IDs
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS forum_comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER,
    user_id INTEGER,
    content TEXT,
    quoted_comment TEXT,
    likes TEXT DEFAULT '[]', -- JSON array of user IDs
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(post_id) REFERENCES forum_posts(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  -- Optimization: Add indexes
  CREATE INDEX IF NOT EXISTS idx_investments_user_id ON investments(user_id);
  CREATE INDEX IF NOT EXISTS idx_forum_posts_user_id ON forum_posts(user_id);
  CREATE INDEX IF NOT EXISTS idx_forum_comments_post_id ON forum_comments(post_id);
`);

// Migration: Add likes column if missing
try {
  db.exec("ALTER TABLE forum_posts ADD COLUMN likes TEXT DEFAULT '[]'");
} catch (e) {}
try {
  db.exec("ALTER TABLE forum_comments ADD COLUMN likes TEXT DEFAULT '[]'");
} catch (e) {}

// Seed mock user if empty
const userCount = (db.prepare("SELECT COUNT(*) as count FROM users").get() as any).count;
if (userCount === 0) {
  db.prepare("INSERT INTO users (id, username, email) VALUES (?, ?, ?)").run(1, 'investor_naija', 'demo@nairaintel.com');
}

export { db, dbFirestore };
