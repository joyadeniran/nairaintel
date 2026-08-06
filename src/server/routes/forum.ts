import { Router, Response } from "express";
import { db, dbFirestore } from "../db.js";
import admin from "firebase-admin";
import { requireAuth, optionalAuth, AuthedRequest } from "../middleware/auth.js";

const router = Router();

const ALLOWED_CATEGORIES = new Set([
  "Stock Analysis",
  "Investment Strategies",
  "Fixed Income",
  "Market Rumours",
  "Personal Finance",
  "Beginner Questions",
  "Portfolio Reviews",
]);

const MAX_TITLE = 200;
const MAX_CONTENT = 10000;
const MAX_LIMIT = 50;

function clampLimit(raw: unknown): number {
  const n = parseInt(String(raw ?? "5"), 10);
  if (Number.isNaN(n) || n < 1) return 5;
  return Math.min(n, MAX_LIMIT);
}

function clampPage(raw: unknown): number {
  const n = parseInt(String(raw ?? "1"), 10);
  if (Number.isNaN(n) || n < 1) return 1;
  return n;
}

// ---------- Public / optional-auth reads ----------

router.get("/", optionalAuth, async (req: AuthedRequest, res: Response) => {
  const page = clampPage(req.query.page);
  const limit = clampLimit(req.query.limit);
  const category = String(req.query.category || "All");
  const search = String(req.query.search || "").trim().slice(0, 100);

  if (dbFirestore) {
    try {
      let query: admin.firestore.Query = dbFirestore.collection("forum_posts");
      if (category && category !== "All") {
        query = query.where("category", "==", category);
      }

      const snapshot = await query.orderBy("created_at", "desc").limit(200).get();

      let docs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      if (search) {
        const s = search.toLowerCase();
        docs = docs.filter(
          (p: any) =>
            p.title?.toLowerCase().includes(s) ||
            p.content?.toLowerCase().includes(s) ||
            p.username?.toLowerCase().includes(s)
        );
      }

      const totalCount = docs.length;
      const offset = (page - 1) * limit;
      const posts = docs.slice(offset, offset + limit);

      return res.json({
        posts,
        total: totalCount,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(totalCount / limit)),
      });
    } catch (error) {
      console.error("Firestore forum list error:", error);
      return res.status(500).json({ error: "Failed to load posts" });
    }
  }

  // SQLite read-only fallback for local dev
  try {
    const offset = (page - 1) * limit;
    let query = `SELECT forum_posts.*, users.username FROM forum_posts LEFT JOIN users ON forum_posts.user_id = users.id`;
    let countQuery = `SELECT COUNT(*) as total FROM forum_posts LEFT JOIN users ON forum_posts.user_id = users.id`;
    const params: any[] = [];
    const where: string[] = [];

    if (category && category !== "All") {
      where.push(`category = ?`);
      params.push(category);
    }
    if (search) {
      where.push(`(title LIKE ? OR content LIKE ? OR users.username LIKE ?)`);
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (where.length) {
      const w = ` WHERE ${where.join(" AND ")}`;
      query += w;
      countQuery += w;
    }
    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;

    const posts = db.prepare(query).all(...params, limit, offset);
    const totalCount = (db.prepare(countQuery).get(...params) as any).total;

    return res.json({
      posts: (posts as any[]).map((p) => ({
        ...p,
        likes: safeParseLikes(p.likes),
      })),
      total: totalCount,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(totalCount / limit)),
    });
  } catch (error) {
    console.error("SQLite forum list error:", error);
    return res.json({ posts: [], total: 0, page, limit, totalPages: 1 });
  }
});

router.get("/trending", optionalAuth, async (_req: AuthedRequest, res: Response) => {
  if (dbFirestore) {
    try {
      const snapshot = await dbFirestore
        .collection("forum_posts")
        .orderBy("created_at", "desc")
        .limit(20)
        .get();

      const posts = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .sort((a: any, b: any) => {
          const aScore = (a.likes?.length || 0) + (a.comment_count || 0);
          const bScore = (b.likes?.length || 0) + (b.comment_count || 0);
          return bScore - aScore;
        })
        .slice(0, 5);

      return res.json(posts);
    } catch (error) {
      console.error("Firestore trending error:", error);
    }
  }
  return res.json([]);
});

