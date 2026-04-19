import express from "express";
import dotenv from "dotenv";
dotenv.config();
console.log("MONGO_URI:", process.env.MONGO_URI);
import cors from "cors";
import connectDB from "./config/db.js";
// console.log("ENV FROM SERVER:", process.env.CLOUDINARY_API_KEY);
import cors from "cors";
import connectDB from "./config/db.js";
console.log("ENV FROM SERVER:", process.env.CLOUDINARY_API_KEY);
import artisanRoutes from "./routes/artisan.routes.js";
import authRoutes from "./routes/auth.routes.js";
import orderRoutes from "./routes/order.routes.js";
import productRoutes from "./routes/product.routes.js";
import userRoutes from "./routes/user.routes.js";
import commentRoutes from "./routes/commentRoutes.js";
import favouriteRoutes from "./routes/Favourite.routes.js"; // ← ADD THIS
import categoryRoutes from "./routes/Category.routes.js";   // ← ADD
import cartRoutes from "./routes/cart.routes.js"; // ← ADD THIS (adjust filename to match yours)

connectDB();

const app = express();

const allowedOrigins = (() => {
  const raw = process.env.CLIENT_URL || "";
  const parts = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const defaults = [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://tirjet.com",
    "https://www.tirjet.com",
  ];
  return Array.from(new Set([...parts, ...defaults]));
})();

app.use(
  cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error(`CORS blocked origin: ${origin}`));
    },
    credentials: true,
  })
);

app.use(express.json());

app.get("/", (req, res) => {
  res.send("API running...");
});

// Routes
app.use("/api/artisans", artisanRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/products", productRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products/:id/comments", commentRoutes);
app.use("/api/favourites", favouriteRoutes); // ← ADD THIS
app.use("/api/categories", categoryRoutes);                  // ← ADD
app.use("/api/cart", cartRoutes); // ← ADD THIS

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));