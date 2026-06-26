import CultureAmazigh from "../models/CultureAmazigh.js";
import User from "../models/User.js";
import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";

// ── Upload helper ─────────────────────────────────────────────────────────────
const uploadImage = async (file) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "artisana/culture-amazigh",
        transformation: [{ quality: "auto", fetch_format: "auto" }],
        timeout: 60000, // 60 seconds per image
      },
      (error, result) => {
        if (result) resolve(result.secure_url);
        else reject(error);
      }
    );
    streamifier.createReadStream(file.buffer).pipe(stream);
  });
};
const uploadVideo = async (file) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "video",
        folder: "artisana/culture-amazigh/videos",
        transformation: [{ quality: "auto" }],
        timeout: 300000,        // 5 minutes per video upload
        chunk_size: 10000000,   // 10MB chunks for better stability
      },
      (error, result) => {
        if (result) resolve(result.secure_url);
        else reject(error);
      }
    );
    streamifier.createReadStream(file.buffer).pipe(stream);
  });
};
// ── Allowed types ─────────────────────────────────────────────────────────────
const ALLOWED_TYPES = [
  "Langue amazigh",
  "Événements & traditions",
  "Symboles et motifs berbères",
  "Musique amazigh",
  "Patrimoine et Traditions",
  "Agriculture amazigh",
  "Architecture amazigh",
  "Documentation",
];

// ── Build document helper ─────────────────────────────────────────────────────
function buildCultureDoc({ body, hostId, images, videos = [], videoUrls = [] }) {
  const { Auteur, title, description, type, amenities } = body;

  return {
    Auteur,
    title,
    description,
    type,
    amenities: amenities
      ? Array.isArray(amenities) ? amenities : JSON.parse(amenities)
      : [],
    images,
    videos,       // ← ADD
    videoUrls,    // ← ADD
    host: hostId,
    isApproved: false,
  };
}

