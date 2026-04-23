import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Cart from "../models/Cart.js";

// ─────────────────────────────────────────
// @desc    Checkout from cart → create order
// @route   POST /api/orders/checkout
// @access  Private
// ─────────────────────────────────────────
export const checkoutFromCart = async (req, res) => {
  try {
    const { shippingAddress, paymentMethod = "card" } = req.body;

    if (!shippingAddress?.fullName || !shippingAddress?.phone || !shippingAddress?.address) {
      return res.status(400).json({ message: "Shipping address is incomplete" });
    }

    const cart = await Cart.findOne({ user: req.user._id }).populate("items.product");
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // Auto-remove items whose product was deleted or unpopulated
    const validItems = cart.items.filter((item) => item.product != null);
    if (validItems.length === 0) {
      return res.status(400).json({ message: "All products in your cart are no longer available" });
    }

    let total = 0;
    const resolvedItems = [];

    for (const item of validItems) {
      const p = item.product;

      if (!p.isApproved) throw new Error(`Product "${p.title}" is not approved yet`);
      if (p.stock < item.quantity) {
        throw new Error(`Not enough stock for "${p.title}" (available: ${p.stock})`);
      }

      total += p.price * item.quantity;
      resolvedItems.push({ product: p._id, quantity: item.quantity, price: p.price });
    }

    const order = await Order.create({
      user: req.user._id,
      items: resolvedItems,
      total,
      status: "pending",
      shippingAddress,
      paymentMethod,
    });

    await Promise.all(
      resolvedItems.map(({ product, quantity }) =>
        Product.findByIdAndUpdate(product, { $inc: { stock: -quantity } })
      )
    );

    await Cart.findOneAndDelete({ user: req.user._id });

    res.status(201).json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
// ─────────────────────────────────────────
// @desc    Get ALL orders (admin overview)
// @route   GET /api/orders
// @access  Admin
// ─────────────────────────────────────────
export const getAllOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const total  = await Order.countDocuments(filter);
    const orders = await Order.find(filter)
      .populate("user", "name email")
      .populate("items.product", "title images price artisan")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ orders, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────
// @desc    Get orders for the logged-in user
// @route   GET /api/orders/mine
// @access  Private
// ─────────────────────────────────────────
export const getMyOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = { user: req.user._id };
    if (status) filter.status = status;

    const total  = await Order.countDocuments(filter);
    const orders = await Order.find(filter)
      .populate("items.product", "title images price")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ orders, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────
// @desc    Get orders for the artisan's products
// @route   GET /api/orders/artisan
// @access  Private (vendor)
// ─────────────────────────────────────────
export const getArtisanOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const myProducts = await Product.find({ artisan: req.user._id }).select("_id");
    const productIds = myProducts.map((p) => p._id);

    const filter = { "items.product": { $in: productIds } };
    if (status) filter.status = status;

    const total  = await Order.countDocuments(filter);
    const orders = await Order.find(filter)
      .populate("user", "name email")
      .populate("items.product", "title images price artisan")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ orders, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────
// @desc    Get a single order by ID
// @route   GET /api/orders/:id
// @access  Private (owner | admin)
// ─────────────────────────────────────────
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("user", "name email")
      .populate("items.product", "title images price artisan");

    if (!order) return res.status(404).json({ message: "Order not found" });

    const isOwner = order.user._id.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────
// @desc    Place a new order (direct, no cart)
// @route   POST /api/orders
// @access  Private
// ─────────────────────────────────────────
export const createOrder = async (req, res) => {
  try {
    const { items } = req.body;
    if (!items || items.length === 0) {
      return res.status(400).json({ message: "Order must contain at least one item" });
    }

    let total = 0;
    const resolvedItems = await Promise.all(
      items.map(async ({ product, quantity }) => {
        const p = await Product.findById(product);
        if (!p) throw new Error(`Product ${product} not found`);
        if (!p.isApproved) throw new Error(`Product "${p.title}" is not available`);
        if (p.stock < quantity)
          throw new Error(`Not enough stock for "${p.title}" (available: ${p.stock})`);
        total += p.price * quantity;
        return { product: p._id, quantity, price: p.price };
      })
    );

    const order = await Order.create({
      user: req.user._id,
      items: resolvedItems,
      total,
      status: "pending",
    });

    await Promise.all(
      resolvedItems.map(({ product, quantity }) =>
        Product.findByIdAndUpdate(product, { $inc: { stock: -quantity } })
      )
    );

    res.status(201).json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ─────────────────────────────────────────
// @desc    Update order status (full control)
// @route   PATCH /api/orders/:id/status
// @access  Admin | Vendor
// ─────────────────────────────────────────
export const updateOrderStatus = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("items.product", "artisan");

    if (!order) return res.status(404).json({ message: "Order not found" });

    // Vendors can only update orders that contain their products
    if (req.user.role === "vendor") {
      const ownsAProduct = order.items.some(
        (item) => item.product?.artisan?.toString() === req.user._id.toString()
      );
      if (!ownsAProduct) {
        return res.status(403).json({ message: "Not authorized" });
      }
    }

    order.status = req.body.status;
    await order.save();
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────
// @desc    Cancel an order (owner or admin)
// @route   PATCH /api/orders/:id/cancel
// @access  Private (owner) | Admin
// ─────────────────────────────────────────
export const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    const isOwner = order.user.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (order.status === "delivered") {
      return res.status(400).json({ message: "Cannot cancel a delivered order" });
    }
    if (order.status === "cancelled") {
      return res.status(400).json({ message: "Order is already cancelled" });
    }

    order.status = "cancelled";
    await order.save();

    // Restore stock
    await Promise.all(
      order.items.map(({ product, quantity }) =>
        Product.findByIdAndUpdate(product, { $inc: { stock: quantity } })
      )
    );

    res.json({ message: "Order cancelled", order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};