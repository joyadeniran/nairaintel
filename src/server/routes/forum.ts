import { Router } from "express";
import { db, dbFirestore } from "../db.js";
import admin from "firebase-admin";

const router = Router();
const userId = 1; // Mock user

router.get("/", async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 5;
  const category = req.query.category as string;
  const search = req.query.search as string;

  if (dbFirestore) {
    try {
      let query: admin.firestore.Query = dbFirestore.collection("forum_posts");
      if (category && category !== 'All') {
        query = query.where("category", "==", category);
      }
      
      let snapshot = await query.orderBy("created_at", "desc").get();

      if (snapshot.empty && !category && !search) {
        const batch = dbFirestore.batch();
        const demoPosts = [
          { user_id: 'system', username: 'investor_naija', category: 'Stock Talk', title: 'Is Dangote Cement undervalued at current price?', content: 'Community discussion about Dangote Cement valuation.', created_at: new Date().toISOString(), likes: [], comment_count: 0 },
          { user_id: 'system', username: 'investor_naija', category: 'Investment Strategies', title: 'Best long term dividend stocks in Nigeria?', content: 'Looking for recommendations for dividend growth.', created_at: new Date().toISOString(), likes: [], comment_count: 0 }
        ];
        for (const post of demoPosts) {
          batch.set(dbFirestore.collection("forum_posts").doc(), post);
        }
        await batch.commit();
        snapshot = await query.orderBy("created_at", "desc").get();
      }

      let docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      if (search) {
        const s = search.toLowerCase();
        docs = docs.filter((p: any) => 
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
        totalPages: Math.ceil(totalCount / limit)
      });
    } catch (error) {
      console.error("Firestore error:", error);
    }
  }

  // SQLite Fallback
  const offset = (page - 1) * limit;
  let query = `
    SELECT forum_posts.*, users.username 
    FROM forum_posts 
    LEFT JOIN users ON forum_posts.user_id = users.id 
  `;
  let countQuery = `
    SELECT COUNT(*) as total 
    FROM forum_posts
    LEFT JOIN users ON forum_posts.user_id = users.id
  `;
  const params: any[] = [];

  let whereClauses = [];
  if (category && category !== 'All') {
    whereClauses.push(`category = ?`);
    params.push(category);
  }
  if (search) {
    whereClauses.push(`(title LIKE ? OR content LIKE ? OR users.username LIKE ?)`);
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  if (whereClauses.length > 0) {
    const whereStr = ` WHERE ` + whereClauses.join(' AND ');
    query += whereStr;
    countQuery += whereStr;
  }

  query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
  
  const posts = db.prepare(query).all(...params, limit, offset);
  const totalCount = (db.prepare(countQuery).get(...params) as any).total;

  res.json({
    posts: (posts as any[]).map(p => ({
      ...p,
      likes: JSON.parse(p.likes || '[]')
    })),
    total: totalCount,
    page,
    limit,
    totalPages: Math.ceil(totalCount / limit)
  });
});

router.post("/", async (req, res) => {
  const { category, title, content, username, user_id } = req.body;
  
  if (dbFirestore) {
    try {
      const docRef = await dbFirestore.collection("forum_posts").add({
        category,
        title,
        content,
        username,
        user_id,
        created_at: new Date().toISOString()
      });
      return res.json({ id: docRef.id });
    } catch (error) {
      console.error("Firestore error:", error);
    }
  }

  const targetUserId = user_id || userId;
  const result = db.prepare(
    "INSERT INTO forum_posts (user_id, category, title, content, likes) VALUES (?, ?, ?, ?, ?)"
  ).run(targetUserId, category, title, content, JSON.stringify([]));
  res.json({ id: result.lastInsertRowid });
});

router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { title, content, category, user_id } = req.body;

  if (dbFirestore) {
    try {
      const docRef = dbFirestore.collection("forum_posts").doc(id);
      const doc = await docRef.get();
      if (!doc.exists) return res.status(404).json({ error: "Post not found" });
      if (doc.data()?.user_id !== user_id) return res.status(403).json({ error: "Unauthorized" });

      await docRef.update({ title, content, category });
      return res.json({ success: true });
    } catch (error) {
      console.error("Firestore error:", error);
    }
  }

  const targetUserId = user_id || userId;
  db.prepare("UPDATE forum_posts SET title = ?, content = ?, category = ? WHERE id = ? AND user_id = ?")
    .run(title, content, category, id, targetUserId);
  res.json({ success: true });
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const { user_id } = req.query;

  if (dbFirestore) {
    try {
      const docRef = dbFirestore.collection("forum_posts").doc(id);
      const doc = await docRef.get();
      if (!doc.exists) return res.status(404).json({ error: "Post not found" });
      if (doc.data()?.user_id !== user_id) return res.status(403).json({ error: "Unauthorized" });

      await docRef.delete();
      return res.json({ success: true });
    } catch (error) {
      console.error("Firestore error:", error);
    }
  }

  const targetUserId = user_id || userId;
  db.prepare("DELETE FROM forum_posts WHERE id = ? AND user_id = ?").run(id, targetUserId);
  res.json({ success: true });
});

