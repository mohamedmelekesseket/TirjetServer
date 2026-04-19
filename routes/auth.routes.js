import express from "express";
import {
  register,
  login,
  getMe,
  updatePassword,
  oauthLogin,
  linkNextAuth,
} from "../controllers/auth.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

// POST /api/auth/register
router.post("/register", register);

// POST /api/auth/login
router.post("/login", login);

// POST /api/auth/oauth  — Google & Facebook
router.post("/oauth", oauthLogin);

// POST /api/auth/link-nextauth — trusted link from Next.js (INTERNAL_API_KEY)
router.post("/link-nextauth", linkNextAuth);

// GET  /api/auth/me
router.get("/me", protect, getMe);

// PUT  /api/auth/password
router.put("/password", protect, updatePassword);

export default router;