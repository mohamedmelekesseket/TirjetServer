import Product from "../models/Product.js";
import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";
import User from "../models/User.js";

// ── helper — upload one file via stream ───────────────────────────────────────
const uploadImage = async (file) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "artisana/products",
        transformation: [{ quality: "auto", fetch_format: "auto" }],
      },
      (error, result) => {
        if (result) resolve(result.secure_url);
        else reject(error);
      }
    );
    streamifier.createReadStream(file.buffer).pipe(stream);
  });
};

// ── helper — extract L2/L3/L4 sub-category fields from req.body ──────────────
// Front-end sends: subcategoryL2Slug, subcategoryL2Name, subcategoryL3Slug, …
function extractSubcategoryFields(body) {
  const fields = {};

  if (body.subcategoryL2Slug !== undefined) {
    if (body.subcategoryL2Slug) {
      fields.subcategoryL2 = {
        slug: body.subcategoryL2Slug,
        name: body.subcategoryL2Name || "",
      };
      // keep legacy mirror in sync
      fields.subcategory = fields.subcategoryL2;
    } else {
      fields["$unset"] = { ...(fields["$unset"] || {}), subcategoryL2: 1, subcategory: 1 };
    }
  }

  if (body.subcategoryL3Slug !== undefined) {
    if (body.subcategoryL3Slug) {
      fields.subcategoryL3 = {
        slug: body.subcategoryL3Slug,
        name: body.subcategoryL3Name || "",
      };
    } else {
      fields["$unset"] = { ...(fields["$unset"] || {}), subcategoryL3: 1 };
    }
  }

  if (body.subcategoryL4Slug !== undefined) {
    if (body.subcategoryL4Slug) {
      fields.subcategoryL4 = {
        slug: body.subcategoryL4Slug,
        name: body.subcategoryL4Name || "",
      };
    } else {
      fields["$unset"] = { ...(fields["$unset"] || {}), subcategoryL4: 1 };
    }
  }

  return fields;
}

