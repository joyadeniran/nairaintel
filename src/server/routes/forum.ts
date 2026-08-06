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

function safeParseLikes(raw: unknown): string[] {
  try {
    if (Array.isArray(raw)) return raw as string[];
    if (typeof raw === "string") return JSON.parse(raw || "[]");
  } catch {
    /* ignore */
  }
  return [];
}

// ---------- Public reads ----------

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

      // Avoid composite-index requirement when filtering: fetch then sort in memory if needed
      let snapshot;
      try {
        snapshot = await query.orderBy("created_at", "desc").limit(200).get();
      } catch (indexErr) {
        console.warn("Forum list orderBy failed, falling back:", (indexErr as any)?.message);
        snapshot = await query.limit(200).get();
      }

      let docs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      docs.sort((a: any, b: any) => String(b.created_at || "").localeCompare(String(a.created_at || "")));

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

  return res.json({ posts: [], total: 0, page, limit, totalPages: 1 });
});

router.get("/trending", optionalAuth, async (_req: AuthedRequest, res: Response) => {
  if (dbFirestore) {
    try {
      let snapshot;
      try {
        snapshot = await dbFirestore.collection("forum_posts").orderBy("created_at", "desc").limit(20).get();
      } catch {
        snapshot = await dbFirestore.collection("forum_posts").limit(20).get();
      }

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
      // IMPORTANT: no orderBy here — avoids composite index requirement
      // (where post_id + orderBy created_at needs a console index)
      const snapshot = await dbFirestore
        .collection("forum_comments")
        .where("post_id", "==", postId)
        .limit(200)
        .get();

      const comments = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .sort((a: any, b: any) => String(a.created_at || "").localeCompare(String(b.created_at || "")));

      return res.json(comments);
    } catch (error: any) {
      console.error("Firestore comments error:", error?.message || error);
      return res.status(500).json({
        error: "Failed to load comments",
        detail: error?.message || String(error),
      });
    }
  }

  return res.json([]);
});

// ---------- Authenticated mutations ----------

router.post("/", requireAuth, async (req: AuthedRequest, res: Response) => {
  const uid = req.user!.uid;
  const { category, title, content } = req.body || {};
  const username = req.user!.name || req.user!.email?.split("@")[0] || "investor";

  if (!title || !content) return res.status(400).json({ error: "title and content are required" });
  if (!ALLOWED_CATEGORIES.has(category)) return res.status(400).json({ error: "Invalid category" });

  const cleanTitle = String(title).trim().slice(0, MAX_TITLE);
  const cleanContent = String(content).trim().slice(0, MAX_CONTENT);
  if (!cleanTitle || !cleanContent) return res.status(400).json({ error: "title and content cannot be empty" });

  if (!dbFirestore) {
    return res.status(503).json({ error: "Forum writes require Firestore (FIREBASE_SERVICE_ACCOUNT_KEY)" });
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
  } catch (error: any) {
    console.error("Forum create error:", error);
    return res.status(500).json({ error: "Failed to create post", detail: error?.message });
  }
});

router.put("/:id", requireAuth, async (req: AuthedRequest, res: Response) => {
  const uid = req.user!.uid;
  const { id } = req.params;
  const { title, content, category } = req.body || {};

  if (!dbFirestore) return res.status(503).json({ error: "Forum writes require Firestore" });

  try {
    const docRef = dbFirestore.collection("forum_posts").doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ error: "Post not found" });
    if (doc.data()?.user_id !== uid) return res.status(403).json({ error: "Forbidden" });

    const updates: Record<string, unknown> = {};
    if (title !== undefined) updates.title = String(title).trim().slice(0, MAX_TITLE);
    if (content !== undefined) updates.content = String(content).trim().slice(0, MAX_CONTENT);
    if (category !== undefined) {
      if (!ALLOWED_CATEGORIES.has(category)) return res.status(400).json({ error: "Invalid category" });
      updates.category = category;
    }

    await docRef.update(updates);
    return res.json({ success: true });
  } catch (error: any) {
    console.error("Forum update error:", error);
    return res.status(500).json({ error: "Failed to update post", detail: error?.message });
  }
});