router.post("/:id/like", async (req, res) => {
  const { id } = req.params;
  const { user_id } = req.body;

  if (dbFirestore) {
    try {
      const docRef = dbFirestore.collection("forum_posts").doc(id);
      const doc = await docRef.get();
      if (!doc.exists) return res.status(404).json({ error: "Post not found" });

      const data = doc.data();
      const likes = data?.likes || [];
      const index = likes.indexOf(user_id);

      if (index === -1) {
        likes.push(user_id);
      } else {
        likes.splice(index, 1);
      }

      await docRef.update({ likes });
      return res.json({ likes: likes.length, liked: index === -1 });
    } catch (error) {
      console.error("Firestore error:", error);
    }
  }

  // SQLite Fallback
  const post = db.prepare("SELECT likes FROM forum_posts WHERE id = ?").get(id) as any;
  if (!post) return res.status(404).json({ error: "Post not found" });

  let likes = JSON.parse(post.likes || '[]');
  const index = likes.indexOf(user_id);

  if (index === -1) {
    likes.push(user_id);
  } else {
    likes.splice(index, 1);
  }

  db.prepare("UPDATE forum_posts SET likes = ? WHERE id = ?")
    .run(JSON.stringify(likes), id);

  res.json({ likes: likes.length, liked: index === -1 });
});

router.get("/trending", async (req, res) => {
  if (dbFirestore) {
    try {
      const snapshot = await dbFirestore.collection("forum_posts")
        .orderBy("created_at", "desc")
        .limit(20)
        .get();
      
      const posts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).sort((a: any, b: any) => {
        const aScore = (a.likes?.length || 0) + (a.comment_count || 0);
        const bScore = (b.likes?.length || 0) + (b.comment_count || 0);
        return bScore - aScore;
      }).slice(0, 5);

      return res.json(posts);
    } catch (error) {
      console.error("Firestore error:", error);
    }
  }
  res.json([]);
});

router.get("/:postId/comments", async (req, res) => {
  const { postId } = req.params;

  if (dbFirestore) {
    try {
      const snapshot = await dbFirestore.collection("forum_comments")
        .where("post_id", "==", postId)
        .orderBy("created_at", "asc")
        .get();
      
      const comments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      return res.json(comments);
    } catch (error) {
      console.error("Firestore error:", error);
    }
  }

  const comments = db.prepare(`
    SELECT forum_comments.*, users.username 
    FROM forum_comments 
    LEFT JOIN users ON forum_comments.user_id = users.id 
    WHERE post_id = ?
    ORDER BY created_at ASC
  `).all(postId);
  res.json((comments as any[]).map(c => ({
    ...c,
    likes: JSON.parse(c.likes || '[]')
  })));
});

router.post("/:postId/comments", async (req, res) => {
  const { content, username, user_id, quoted_comment } = req.body;
  const { postId } = req.params;

  if (dbFirestore) {
    try {
      const commentRef = await dbFirestore.collection("forum_comments").add({
        post_id: postId,
        user_id,
        username,
        content,
        quoted_comment: quoted_comment || null,
        created_at: new Date().toISOString()
      });

      const postRef = dbFirestore.collection("forum_posts").doc(postId);
      const post = await postRef.get();
      if (post.exists) {
        const currentCount = post.data()?.comment_count || 0;
        await postRef.update({ comment_count: currentCount + 1 });
      }

      return res.json({ id: commentRef.id });
    } catch (error) {
      console.error("Firestore error:", error);
    }
  }

  const result = db.prepare(
    "INSERT INTO forum_comments (post_id, user_id, content, quoted_comment) VALUES (?, ?, ?, ?)"
  ).run(postId, userId, content, quoted_comment);
  res.json({ id: result.lastInsertRowid });
});

router.put("/comments/:commentId", async (req, res) => {
  const { commentId } = req.params;
  const { content, user_id } = req.body;

  if (dbFirestore) {
    try {
      const docRef = dbFirestore.collection("forum_comments").doc(commentId);
      const doc = await docRef.get();
      if (!doc.exists) return res.status(404).json({ error: "Comment not found" });
      if (doc.data()?.user_id !== user_id) return res.status(403).json({ error: "Unauthorized" });

      await docRef.update({ content });
      return res.json({ success: true });
    } catch (error) {
      console.error("Firestore error:", error);
    }
  }

  db.prepare("UPDATE forum_comments SET content = ? WHERE id = ? AND user_id = ?")
    .run(content, commentId, user_id);
  res.json({ success: true });
});

router.delete("/comments/:commentId", async (req, res) => {
  const { commentId } = req.params;
  const { user_id, post_id } = req.query;

  if (dbFirestore) {
    try {
      const docRef = dbFirestore.collection("forum_comments").doc(commentId);
      const doc = await docRef.get();
      if (!doc.exists) return res.status(404).json({ error: "Comment not found" });
      if (doc.data()?.user_id !== user_id) return res.status(403).json({ error: "Unauthorized" });

      await docRef.delete();

      if (post_id) {
        const postRef = dbFirestore.collection("forum_posts").doc(post_id as string);
        const post = await postRef.get();
        if (post.exists) {
          const currentCount = post.data()?.comment_count || 0;
          await postRef.update({ comment_count: Math.max(0, currentCount - 1) });
        }
      }

      return res.json({ success: true });
    } catch (error) {
      console.error("Firestore error:", error);
    }
  }

  db.prepare("DELETE FROM forum_comments WHERE id = ? AND user_id = ?").run(commentId, user_id);
  res.json({ success: true });
});

export default router;
