import { Router, Request, Response } from "express";
import { getDb } from "../database";
import { authenticateToken, requireAdmin } from "../middleware/authMiddleware";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const gearsData = await db.all('SELECT * FROM gears');
    res.json(gearsData);
  } catch (err) {
    res.status(500).json({ message: "Error fetching gears" });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const gear = await db.get('SELECT * FROM gears WHERE id = ?', req.params.id);
    if (!gear) {
      res.status(404).json({ message: "Gear not found" });
    } else {
      res.json(gear);
    }
  } catch (err) {
    res.status(500).json({ message: "Error fetching gear" });
  }
});

router.get("/:id/booked-dates", async (req: Request, res: Response) => {
  try {
    const db = await getDb();

    // Find all bookings that contain this gearId and are either confirmed or pending
    // We check if the gearIds JSON array contains the specific ID
    const bookings = await db.all(`
      SELECT startDate, endDate 
      FROM bookings 
      WHERE status IN ('confirmed', 'pending') 
        AND (gearIds LIKE ? OR gearIds LIKE ? OR gearIds LIKE ? OR gearIds = ?)
    `, [
      `%,"${req.params.id}",%`, // Middle of array
      `["${req.params.id}",%`,  // Start of array
      `%,"${req.params.id}"]`,  // End of array
      `["${req.params.id}"]`    // Only element in array
    ]);

    res.json(bookings);
  } catch (err) {
    console.error("Error fetching booked dates:", err);
    res.status(500).json({ message: "Error fetching booked dates for gear" });
  }
});

router.post("/", authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { name, category, pricePerDay, thumbnail, images } = req.body;
    const db = await getDb();
    const newId = Math.random().toString(36).substr(2, 9);

    await db.run(
      'INSERT INTO gears (id, name, category, pricePerDay, thumbnail, images) VALUES (?, ?, ?, ?, ?, ?)',
      [newId, name, category, pricePerDay, thumbnail || '', images || '[]']
    );

    const newGear = await db.get('SELECT * FROM gears WHERE id = ?', newId);
    res.status(201).json({ message: "Gear created successfully", gear: newGear });
  } catch (err) {
    console.error("Create Gear Error:", err);
    res.status(500).json({ message: "Error creating gear" });
  }
});

router.put("/:id", authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { name, category, pricePerDay, thumbnail, images } = req.body;
    const db = await getDb();

    await db.run(
      'UPDATE gears SET name = ?, category = ?, pricePerDay = ?, thumbnail = ?, images = ? WHERE id = ?',
      [name, category, pricePerDay, thumbnail || '', images || '[]', req.params.id]
    );

    const updatedGear = await db.get('SELECT * FROM gears WHERE id = ?', req.params.id);
    if (!updatedGear) {
      res.status(404).json({ message: "Gear not found" });
    } else {
      res.json({ message: "Gear updated successfully", gear: updatedGear });
    }
  } catch (err) {
    console.error("Update Gear Error:", err);
    res.status(500).json({ message: "Error updating gear" });
  }
});

router.delete("/:id", authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const result = await db.run('DELETE FROM gears WHERE id = ?', req.params.id);

    if (result.changes === 0) {
      res.status(404).json({ message: "Gear not found" });
    } else {
      res.json({ message: "Gear deleted successfully" });
    }
  } catch (err) {
    console.error("Delete Gear Error:", err);
    res.status(500).json({ message: "Error deleting gear" });
  }
});

export default router;
