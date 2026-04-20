// controllers/favourite.controller.js
import Favourite from "../models/Favourite.model.js";
import Product   from "../models/Product.js";

// ── GET /api/favourites ─────────────────────────────────────────────────────
// Returns the authenticated user's favourites (populated product data)
export const getFavourites = async (req, res) => {
  try {
    const favs = await Favourite.find({ user: req.user._id })
      .populate({
        path: "product",
        select: "title description price images category location material stock isApproved",
        populate: { path: "category", select: "name slug mainCategory" },
      })
      .sort({ createdAt: -1 });

    // filter out any whose product was deleted / not approved
    const list = favs
      .filter(f => f.product && f.product.isApproved && f.product.stock > 0)
      .map(f => ({
        favouriteId: f._id,
        ...f.product.toObject(),
      }));

    res.json({ favourites: list });
  } catch (err) {
    console.error("getFavourites:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// ── POST /api/favourites/:productId ────────────────────────────────────────
// Add a product to favourites (idempotent)
export const addFavourite = async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: "Produit introuvable" });

    // findOrCreate pattern — upsert avoids duplicate-key errors
    await Favourite.updateOne(
      { user: req.user._id, product: productId },
      { $setOnInsert: { user: req.user._id, product: productId } },
      { upsert: true }
    );

    res.status(201).json({ message: "Ajouté aux favoris", productId });
  } catch (err) {
    console.error("addFavourite:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// ── DELETE /api/favourites/:productId ──────────────────────────────────────
// Remove a product from favourites
export const removeFavourite = async (req, res) => {
  try {
    const { productId } = req.params;

    const result = await Favourite.findOneAndDelete({
      user:    req.user._id,
      product: productId,
    });

    if (!result) return res.status(404).json({ error: "Favori introuvable" });

    res.json({ message: "Retiré des favoris", productId });
  } catch (err) {
    console.error("removeFavourite:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// ── GET /api/favourites/ids ────────────────────────────────────────────────
// Returns only product IDs — lightweight, used by Boutique on mount
export const getFavouriteIds = async (req, res) => {
  try {
    const favs = await Favourite.find({ user: req.user._id }).select("product");
    const ids  = favs.map(f => f.product.toString());
    res.json({ ids });
  } catch (err) {
    console.error("getFavouriteIds:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};