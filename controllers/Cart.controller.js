import Cart from "../models/Cart.js";
import Product from "../models/Product.js";

// ─────────────────────────────────────────
// @desc    Get current user's cart
// @route   GET /api/cart
// @access  Private
// ─────────────────────────────────────────
export const getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id }).populate(
      "items.product",
      "title images price stock isApproved artisan"
    );

    if (!cart) return res.json({ items: [], total: 0 });
    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────
// @desc    Add or update item in cart
// @route   POST /api/cart
// @access  Private
// ─────────────────────────────────────────
export const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    console.log("1️⃣ parsed body");

    const product = await Product.findById(productId);
    console.log("2️⃣ product found:", product?._id, "isApproved:", product?.isApproved, "stock:", product?.stock);

    if (!product) return res.status(404).json({ message: "Product not found" });
    if (!product.isApproved) return res.status(400).json({ message: "Product is not available" });
    if (product.stock < quantity) {
      return res.status(400).json({ message: `Not enough stock (available: ${product.stock})` });
    }

    console.log("3️⃣ product checks passed");

    let cart = await Cart.findOne({ user: req.user._id });
    console.log("4️⃣ cart found:", cart ? "yes" : "no (will create)");

    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    const existingIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );
    console.log("5️⃣ existingIndex:", existingIndex);

    if (existingIndex >= 0) {
      const newQty = cart.items[existingIndex].quantity + quantity;
      if (newQty > product.stock) {
        return res.status(400).json({ message: `Only ${product.stock} items in stock` });
      }
      cart.items[existingIndex].quantity = newQty;
      cart.items[existingIndex].price = product.price;
    } else {
      cart.items.push({ product: productId, quantity, price: product.price });
    }

    console.log("6️⃣ about to save cart");
    cart.total = cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    await cart.save();
    console.log("7️⃣ cart saved");

    const populated = await cart.populate("items.product", "title images price stock isApproved artisan");
    console.log("8️⃣ populated, sending response");

    res.json(populated);
  } catch (error) {
    console.error("❌ addToCart CRASH:", error.message);
    console.error(error.stack);
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────
// @desc    Update quantity of a cart item
// @route   PATCH /api/cart/:productId
// @access  Private
// ─────────────────────────────────────────
export const updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    const { productId } = req.params;

    if (!quantity || quantity < 1) {
      return res.status(400).json({ message: "Quantity must be at least 1" });
    }

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });
    if (quantity > product.stock) {
      return res.status(400).json({ message: `Only ${product.stock} in stock` });
    }

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const item = cart.items.find((i) => i.product.toString() === productId);
    if (!item) return res.status(404).json({ message: "Item not in cart" });

    item.quantity = quantity;
    item.price = product.price;

    cart.total = cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    await cart.save();

    const populated = await cart.populate(
      "items.product",
      "title images price stock isApproved artisan"
    );

    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────
// @desc    Remove item from cart
// @route   DELETE /api/cart/:productId
// @access  Private
// ─────────────────────────────────────────
export const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    cart.items = cart.items.filter((i) => i.product.toString() !== productId);
    cart.total = cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    await cart.save();

    const populated = await cart.populate(
      "items.product",
      "title images price stock isApproved artisan"
    );

    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────
// @desc    Clear entire cart
// @route   DELETE /api/cart
// @access  Private
// ─────────────────────────────────────────
export const clearCart = async (req, res) => {
  try {
    await Cart.findOneAndDelete({ user: req.user._id });
    res.json({ message: "Cart cleared", items: [], total: 0 });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};