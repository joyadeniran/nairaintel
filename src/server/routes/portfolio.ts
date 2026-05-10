import { Router } from "express";
import { db, dbFirestore } from "../db.js";

const router = Router();
const userId = 1; // Mock user for MVP

router.get("/", async (req, res) => {
  const { user_id } = req.query;
  if (dbFirestore && user_id) {
    try {
      const snapshot = await dbFirestore.collection("investments").where("user_id", "==", user_id).get();
      if (snapshot.empty) {
        const batch = dbFirestore.batch();
        const demoInvestments = [
          { user_id, type: 'stock', symbol: 'DANGCEM', name: 'Dangote Cement', entry_price: 280.00, quantity: 1500, date_acquired: '2022-01-01' },
          { user_id, type: 'stock', symbol: 'GTCO', name: 'GTBank', entry_price: 31.50, quantity: 3000, date_acquired: '2022-02-01' },
          { user_id, type: 'stock', symbol: 'MTNN', name: 'MTN Nigeria', entry_price: 180.00, quantity: 1200, date_acquired: '2022-03-01' },
          { user_id, type: 'tbill', symbol: '91-Day T-Bill', name: '91-Day T-Bill 6.75%', entry_price: 1440000, quantity: 1, date_acquired: '2022-05-12' }
        ];
        for (const inv of demoInvestments) {
          batch.set(dbFirestore.collection("investments").doc(), inv);
        }
        await batch.commit();
        const newSnapshot = await dbFirestore.collection("investments").where("user_id", "==", user_id).get();
        return res.json(newSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
      const investments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return res.json(investments);
    } catch (error) {
      console.error("Firestore error:", error);
    }
  }
  const investments = db.prepare("SELECT * FROM investments WHERE user_id = ?").all(userId);
  res.json(investments);
});

router.post("/", async (req, res) => {
  const { type, symbol, name, entry_price, quantity, user_id } = req.body;
  
  if (dbFirestore && user_id) {
    try {
      const docRef = await dbFirestore.collection("investments").add({
        user_id,
        type,
        symbol,
        name,
        entry_price: parseFloat(entry_price),
        quantity: parseInt(quantity),
        date_acquired: new Date().toISOString()
      });
      return res.json({ id: docRef.id });
    } catch (error) {
      console.error("Firestore error:", error);
    }
  }
  const result = db.prepare(
    "INSERT INTO investments (user_id, type, symbol, name, entry_price, quantity, date_acquired) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).run(userId, type, symbol, name, entry_price, quantity, new Date().toISOString());
  res.json({ id: result.lastInsertRowid });
});

router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { type, symbol, name, entry_price, quantity, user_id } = req.body;

  if (dbFirestore && user_id) {
    try {
      await dbFirestore.collection("investments").doc(id).update({
        type,
        symbol,
        name,
        entry_price: parseFloat(entry_price),
        quantity: parseInt(quantity)
      });
      return res.json({ success: true });
    } catch (error) {
      console.error("Firestore error:", error);
    }
  }

  db.prepare(
    "UPDATE investments SET type = ?, symbol = ?, name = ?, entry_price = ?, quantity = ? WHERE id = ? AND user_id = ?"
  ).run(type, symbol, name, entry_price, quantity, id, userId);
  res.json({ success: true });
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const { user_id } = req.query;

  if (dbFirestore && user_id) {
    try {
      await dbFirestore.collection("investments").doc(id).delete();
      return res.json({ success: true });
    } catch (error) {
      console.error("Firestore error:", error);
    }
  }

  db.prepare("DELETE FROM investments WHERE id = ? AND user_id = ?").run(id, userId);
  res.json({ success: true });
});

export default router;
