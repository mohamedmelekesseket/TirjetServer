import mongoose from "mongoose";
import dns from "dns";
import dotenv from "dotenv";
import ArtisanProfile from "./models/ArtisanProfile.js";

dotenv.config();

dns.setDefaultResultOrder("ipv4first");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

await mongoose.connect(process.env.MONGO_URI, { family: 4 });
console.log("✅ Connected to MongoDB");

// Copy isFeatured: true → isPremium: true
const promoted = await ArtisanProfile.updateMany(
  { isFeatured: true },
  { $set: { isPremium: true } }
);
console.log(`Promoted ${promoted.modifiedCount} documents (isFeatured: true → isPremium: true)`);

// Remove isFeatured from ALL documents
const cleaned = await ArtisanProfile.updateMany(
  { isFeatured: { $exists: true } },
  { $unset: { isFeatured: "" } }
);
console.log(`Cleaned isFeatured from ${cleaned.modifiedCount} documents`);

await mongoose.disconnect();
console.log("✅ Done!");