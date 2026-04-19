import ArtisanProfile from "../models/ArtisanProfile.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import cloudinary from "../config/cloudinary.js";
import fs from "fs";

const uploadImage = async (filePath) => {
  const result = await cloudinary.uploader.upload(filePath, {
    folder: "artisana/artisans",
    transformation: [{ quality: "auto", fetch_format: "auto" }],
  });
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  return result.secure_url;
};

export const getAllArtisans = async (req, res) => {
  try {
    const { approved, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (approved === "true") filter.isApproved = true;
    if (approved === "false") filter.isApproved = false;

    const total = await ArtisanProfile.countDocuments(filter);
    const artisans = await ArtisanProfile.find(filter)
      .populate("user", "name email image status createdAt")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      artisans,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getArtisanByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    let artisan = await ArtisanProfile.findOne({ user: userId })
      .populate("user", "-password")
      .lean();

    if (!artisan) {
      const user = await User.findById(userId).select("-password").lean();

      if (!user) {
        return res.status(404).json({ message: "Artisan introuvable." });
      }

      artisan = {
        _id: null,
        user,
        phone: null,
        region: null,
        specialite: null,
        description: null,
        instagram: null,
        website: null,
        images: [],
        isApproved: false,
        createdAt: user.createdAt,
      };
    }

    const products = await Product.find({
      artisan: userId,
      isApproved: true,
      stock: { $gt: 0 },
    })
      .select("title description price images category stock")
      .lean();

    return res.json({ ...artisan, products });
  } catch (error) {
    console.error("[getArtisanByUserId]", error);
    return res.status(500).json({ message: "Erreur serveur." });
  }
};

export const getMyProfile = async (req, res) => {
  try {
    const artisan = await ArtisanProfile.findOne({ user: req.user._id }).populate(
      "user",
      "name email image"
    );

    if (!artisan) return res.status(404).json({ message: "Profile not found" });

    res.json(artisan);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const upsertMyProfile = async (req, res) => {
  try {
    const { phone, region, specialite, description, instagram, website } = req.body;

    const update = { phone, region, specialite, description, instagram, website };

    if (req.files && req.files.length > 0) {
      const urls = await Promise.all(req.files.map((f) => uploadImage(f.path)));
      update.images = urls;
    }

    const artisan = await ArtisanProfile.findOneAndUpdate(
      { user: req.user._id },
      { $set: update },
      { new: true, upsert: true }
    ).populate("user", "name email image");

    res.json(artisan);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const approveArtisan = async (req, res) => {
  try {
    const artisan = await ArtisanProfile.findById(req.params.id);
    if (!artisan) return res.status(404).json({ message: "Artisan not found" });

    artisan.isApproved = true;
    await artisan.save();

    await User.findByIdAndUpdate(artisan.user, { role: "vendor", status: "active" });

    res.json({ message: "Artisan approved successfully", artisan });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const rejectArtisan = async (req, res) => {
  try {
    const artisan = await ArtisanProfile.findById(req.params.id);
    if (!artisan) return res.status(404).json({ message: "Artisan not found" });

    artisan.isApproved = false;
    await artisan.save();

    await User.findByIdAndUpdate(artisan.user, { status: "blocked" });

    res.json({ message: "Artisan rejected/suspended", artisan });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteArtisan = async (req, res) => {
  try {
    const artisan = await ArtisanProfile.findByIdAndDelete(req.params.id);
    if (!artisan) return res.status(404).json({ message: "Artisan not found" });

    res.json({ message: "Artisan profile deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const applyAsArtisan = async (req, res) => {
  try {
    const { phone, region, specialite, description } = req.body;

    const existing = await ArtisanProfile.findOne({ user: req.user._id });
    if (existing) {
      return res.status(400).json({ message: "You already submitted an application" });
    }

    let images = [];
    if (req.files && req.files.length > 0) {
      images = await Promise.all(req.files.map((f) => uploadImage(f.path)));
    }

    const profile = await ArtisanProfile.create({
      user: req.user._id,
      phone,
      region,
      specialite,
      description,
      images,
      isApproved: false,
    });

    res.status(201).json({ message: "Application submitted successfully", profile });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};