router.get("/:postId/comments", optionalAuth, async (req: AuthedRequest, res: Response) => {
  const { postId } = req.params;
  if (!postId) return res.status(400).json({ error: "Missing postId" });

  if (dbFirestore) {
    try {
      const snapshot = await dbFirestore
        .collection("forum_comments")
        .where("post_id", "==", postId)
        .orderBy("created_at", "asc")
        .limit(200)
        .get();

      const comments = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      return res.json(comments);
    } catch (error) {
      console.error("Firestore comments error:", error);
      return res.status(500).json({ error: "Failed to load comments" });
    }
  }

  try {
    const comments = db
      .prepare(
        `SELECT forum_comments.*, users.username FROM forum_comments
         LEFT JOIN users ON forum_comments.user_id = users.id
         WHERE post_id = ? ORDER BY created_at ASC LIMIT 200`
      )
      .all(postId);
    return res.json(
      (comments as any[]).map((c) => ({ ...c, likes: safeParseLikes(c.likes) }))
    );
  } catch {
    return res.json([]);
  }
});

// ---------- Authenticated mutations ----------

router.post("/", requireAuth, async (req: AuthedRequest, res: Response) => {
  const uid = req.user!.uid;
  const { category, title, content } = req.body || {};
  const username =
    req.user!.name ||
    req.user!.email?.split("@")[0] ||
    "investor";

  if (!title || !content) {
    return res.status(400).json({ error: "title and content are required" });
  }
  if (!ALLOWED_CATEGORIES.has(category)) {
    return res.status(400).json({ error: "Invalid category" });
  }
  const cleanTitle = String(title).trim().slice(0, MAX_TITLE);
  const cleanContent = String(content).trim().slice(0, MAX_CONTENT);
  if (!cleanTitle || !cleanContent) {
    return res.status(400).json({ error: "title and content cannot be empty" });
  }

  if (!dbFirestore) {
    return res.status(503).json({ error: "Forum writes require Firestore configuration" });
  }

  try {
    const docRef = await dbFirestore.collection("forum_posts").add({
      category,
      title: cleanTitle,
      content: cleanContent,
      username,
      user_id: uid,
      likes: [],
      comment_count: 0,
      created_at: new Date().toISOString(),
    });
    return res.status(201).json({ id: docRef.id });
  } catch (error) {
    console.error("Forum create error:", error);
    return res.status(500).json({ error: "Failed to create post" });
  }
});

router.put("/:id", requireAuth, async (req: AuthedRequest, res: Response) => {
  const uid = req.user!.uid;
  const { id } = req.params;
  const { title, content, category } = req.body || {};

  if (!dbFirestore) {
    return res.status(503).json({ error: "Forum writes require Firestore configuration" });
  }

  try {
    const docRef = dbFirestore.collection("forum_posts").doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ error: "Post not found" });
    if (doc.data()?.user_id !== uid) return res.status(403).json({ error: "Forbidden" });

    const updates: Record<string, unknown> = {};
    if (title !== undefined) updates.title = String(title).trim().slice(0, MAX_TITLE);
    if (content !== undefined) updates.content = String(content).trim().slice(0, MAX_CONTENT);
    if (category !== undefined) {
      if (!ALLOWED_CATEGORIES.has(category)) {
        return res.status(400).json({ error: "Invalid category" });
      }
      updates.category = category;
    }

    await docRef.update(updates);
    return res.json({ success: true });
  } catch (error) {
    console.error("Forum update error:", error);
    return res.status(500).json({ error: "Failed to update post" });
  }
});

router.delete("/:id", requireAuth, async (req: AuthedRequest, res: Response) => {
  const uid = req.user!.uid;
  const { id } = req.params;

  if (!dbFirestore) {
    return res.status(503).json({ error: "Forum writes require Firestore configuration" });
  }

  try {
    const docRef = dbFirestore.collection("forum_posts").doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ error: "Post not found" });
    if (doc.data()?.user_id !== uid) return res.status(403).json({ error: "Forbidden" });

    await docRef.delete();
    return res.json({ success: true });
  } catch (error) {
    console.error("Forum delete error:", error);
    return res.status(500).json({ error: "Failed to delete post" });
  }
});