// ─────────────────────────────────────────
// @desc    Get all products (public, with filters)
// @route   GET /api/products
// @access  Public
// ─────────────────────────────────────────
export const getAllProducts = async (req, res) => {
  try {
    const {
      category, artisan, approved, search,
      subcategoryL2, subcategoryL3, subcategoryL4,
      page = 1, limit = 20,
    } = req.query;

    const filter = {};
    if (category)      filter.category              = category;
    if (artisan)       filter.artisan               = artisan;
    if (subcategoryL2) filter["subcategoryL2.slug"] = subcategoryL2;
    if (subcategoryL3) filter["subcategoryL3.slug"] = subcategoryL3;
    if (subcategoryL4) filter["subcategoryL4.slug"] = subcategoryL4;
    if (approved !== undefined) filter.isApproved   = approved === "true";
    if (search)        filter.title                 = { $regex: search, $options: "i" };

    const total    = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .populate("artisan", "name email image")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ products, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────
// @desc    Get a single product by ID
// @route   GET /api/products/:id
// @access  Public
// ─────────────────────────────────────────
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate("artisan", "name email image");
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────
// @desc    Get products belonging to the logged-in artisan
// @route   GET /api/products/mine
// @access  Private (vendor)
// ─────────────────────────────────────────
export const getMyProducts = async (req, res) => {
  try {
    const { category, search, page = 1, limit = 20 } = req.query;

    const filter = { artisan: req.user._id };
    if (category) filter.category = category;
    if (search)   filter.title    = { $regex: search, $options: "i" };

    const total    = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ products, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Shared product-build helper ─────────────────────────────────────────────
function buildProductDoc({ body, artisanId, images }) {
  const {
    title, description, price, category, stock,
    subcategoryL2Slug, subcategoryL2Name,
    subcategoryL3Slug, subcategoryL3Name,
    subcategoryL4Slug, subcategoryL4Name,
  } = body;

  const doc = {
    title,
    description,
    price,
    category,
    stock: stock || 1,
    images,
    artisan:    artisanId,
    isApproved: true,
  };

  if (subcategoryL2Slug) {
    doc.subcategoryL2 = { slug: subcategoryL2Slug, name: subcategoryL2Name || "" };
    doc.subcategory   = doc.subcategoryL2; // legacy mirror
  }
  if (subcategoryL3Slug) {
    doc.subcategoryL3 = { slug: subcategoryL3Slug, name: subcategoryL3Name || "" };
  }
  if (subcategoryL4Slug) {
    doc.subcategoryL4 = { slug: subcategoryL4Slug, name: subcategoryL4Name || "" };
  }

  return doc;
}

// ─────────────────────────────────────────
// @desc    Create a new product
// @route   POST /api/products
// @access  Private (vendor)
// ─────────────────────────────────────────
export const createProduct = async (req, res) => {
  try {
    const { title, price, category } = req.body;

    if (!title || !price || !category) {
      return res.status(400).json({ message: "title, price and category are required" });
    }

    let images = [];
    if (req.files?.length) {
      images = await Promise.all(req.files.map((f) => uploadImage(f)));
    }

    const product = await Product.create(
      buildProductDoc({ body: req.body, artisanId: req.user._id, images })
    );

    res.status(201).json(product);
  } catch (error) {
    console.error("CREATE PRODUCT ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────
// @desc    Admin creates a product on behalf of a vendor
// @route   POST /api/products/admin/for-vendor
// @access  Admin
// ─────────────────────────────────────────
export const createProductForVendor = async (req, res) => {
  try {
    const { title, price, category, artisanId } = req.body;

    if (!title || !price || !category || !artisanId) {
      return res.status(400).json({
        message: "title, price, category and artisanId are required",
      });
    }

    const vendor = await User.findById(artisanId);
    if (!vendor || vendor.role !== "vendor") {
      return res.status(400).json({ message: "Target user is not a vendor" });
    }

    let images = [];
    if (req.files?.length) {
      images = await Promise.all(req.files.map((f) => uploadImage(f)));
    }

    const product = await Product.create(
      buildProductDoc({ body: req.body, artisanId, images })
    );

    res.status(201).json(product);
  } catch (error) {
    console.error("CREATE PRODUCT FOR VENDOR ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────
// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private (vendor owner | admin)
// ─────────────────────────────────────────
export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const isOwner = product.artisan.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // ── Image handling ──────────────────────────────────────────────────────
    let images = product.images;

    if (req.files?.length) {
      const newImages = await Promise.all(req.files.map((f) => uploadImage(f)));
      images = req.body.appendImages === "true"
        ? [...product.images, ...newImages]
        : newImages;
    } else if (req.body.images !== undefined) {
      const incoming = Array.isArray(req.body.images)
        ? req.body.images
        : JSON.parse(req.body.images);
      images = incoming.filter((url) => !url.startsWith("blob:"));
    }

    // ── Core fields ─────────────────────────────────────────────────────────
    const { title, description, price, category, stock } = req.body;
    const updateData = {};

    if (title       !== undefined) updateData.title       = title;
    if (description !== undefined) updateData.description = description;
    if (price       !== undefined) updateData.price       = Number(price);
    if (category    !== undefined) updateData.category    = category;
    if (stock       !== undefined) updateData.stock       = Number(stock);

    updateData.images = images;

    // ── Subcategory fields (L2 / L3 / L4) ───────────────────────────────────
    const subFields = extractSubcategoryFields(req.body);
    const { "$unset": unsetFields, ...setSubFields } = subFields;
    Object.assign(updateData, setSubFields);

    // ── Admin-only fields ───────────────────────────────────────────────────
    const toBool = (v) => v === "true" || v === true;

    if (isAdmin) {
      const { isApproved, isSuspended, isHome, isReported, solde } = req.body;
      if (isApproved  !== undefined) updateData.isApproved  = toBool(isApproved);
      if (isSuspended !== undefined) updateData.isSuspended = toBool(isSuspended);
      if (isHome      !== undefined) updateData.isHome      = toBool(isHome);
      if (isReported  !== undefined) updateData.isReported  = toBool(isReported);
      if (solde !== undefined) {
        if (solde !== "" && solde !== null) {
          updateData.solde = Number(solde);
        } else {
          unsetFields
            ? (unsetFields.solde = 1)
            : (updateData["$unset"] = { solde: 1 });
        }
      }
    }

    // ── Build Mongoose update ────────────────────────────────────────────────
    const { "$unset": finalUnset, ...setFields } = updateData;
    const mongoUpdate = { $set: setFields };
    const mergedUnset = { ...(unsetFields || {}), ...(finalUnset || {}) };
    if (Object.keys(mergedUnset).length) mongoUpdate.$unset = mergedUnset;

    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      mongoUpdate,
      { returnDocument: "after", runValidators: true }
    ).populate("artisan", "name email image");

    res.json(updated);
  } catch (error) {
    console.error("UPDATE PRODUCT ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────
// @desc    Suspend / unsuspend a product (admin)
// @route   PATCH /api/products/:id/suspend
// @access  Admin
// ─────────────────────────────────────────
export const suspendProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const suspend =
      req.body.isSuspended !== undefined
        ? req.body.isSuspended === true || req.body.isSuspended === "true"
        : !product.isSuspended;

    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      { isSuspended: suspend, isApproved: !suspend },
      { returnDocument: "after" }
      { new: true }
    );

    res.json({
      message: suspend ? "Product suspended" : "Product reactivated",
      product: updated,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────
// @desc    Approve a product (admin moderation)
// @route   PATCH /api/products/:id/approve
// @access  Admin
// ─────────────────────────────────────────
export const approveProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isApproved: true },
      { returnDocument: "after" }
      { new: true }
    );
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json({ message: "Product approved", product });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────
// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private (vendor owner | admin)
// ─────────────────────────────────────────
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const isOwner = product.artisan.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    await product.deleteOne();
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};