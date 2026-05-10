import Database from "better-sqlite3";
const db = new Database("nairaintel.db");
try {
  const schema = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='forum_posts'").get();
  console.log("SCHEMA:", schema);
  const cols = db.prepare("PRAGMA table_info(forum_posts)").all();
  console.log("COLS:", JSON.stringify(cols, null, 2));
} catch (e) {
  console.error("ERROR:", e);
}
db.close();
