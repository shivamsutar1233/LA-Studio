import { Router, Request, Response } from "express";
import { getDb } from "../database";
import { authenticateToken, requireAdmin } from "../middleware/authMiddleware";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
    try {
        const db = await getDb();
        const bundlesData = await db.all(`
          SELECT b.*, 
                 COALESCE(AVG(r.rating), 0) as averageRating, 
                 COUNT(r.id) as reviewCount
          FROM bundles b
          LEFT JOIN reviews r ON b.id = r.targetId AND r.targetType = 'bundle'
          GROUP BY b.id
        `);
        res.json(bundlesData);
    } catch (err) {
        res.status(500).json({ message: "Error fetching bundles" });
    }
});

router.get("/featured", async (req: Request, res: Response) => {
    try {
        const db = await getDb();
        // Fetch top 3 most premium bundles based on pricePerDay
        const featuredBundles = await db.all(`
          SELECT b.*, 
                 COALESCE(AVG(r.rating), 0) as averageRating, 
                 COUNT(r.id) as reviewCount
          FROM bundles b
          LEFT JOIN reviews r ON b.id = r.targetId AND r.targetType = 'bundle'
          GROUP BY b.id
          ORDER BY pricePerDay DESC 
          LIMIT 3
        `);
        res.json(featuredBundles);
    } catch (err) {
        console.error("Error fetching featured bundles:", err);
        res.status(500).json({ message: "Error fetching featured bundles" });
    }
});

router.get("/:id", async (req: Request, res: Response) => {
    try {
        const db = await getDb();
        const bundle = await db.get(`
          SELECT b.*, 
                 COALESCE(AVG(r.rating), 0) as averageRating, 
                 COUNT(r.id) as reviewCount
          FROM bundles b
          LEFT JOIN reviews r ON b.id = r.targetId AND r.targetType = 'bundle'
          WHERE b.id = ?
          GROUP BY b.id
        `, req.params.id);
        if (!bundle) {
            res.status(404).json({ message: "Bundle not found" });
        } else {
            res.json(bundle);
        }
    } catch (err) {
        res.status(500).json({ message: "Error fetching bundle" });
    }
});

router.get("/:id/booked-dates", async (req: Request, res: Response): Promise<void> => {
    try {
        const db = await getDb();
        const bundle = await db.get('SELECT gearIds FROM bundles WHERE id = ?', req.params.id);
        if (!bundle) {
            res.status(404).json({ message: "Bundle not found" });
            return;
        }

        const gearIds = JSON.parse(bundle.gearIds || '[]');
        if (gearIds.length === 0) {
            res.json([]);
            return;
        }

        const likeClauses = gearIds.map((id: string) => `gearIds LIKE '%,"${id}",%' OR gearIds LIKE '["${id}",%' OR gearIds LIKE '%,"${id}"]' OR gearIds = '["${id}"]'`).join(' OR ');

        const bookings = await db.all(`
      SELECT startDate, endDate FROM bookings 
      WHERE status IN ('confirmed', 'pending') 
        AND (${likeClauses})
    `);

        res.json(bookings);
    } catch (err) {
        console.error("Bundle Booked Dates Error:", err);
        res.status(500).json({ message: "Error fetching booked dates for bundle" });
    }
});

router.post("/", authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    try {
        const { name, description, pricePerDay, thumbnail, images, gearIds } = req.body;
        const db = await getDb();
        const newId = Math.random().toString(36).substr(2, 9);

        await db.run(
            'INSERT INTO bundles (id, name, description, pricePerDay, thumbnail, images, gearIds) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [newId, name, description, pricePerDay, thumbnail || '', images || '[]', gearIds || '[]']
        );

        const newBundle = await db.get('SELECT * FROM bundles WHERE id = ?', newId);
        res.status(201).json({ message: "Bundle created successfully", bundle: newBundle });
    } catch (err) {
        console.error("Create Bundle Error:", err);
        res.status(500).json({ message: "Error creating bundle" });
    }
});

router.put("/:id", authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    try {
        const { name, description, pricePerDay, thumbnail, images, gearIds } = req.body;
        const db = await getDb();

        await db.run(
            'UPDATE bundles SET name = ?, description = ?, pricePerDay = ?, thumbnail = ?, images = ?, gearIds = ? WHERE id = ?',
            [name, description, pricePerDay, thumbnail || '', images || '[]', gearIds || '[]', req.params.id]
        );

        const updatedBundle = await db.get('SELECT * FROM bundles WHERE id = ?', req.params.id);
        if (!updatedBundle) {
            res.status(404).json({ message: "Bundle not found" });
        } else {
            res.json({ message: "Bundle updated successfully", bundle: updatedBundle });
        }
    } catch (err) {
        console.error("Update Bundle Error:", err);
        res.status(500).json({ message: "Error updating bundle" });
    }
});

router.delete("/:id", authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    try {
        const db = await getDb();
        const result = await db.run('DELETE FROM bundles WHERE id = ?', req.params.id);

        if (result.changes === 0) {
            res.status(404).json({ message: "Bundle not found" });
        } else {
            res.json({ message: "Bundle deleted successfully" });
        }
    } catch (err) {
        console.error("Delete Bundle Error:", err);
        res.status(500).json({ message: "Error deleting bundle" });
    }
});

export default router;
