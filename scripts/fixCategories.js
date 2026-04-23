// scripts/fixCategories.js
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
import Category from "../models/Category.js";

await mongoose.connect(process.env.MONGO_URI);

const cats = await Category.find({});

for (const cat of cats) {
  cat.subcategories = (cat.subcategories ?? []).map((l2) => {
    l2.subcategories = (l2.subcategories ?? []).map((l3) => {
      l3.subcategories = l3.subcategories ?? [];
      return l3;
    });
    return l2;
  });

  // Bypass the pre-save hook to avoid the crash during migration
  await Category.updateOne(
    { _id: cat._id },
    { $set: { subcategories: cat.subcategories } }
  );
}

console.log(`✅ Fixed ${cats.length} categories`);
await mongoose.disconnect();