router.delete("/:id", requireAuth, async (req: AuthedRequest, res: Response) => {
  const uid = req.user!.uid;
  const { id } = req.params;

  if (!dbFirestore) return res.status(503).json({ error: "Forum writes require Firestore" });

  try {
    const docRef = dbFirestore.collection("forum_posts").doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ error: "Post not found" });
    if (doc.data()?.user_id !== uid) return res.status(403).json({ error: "Forbidden" });
    await docRef.delete();
    return res.json({ success: true });
  } catch (error: any) {
    console.error("Forum delete error:", error);
    return res.status(500).json({ error: "Failed to delete post", detail: error?.message });
  }
});

router.post("/:id/like", requireAuth, async (req: AuthedRequest, res: Response) => {
  const uid = req.user!.uid;
  const { id } = req.params;

  if (!dbFirestore) return res.status(503).json({ error: "Forum writes require Firestore" });

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
  } catch (error: any) {
    console.error("Forum like error:", error);
    return res.status(500).json({ error: "Failed to like post", detail: error?.message });
  }
});

router.post("/:postId/comments", requireAuth, async (req: AuthedRequest, res: Response) => {
  const uid = req.user!.uid;
  const { postId } = req.params;
  const { content, quoted_comment } = req.body || {};
  const username = req.user!.name || req.user!.email?.split("@")[0] || "investor";

  const clean = String(content || "").trim().slice(0, MAX_CONTENT);
  if (!clean) return res.status(400).json({ error: "content is required" });

  if (!dbFirestore) {
    return res.status(503).json({
      error: "Forum writes require Firestore",
      hint: "Set FIREBASE_SERVICE_ACCOUNT_KEY on Vercel and redeploy",
    });
  }

  try {
    const created_at = new Date().toISOString();
    const payload = {
      post_id: postId,
      user_id: uid,
      username,
      content: clean,
      quoted_comment: quoted_comment ? String(quoted_comment).slice(0, 2000) : null,
      likes: [] as string[],
      created_at,
    };

    const commentRef = await dbFirestore.collection("forum_comments").add(payload);

    try {
      const postRef = dbFirestore.collection("forum_posts").doc(postId);
      const post = await postRef.get();
      if (post.exists) {
        const currentCount = post.data()?.comment_count || 0;
        await postRef.update({ comment_count: currentCount + 1 });
      }
    } catch (countErr) {
      console.warn("comment_count update failed (non-fatal):", countErr);
    }

    // Return full comment so UI can append optimistically even if reload fails
    return res.status(201).json({ id: commentRef.id, ...payload });
  } catch (error: any) {
    console.error("Comment create error:", error);
    return res.status(500).json({ error: "Failed to create comment", detail: error?.message });
  }
});

router.put("/comments/:commentId", requireAuth, async (req: AuthedRequest, res: Response) => {
  const uid = req.user!.uid;
  const { commentId } = req.params;
  const { content } = req.body || {};
  const clean = String(content || "").trim().slice(0, MAX_CONTENT);
  if (!clean) return res.status(400).json({ error: "content is required" });
  if (!dbFirestore) return res.status(503).json({ error: "Forum writes require Firestore" });

  try {
    const docRef = dbFirestore.collection("forum_comments").doc(commentId);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ error: "Comment not found" });
    if (doc.data()?.user_id !== uid) return res.status(403).json({ error: "Forbidden" });
    await docRef.update({ content: clean });
    return res.json({ success: true });
  } catch (error: any) {
    console.error("Comment update error:", error);
    return res.status(500).json({ error: "Failed to update comment", detail: error?.message });
  }
});

router.delete("/comments/:commentId", requireAuth, async (req: AuthedRequest, res: Response) => {
  const uid = req.user!.uid;
  const { commentId } = req.params;
  const post_id = req.query.post_id as string | undefined;
  if (!dbFirestore) return res.status(503).json({ error: "Forum writes require Firestore" });

  try {
    const docRef = dbFirestore.collection("forum_comments").doc(commentId);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ error: "Comment not found" });
    if (doc.data()?.user_id !== uid) return res.status(403).json({ error: "Forbidden" });
    await docRef.delete();

    if (post_id) {
      try {
        const postRef = dbFirestore.collection("forum_posts").doc(post_id);
        const post = await postRef.get();
        if (post.exists) {
          const currentCount = post.data()?.comment_count || 0;
          await postRef.update({ comment_count: Math.max(0, currentCount - 1) });
        }
      } catch {
        /* non-fatal */
      }
    }

    return res.json({ success: true });
  } catch (error: any) {
    console.error("Comment delete error:", error);
    return res.status(500).json({ error: "Failed to delete comment", detail: error?.message });
  }
});

export default router;