// ─────────────────────────────────────────
// @desc    Get all Culture Amazigh publications (public, with filters)
// @route   GET /api/culture-amazigh
// @access  Public
// ─────────────────────────────────────────
export const getAllCultures = async (req, res) => {
  try {
    const {
      type,
      search,
      approved,
      featured,
      editorsPick,
      page = 1,
      limit = 20,
    } = req.query;

    const filter = {};

    if (type) filter.type = type;
    if (search)
      filter.$or = [
        { title:  { $regex: search, $options: "i" } },
        { Auteur: { $regex: search, $options: "i" } },
      ];
    if (approved    !== undefined) filter.isApproved    = approved    === "true";
    if (featured    !== undefined) filter.isFeatured    = featured    === "true";
    if (editorsPick !== undefined) filter.isEditorsPick = editorsPick === "true";

    const total    = await CultureAmazigh.countDocuments(filter);
    const cultures = await CultureAmazigh.find(filter)
      .populate("host", "name email image")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ cultures, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────
// @desc    Get publications filtered by type (for dedicated nav pages)
// @route   GET /api/culture-amazigh/type/:type
// @access  Public
// ─────────────────────────────────────────
export const getCulturesByType = async (req, res) => {
  try {
    const { type } = req.params;
    const { search, approved, featured, editorsPick, page = 1, limit = 20 } = req.query;

    if (!ALLOWED_TYPES.includes(type)) {
      return res.status(400).json({ message: "Invalid type", allowed: ALLOWED_TYPES });
    }

    const filter = { type };

    if (search)
      filter.$or = [
        { title:  { $regex: search, $options: "i" } },
        { Auteur: { $regex: search, $options: "i" } },
      ];
    if (approved    !== undefined) filter.isApproved    = approved    === "true";
    if (featured    !== undefined) filter.isFeatured    = featured    === "true";
    if (editorsPick !== undefined) filter.isEditorsPick = editorsPick === "true";

    const total    = await CultureAmazigh.countDocuments(filter);
    const cultures = await CultureAmazigh.find(filter)
      .populate("host", "name email image")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ cultures, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────
// @desc    Get a single publication by ID
// @route   GET /api/culture-amazigh/:id
// @access  Public
// ─────────────────────────────────────────
export const getCultureById = async (req, res) => {
  try {
    const culture = await CultureAmazigh.findById(req.params.id).populate(
      "host",
      "name email image"
    );

    if (!culture)
      return res.status(404).json({ message: "Publication not found" });

    const alreadyTracked = req.query.viewed === "1";
    if (!alreadyTracked) {
      await CultureAmazigh.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });
      culture.views = (culture.views ?? 0) + 1;
    }

    res.json(culture);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────
// @desc    Get publications belonging to the logged-in vendor
// @route   GET /api/culture-amazigh/mine
// @access  Private (vendor)
// ─────────────────────────────────────────
export const getMyCultures = async (req, res) => {
  try {
    const { type, search, page = 1, limit = 20 } = req.query;

    const filter = { host: req.user._id };
    if (type) filter.type = type;
    if (search)
      filter.$or = [
        { title:  { $regex: search, $options: "i" } },
        { Auteur: { $regex: search, $options: "i" } },
      ];

    const total    = await CultureAmazigh.countDocuments(filter);
    const cultures = await CultureAmazigh.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ cultures, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────
// @desc    Vendor creates a publication for themselves
// @route   POST /api/culture-amazigh
// @access  Private (vendor | admin)
// ─────────────────────────────────────────
export const createCulture = async (req, res) => {
  try {
    const { title, description, type } = req.body;

    if (!title || !description || !type)
      return res.status(400).json({ message: "title, description and type are required" });

    if (!ALLOWED_TYPES.includes(type))
      return res.status(400).json({ message: "Invalid type", allowed: ALLOWED_TYPES });

    const imageFiles = req.files?.images ?? [];
    const videoFilesList = req.files?.videos ?? [];

    const [images, videos] = await Promise.all([
      Promise.all(imageFiles.map(uploadImage)),
      Promise.all(videoFilesList.map(uploadVideo)),
    ]);

    const videoUrls = req.body.videoUrls
      ? Array.isArray(req.body.videoUrls) ? req.body.videoUrls : [req.body.videoUrls]
      : [];

    const culture = await CultureAmazigh.create(
      buildCultureDoc({ body: req.body, hostId: req.user._id, images, videos, videoUrls })
    );

    res.status(201).json(culture);
  } catch (error) {
    console.error("CREATE CULTURE ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────
// @desc    Admin creates a publication (host = admin, auto-approved)
// @route   POST /api/culture-amazigh/admin/create
// @access  Admin
// ─────────────────────────────────────────
export const createCultureByAdmin = async (req, res) => {
  try {
    console.log("CREATE CULTURE BY ADMIN - Request body:", req.body);
    console.log("CREATE CULTURE BY ADMIN - Files:", req.files);
    console.log("CREATE CULTURE BY ADMIN - User:", req.user);

    const { title, description, type } = req.body;

    if (!title || !description || !type)
      return res.status(400).json({ message: "title, description and type are required" });

    if (!ALLOWED_TYPES.includes(type))
      return res.status(400).json({ message: "Invalid type", allowed: ALLOWED_TYPES });

    const imageFiles = req.files?.images ?? [];
    const videoFilesList = req.files?.videos ?? [];

    console.log("Image files count:", imageFiles.length);
    console.log("Video files count:", videoFilesList.length);

    const [images, videos] = await Promise.all([
      Promise.all(imageFiles.map(uploadImage)),
      Promise.all(videoFilesList.map(uploadVideo)),
    ]);

    console.log("Uploaded images:", images);
    console.log("Uploaded videos:", videos);

    const videoUrls = req.body.videoUrls
      ? Array.isArray(req.body.videoUrls) ? req.body.videoUrls : [req.body.videoUrls]
      : [];

    const doc = buildCultureDoc({ body: req.body, hostId: req.user._id, images, videos, videoUrls });
    doc.isApproved = true;

    console.log("Creating document:", doc);

    const culture = await CultureAmazigh.create(doc);
    res.status(201).json(culture);
  } catch (error) {
    console.error("CREATE CULTURE BY ADMIN ERROR:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────
// @desc    Admin creates a publication on behalf of a vendor
// @route   POST /api/culture-amazigh/admin/for-vendor
// @access  Admin
// ─────────────────────────────────────────
export const createCultureForVendor = async (req, res) => {
  try {
    const { title, description, type, hostId } = req.body;

    if (!title || !description || !type || !hostId)
      return res.status(400).json({ message: "title, description, type and hostId are required" });

    if (!ALLOWED_TYPES.includes(type))
      return res.status(400).json({ message: "Invalid type", allowed: ALLOWED_TYPES });

    const vendor = await User.findById(hostId);
    if (!vendor || vendor.role !== "vendor")
      return res.status(400).json({ message: "Target user is not a vendor" });

    const imageFiles = req.files?.images ?? [];
    const videoFilesList = req.files?.videos ?? [];

    const [images, videos] = await Promise.all([
      Promise.all(imageFiles.map(uploadImage)),
      Promise.all(videoFilesList.map(uploadVideo)),
    ]);

    const videoUrls = req.body.videoUrls
      ? Array.isArray(req.body.videoUrls) ? req.body.videoUrls : [req.body.videoUrls]
      : [];

    const culture = await CultureAmazigh.create(
      buildCultureDoc({ body: req.body, hostId, images, videos, videoUrls })
    );

    res.status(201).json(culture);
  } catch (error) {
    console.error("CREATE CULTURE FOR VENDOR ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};
// ─────────────────────────────────────────
// @desc    Update a publication
// @route   PUT /api/culture-amazigh/:id
// @access  Private (owner | admin)
// ─────────────────────────────────────────
export const updateCulture = async (req, res) => {
  try {
    const culture = await CultureAmazigh.findById(req.params.id);
    if (!culture) return res.status(404).json({ message: "Publication not found" });

    const isOwner = culture.host.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) return res.status(403).json({ message: "Not authorized" });

    const updateData = {}; // ← declared first now

    // images
    let images = culture.images;
    if (req.files?.images?.length) {
      const newImages = await Promise.all(req.files.images.map((f) => uploadImage(f)));
      images = req.body.appendImages === "true" ? [...culture.images, ...newImages] : newImages;
    } else if (req.body.images !== undefined) {
      const incoming = Array.isArray(req.body.images) ? req.body.images : JSON.parse(req.body.images);
      images = incoming.filter((url) => !url.startsWith("blob:"));
    }
    updateData.images = images;

    // videos
    let videos = culture.videos ?? [];
    if (req.files?.videos?.length) {
      const newVideos = await Promise.all(req.files.videos.map(uploadVideo));
      videos = req.body.appendVideos === "true" ? [...culture.videos, ...newVideos] : newVideos;
    } else if (req.body.videos !== undefined) {
      videos = Array.isArray(req.body.videos) ? req.body.videos : JSON.parse(req.body.videos);
    }
    updateData.videos = videos;

    // videoUrls
    let videoUrls = culture.videoUrls ?? [];
    if (req.body.videoUrls !== undefined) {
      videoUrls = Array.isArray(req.body.videoUrls) ? req.body.videoUrls : [req.body.videoUrls];
    }
    updateData.videoUrls = videoUrls;

    // core fields
    const { Auteur, title, description, type, amenities } = req.body;
    if (Auteur !== undefined) updateData.Auteur = Auteur;
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (amenities !== undefined) {
      updateData.amenities = Array.isArray(amenities) ? amenities : JSON.parse(amenities);
    }
    if (type !== undefined) {
      if (!ALLOWED_TYPES.includes(type)) {
        return res.status(400).json({ message: "Invalid type", allowed: ALLOWED_TYPES });
      }
      updateData.type = type;
    }

    if (isAdmin) {
      const toBool = (v) => v === "true" || v === true;
      const { isApproved, isSuspended, isFeatured, isEditorsPick } = req.body;
      if (isApproved !== undefined) updateData.isApproved = toBool(isApproved);
      if (isSuspended !== undefined) updateData.isSuspended = toBool(isSuspended);
      if (isFeatured !== undefined) updateData.isFeatured = toBool(isFeatured);
      if (isEditorsPick !== undefined) updateData.isEditorsPick = toBool(isEditorsPick);
    }

    const updated = await CultureAmazigh.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { returnDocument: "after", runValidators: true }
    ).populate("host", "name email image");

    res.json(updated);
  } catch (error) {
    console.error("UPDATE CULTURE ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────
// @desc    Approve a publication (admin)
// @route   PATCH /api/culture-amazigh/:id/approve
// @access  Admin
// ─────────────────────────────────────────
export const approveCulture = async (req, res) => {
  try {
    const culture = await CultureAmazigh.findByIdAndUpdate(
      req.params.id,
      { isApproved: true },
      { new: true }
    );
    if (!culture) return res.status(404).json({ message: "Publication not found" });
    res.json({ message: "Publication approved", culture });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────
// @desc    Suspend / unsuspend a publication (admin)
// @route   PATCH /api/culture-amazigh/:id/suspend
// @access  Admin
// ─────────────────────────────────────────
export const suspendCulture = async (req, res) => {
  try {
    const culture = await CultureAmazigh.findById(req.params.id);
    if (!culture) return res.status(404).json({ message: "Publication not found" });

    const suspend =
      req.body.isSuspended !== undefined
        ? req.body.isSuspended === true || req.body.isSuspended === "true"
        : !culture.isSuspended;

    const updated = await CultureAmazigh.findByIdAndUpdate(
      req.params.id,
      { isSuspended: suspend, isApproved: !suspend },
      { new: true }
    );

    res.json({
      message: suspend ? "Publication suspended" : "Publication reactivated",
      culture: updated,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────
// @desc    Toggle featured / editors pick (admin)
// @route   PATCH /api/culture-amazigh/:id/feature
// @access  Admin
// ─────────────────────────────────────────
export const featureCulture = async (req, res) => {
  try {
    const culture = await CultureAmazigh.findById(req.params.id);
    if (!culture) return res.status(404).json({ message: "Publication not found" });

    const toBool = (v) => v === "true" || v === true;
    const updateData = {};

    if (req.body.isFeatured    !== undefined) updateData.isFeatured    = toBool(req.body.isFeatured);
    if (req.body.isEditorsPick !== undefined) updateData.isEditorsPick = toBool(req.body.isEditorsPick);

    const updated = await CultureAmazigh.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    );

    res.json({ message: "Publication updated", culture: updated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────
// @desc    Delete a publication
// @route   DELETE /api/culture-amazigh/:id
// @access  Private (owner | admin)
// ─────────────────────────────────────────
export const deleteCulture = async (req, res) => {
  try {
    const culture = await CultureAmazigh.findById(req.params.id);
    if (!culture) return res.status(404).json({ message: "Publication not found" });

    const isOwner = culture.host.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    await culture.deleteOne();
    res.json({ message: "Publication deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};