router.post("/:id/like", requireAuth, async (req: AuthedRequest, res: Response) => {
  const uid = req.user!.uid;
  const { id } = req.params;

  if (!dbFirestore) {
    return res.status(503).json({ error: "Forum writes require Firestore configuration" });
  }

  try {
    const docRef = dbFirestore.collection("forum_posts").doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ error: "Post not found" });

    const data = doc.data();
    const likes: string[] = Array.isArray(data?.likes) ? [...data.likes] : [];
    const index = likes.indexOf(uid);
    if (index === -1) likes.push(uid);
    else likes.splice(index, 1);

    await docRef.update({ likes });
    return res.json({ likes: likes.length, liked: index === -1 });
  } catch (error) {
    console.error("Forum like error:", error);
    return res.status(500).json({ error: "Failed to like post" });
  }
});

router.post("/:postId/comments", requireAuth, async (req: AuthedRequest, res: Response) => {
  const uid = req.user!.uid;
  const { postId } = req.params;
  const { content, quoted_comment } = req.body || {};
  const username =
    req.user!.name ||
    req.user!.email?.split("@")[0] ||
    "investor";

  const clean = String(content || "").trim().slice(0, MAX_CONTENT);
  if (!clean) return res.status(400).json({ error: "content is required" });

  if (!dbFirestore) {
    return res.status(503).json({ error: "Forum writes require Firestore configuration" });
  }

  try {
    const commentRef = await dbFirestore.collection("forum_comments").add({
      post_id: postId,
      user_id: uid,
      username,
      content: clean,
      quoted_comment: quoted_comment ? String(quoted_comment).slice(0, 2000) : null,
      likes: [],
      created_at: new Date().toISOString(),
    });

    const postRef = dbFirestore.collection("forum_posts").doc(postId);
    const post = await postRef.get();
    if (post.exists) {
      const currentCount = post.data()?.comment_count || 0;
      await postRef.update({ comment_count: currentCount + 1 });
    }

    return res.status(201).json({ id: commentRef.id });
  } catch (error) {
    console.error("Comment create error:", error);
    return res.status(500).json({ error: "Failed to create comment" });
  }
});

router.put("/comments/:commentId", requireAuth, async (req: AuthedRequest, res: Response) => {
  const uid = req.user!.uid;
  const { commentId } = req.params;
  const { content } = req.body || {};
  const clean = String(content || "").trim().slice(0, MAX_CONTENT);
  if (!clean) return res.status(400).json({ error: "content is required" });

  if (!dbFirestore) {
    return res.status(503).json({ error: "Forum writes require Firestore configuration" });
  }

  try {
    const docRef = dbFirestore.collection("forum_comments").doc(commentId);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ error: "Comment not found" });
    if (doc.data()?.user_id !== uid) return res.status(403).json({ error: "Forbidden" });

    await docRef.update({ content: clean });
    return res.json({ success: true });
  } catch (error) {
    console.error("Comment update error:", error);
    return res.status(500).json({ error: "Failed to update comment" });
  }
});

router.delete("/comments/:commentId", requireAuth, async (req: AuthedRequest, res: Response) => {
  const uid = req.user!.uid;
  const { commentId } = req.params;
  const post_id = req.query.post_id as string | undefined;

  if (!dbFirestore) {
    return res.status(503).json({ error: "Forum writes require Firestore configuration" });
  }

  try {
    const docRef = dbFirestore.collection("forum_comments").doc(commentId);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ error: "Comment not found" });
    if (doc.data()?.user_id !== uid) return res.status(403).json({ error: "Forbidden" });

    await docRef.delete();

    if (post_id) {
      const postRef = dbFirestore.collection("forum_posts").doc(post_id);
      const post = await postRef.get();
      if (post.exists) {
        const currentCount = post.data()?.comment_count || 0;
        await postRef.update({ comment_count: Math.max(0, currentCount - 1) });
      }
    }

    return res.json({ success: true });
  } catch (error) {
    console.error("Comment delete error:", error);
    return res.status(500).json({ error: "Failed to delete comment" });
  }
});

function safeParseLikes(raw: unknown): string[] {
  try {
    if (Array.isArray(raw)) return raw;
    if (typeof raw === "string") return JSON.parse(raw || "[]");
  } catch {
    /* ignore */
  }
  return [];
}

export default router;
