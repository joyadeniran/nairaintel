import { Router, Response, NextFunction, Request } from "express";
import { db, dbFirestore } from "../db.js";
import { requireAuth, AuthedRequest } from "../middleware/auth.js";

const router = Router();

function asyncHandler(fn: (req: any, res: Response, next: NextFunction) => Promise<any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

// All portfolio routes require a verified Firebase user
router.use(requireAuth);

function getUid(req: AuthedRequest): string {
  // Identity comes only from verified token
  return req.user!.uid;
}

router.get("/", asyncHandler(async (req: AuthedRequest, res: Response) => {
  const uid = getUid(req);

  if (dbFirestore) {
    try {
      const snapshot = await dbFirestore.collection("investments").where("user_id", "==", uid).get();
      const investments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return res.json(investments);
    } catch (error) {
      console.error("Firestore portfolio GET error:", error);
      return res.status(500).json({ error: "Failed to load portfolio" });
    }
  }

  // SQLite local-dev fallback: key by string uid stored in a side table is not available;
  // return empty for unconfigured admin rather than leaking mock user 1 data.
  try {
    const investments = db.prepare("SELECT * FROM investments WHERE CAST(user_id AS TEXT) = ?").all(uid);
    return res.json(investments);
  } catch (error) {
    console.error("SQLite portfolio GET error:", error);
    return res.json([]);
  }
}));

router.post("/", asyncHandler(async (req: AuthedRequest, res: Response) => {
  const uid = getUid(req);
  const { type, symbol, name, entry_price, quantity } = req.body || {};

  // Basic validation
  if (!type || !symbol || !name || entry_price == null || quantity == null) {
    return res.status(400).json({ error: "Missing required fields: type, symbol, name, entry_price, quantity" });
  }
  if (!['stock', 'tbill'].includes(type)) {
    return res.status(400).json({ error: "type must be 'stock' or 'tbill'" });
  }
  const price = parseFloat(entry_price);
  const qty = parseInt(quantity, 10);
  if (Number.isNaN(price) || price <= 0 || Number.isNaN(qty) || qty <= 0) {
    return res.status(400).json({ error: "Invalid entry_price or quantity" });
  }

  if (dbFirestore) {
    try {
      const docRef = await dbFirestore.collection("investments").add({
        user_id: uid,
        type,
        symbol: String(symbol).trim().toUpperCase().slice(0, 32),
        name: String(name).trim().slice(0, 120),
        entry_price: price,
        quantity: qty,
        date_acquired: new Date().toISOString()
      });
      return res.status(201).json({ id: docRef.id });
    } catch (error) {
      console.error("Firestore portfolio POST error:", error);
      return res.status(500).json({ error: "Failed to create investment" });
    }
  }

  return res.status(503).json({ error: "Portfolio write requires Firestore configuration" });
}));

router.put("/:id", asyncHandler(async (req: AuthedRequest, res: Response) => {
  const uid = getUid(req);
  const { id } = req.params;
  const { type, symbol, name, entry_price, quantity } = req.body || {};

  if (!id) return res.status(400).json({ error: "Missing id" });

  if (dbFirestore) {
    try {
      const docRef = dbFirestore.collection("investments").doc(id);
      const doc = await docRef.get();
      if (!doc.exists) return res.status(404).json({ error: "Investment not found" });
      if (doc.data()?.user_id !== uid) return res.status(403).json({ error: "Forbidden" });

      const updates: Record<string, unknown> = {};
      if (type !== undefined) {
        if (!['stock', 'tbill'].includes(type)) return res.status(400).json({ error: "Invalid type" });
        updates.type = type;
      }
      if (symbol !== undefined) updates.symbol = String(symbol).trim().toUpperCase().slice(0, 32);
      if (name !== undefined) updates.name = String(name).trim().slice(0, 120);
      if (entry_price !== undefined) {
        const price = parseFloat(entry_price);
        if (Number.isNaN(price) || price <= 0) return res.status(400).json({ error: "Invalid entry_price" });
        updates.entry_price = price;
      }
      if (quantity !== undefined) {
        const qty = parseInt(quantity, 10);
        if (Number.isNaN(qty) || qty <= 0) return res.status(400).json({ error: "Invalid quantity" });
        updates.quantity = qty;
      }

      await docRef.update(updates);
      return res.json({ success: true });
    } catch (error) {
      console.error("Firestore portfolio PUT error:", error);
      return res.status(500).json({ error: "Failed to update investment" });
    }
  }

  return res.status(503).json({ error: "Portfolio write requires Firestore configuration" });
}));

router.delete("/:id", asyncHandler(async (req: AuthedRequest, res: Response) => {
  const uid = getUid(req);
  const { id } = req.params;

  if (!id) return res.status(400).json({ error: "Missing id" });

  if (dbFirestore) {
    try {
      const docRef = dbFirestore.collection("investments").doc(id);
      const doc = await docRef.get();
      if (!doc.exists) return res.status(404).json({ error: "Investment not found" });
      if (doc.data()?.user_id !== uid) return res.status(403).json({ error: "Forbidden" });

      await docRef.delete();
      return res.json({ success: true });
    } catch (error) {
      console.error("Firestore portfolio DELETE error:", error);
      return res.status(500).json({ error: "Failed to delete investment" });
    }
  }

  return res.status(503).json({ error: "Portfolio write requires Firestore configuration" });
}));

export default router;
