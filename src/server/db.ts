import admin from "firebase-admin";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Detect serverless (Vercel, etc.) — avoid native SQLite there
const isServerless =
  !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.FUNCTION_NAME);

// ---------- Firebase Admin (required for production auth + Firestore) ----------
let dbFirestore: admin.firestore.Firestore | null = null;

try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }
    dbFirestore = admin.firestore();
    console.log("Firebase Admin initialized");
  } else {
    console.warn("FIREBASE_SERVICE_ACCOUNT_KEY not set — auth and Firestore writes will fail");
  }
} catch (error) {
  console.error("Error initializing Firebase Admin:", error);
}

// ---------- SQLite (local dev only) ----------
let db: any = null;

if (!isServerless) {
  try {
    // Dynamic import path kept simple for tsx local runs
    const Database = (await import("better-sqlite3")).default;
    const dbPath = path.resolve(process.cwd(), "nairaintel.db");
    db = new Database(dbPath);

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
        type TEXT,
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
        likes TEXT DEFAULT '[]',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS forum_comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id INTEGER,
        user_id INTEGER,
        content TEXT,
        quoted_comment TEXT,
        likes TEXT DEFAULT '[]',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(post_id) REFERENCES forum_posts(id),
        FOREIGN KEY(user_id) REFERENCES users(id)
      );

      CREATE INDEX IF NOT EXISTS idx_investments_user_id ON investments(user_id);
      CREATE INDEX IF NOT EXISTS idx_forum_posts_user_id ON forum_posts(user_id);
      CREATE INDEX IF NOT EXISTS idx_forum_comments_post_id ON forum_comments(post_id);
    `);

    try {
      db.exec("ALTER TABLE forum_posts ADD COLUMN likes TEXT DEFAULT '[]'");
    } catch {
      /* already exists */
    }
    try {
      db.exec("ALTER TABLE forum_comments ADD COLUMN likes TEXT DEFAULT '[]'");
    } catch {
      /* already exists */
    }

    const userCount = (db.prepare("SELECT COUNT(*) as count FROM users").get() as any).count;
    if (userCount === 0) {
      db.prepare("INSERT INTO users (id, username, email) VALUES (?, ?, ?)").run(
        1,
        "investor_naija",
        "demo@nairaintel.com"
      );
    }

    console.log("SQLite ready at", dbPath);
  } catch (err: any) {
    console.warn("SQLite unavailable (ok on serverless):", err?.message || err);
    db = null;
  }
} else {
  console.log("Serverless environment detected — SQLite disabled, using Firestore only");
}

// Minimal stub so routes that call db.prepare don't crash if SQLite is absent
if (!db) {
  db = {
    prepare: () => ({
      get: () => null,
      all: () => [],
      run: () => ({ lastInsertRowid: 0 }),
    }),
    exec: () => {},
  };
}

export { db, dbFirestore };
