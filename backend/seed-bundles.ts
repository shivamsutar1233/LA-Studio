import 'dotenv/config';
import { initDb } from './src/database';

async function seedBundles() {
    try {
        const db = await initDb();

        const bundles = [
            {
                id: "bndl_ultimatemoto",
                name: "The Ultimate MotoVlog Kit",
                description: "DJI Action 5 Pro + DJI Mic 2 Combo. The ultimate setup for capturing high-quality video and crystal-clear audio on your rides.",
                pricePerDay: 1600,
                thumbnail: "https://pxkxayc7bjdy4vc0.public.blob.vercel-storage.com/LAS/1772352478768-940483810-1.png",
                images: JSON.stringify([
                    "https://pxkxayc7bjdy4vc0.public.blob.vercel-storage.com/LAS/1772352491686-445239955-2.png",
                    "https://pxkxayc7bjdy4vc0.public.blob.vercel-storage.com/LAS/1772352492439-131492078-3.png"
                ]),
                gearIds: JSON.stringify(["ewlsad7uw", "ljjetgyey"])
            },
            {
                id: "bndl_360pack",
                name: "360° Perspective Pack",
                description: "Capture every angle with the Insta360 X4 paired with the compact DJI Mic Mini for great audio on the go.",
                pricePerDay: 1650,
                thumbnail: "https://pxkxayc7bjdy4vc0.public.blob.vercel-storage.com/LAS/1772352550518-166116644-1.png",
                images: "[]",
                gearIds: JSON.stringify(["oemahzd33", "2p7etm58c"])
            }
        ];

        for (const b of bundles) {
            // Check if exists
            const existing = await db.get('SELECT id FROM bundles WHERE id = ?', [b.id]);
            if (existing) {
                await db.run(
                    'UPDATE bundles SET name=?, description=?, pricePerDay=?, thumbnail=?, images=?, gearIds=? WHERE id=?',
                    [b.name, b.description, b.pricePerDay, b.thumbnail, b.images, b.gearIds, b.id]
                );
                console.log(`Updated bundle ${b.id}`);
            } else {
                await db.run(
                    'INSERT INTO bundles (id, name, description, pricePerDay, thumbnail, images, gearIds) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [b.id, b.name, b.description, b.pricePerDay, b.thumbnail, b.images, b.gearIds]
                );
                console.log(`Inserted bundle ${b.id}`);
            }
        }

        console.log("Bundles seeded successfully!");
        process.exit(0);
    } catch (err) {
        console.error("Error seeding bundles:", err);
        process.exit(1);
    }
}

seedBundles();
