import Comment from "../models/Comment.js";
import Product from "../models/Product.js";

// POST /api/products/:id/comments
export const addComment = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    // Prevent the artisan from reviewing their own product
    if (product.artisan.toString() === req.user._id.toString()) {
      return res.status(403).json({ message: "You cannot review your own product" });
    }

    // Prevent duplicate reviews from the same user
    const existing = await Comment.findOne({
      product: req.params.id,
      user: req.user._id,
    });
    if (existing) {
      return res.status(400).json({ message: "You already reviewed this product" });
    }

    const { rating, content } = req.body;

    const comment = await Comment.create({
      product: req.params.id,
      user: req.user._id,
      rating,
      content,
    });

    // Push comment reference into the product
    product.comments.push(comment._id);
    await product.save();

    // Return comment with user info populated
    await comment.populate("user", "name image");

    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/products/:id/comments
export const getProductComments = async (req, res) => {
  try {
    const comments = await Comment.find({ product: req.params.id })
      .populate("user", "name image")
      .sort({ createdAt: -1 });

    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/products/:id/comments/:commentId
export const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    const isOwner = comment.user.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    await comment.deleteOne();

    // Remove reference from product
    await Product.findByIdAndUpdate(req.params.id, {
      $pull: { comments: req.params.commentId },
    });

    res.json({ message: "Comment deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// PATCH /api/products/:id/comments/:commentId
export const updateComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    const isOwner = comment.user.toString() === req.user._id.toString();
    if (!isOwner) return res.status(403).json({ message: "Not authorized" });

    const { rating, content } = req.body;
    if (rating) comment.rating = rating;
    if (content) comment.content = content;
    await comment.save();

    await comment.populate("user", "name image");
    res.json(comment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};