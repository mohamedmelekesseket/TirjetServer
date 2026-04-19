// routes/favourite.routes.js
import express from "express";
import {
  getFavourites,
  getFavouriteIds,
  addFavourite,
  removeFavourite,
} from "../controllers/favourite.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

router.get("/",          getFavourites);    // GET    /api/favourites
router.get("/ids",       getFavouriteIds);  // GET    /api/favourites/ids
router.post("/:productId",   addFavourite);    // POST   /api/favourites/:productId
router.delete("/:productId", removeFavourite); // DELETE /api/favourites/:productId

export default router;