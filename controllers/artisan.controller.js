import ArtisanProfile from "../models/ArtisanProfile.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import cloudinary from "../config/cloudinary.js";
import fs from "fs";

// artisan.controller.js

const uploadFromBuffer = (buffer) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "artisana/artisans",
        transformation: [{ quality: "auto", fetch_format: "auto" }],
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });

const uploadImage = async (fileOrPath) => {
  // Called with a multer file object (memoryStorage)
  if (fileOrPath?.buffer) {
    return uploadFromBuffer(fileOrPath.buffer);
  }
  // Called with a disk path (diskStorage)
  if (typeof fileOrPath === "string") {
    const result = await cloudinary.uploader.upload(fileOrPath, {
      folder: "artisana/artisans",
      transformation: [{ quality: "auto", fetch_format: "auto" }],
    });
    if (fs.existsSync(fileOrPath)) fs.unlinkSync(fileOrPath);
    return result.secure_url;
  }
  throw new Error("uploadImage: invalid argument");
};

export const getAllArtisans = async (req, res) => {
  try {
    const { approved } = req.query;
    const filter = {};
    if (approved === "true")  filter.isApproved = true;
    if (approved === "false") filter.isApproved = false;

    const artisans = await ArtisanProfile.find(filter)
      .populate("user", "name email image status createdAt")
      .sort({ rank: 1, createdAt: -1 }); // ranked first (1,2,3...), unranked last

    res.json({ artisans, total: artisans.length });
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
      if (!user) return res.status(404).json({ message: "Artisan introuvable." });

      artisan = {
        _id: null,
        user,
        phone: null,
        region: null,
        city: null,
        specialite: null,
        description: null,
        instagram: null,
        facebook: null,
        tiktok: null,
        website: null,
        experience: null,
        languages: [],
        tags: [],
        images: [],
        isApproved: false,
        isPremium: false,
        notes: null,
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
    const { phone, region, city, specialite, description,
            instagram, facebook, tiktok, website, experience,
            languages, tags } = req.body;

    const update = {
      phone, region, city, specialite, description,
      instagram, facebook, tiktok, website, experience,
      languages: Array.isArray(languages) ? languages : languages?.split(",").map(s => s.trim()),
      tags:      Array.isArray(tags)      ? tags      : tags?.split(",").map(s => s.trim()),
    };

    const profileFile = req.files?.profilePhoto?.[0];
    if (profileFile) {
      // Works with both memoryStorage (buffer) and diskStorage (path)
      update.profilePhoto = await uploadImage(profileFile.buffer ? profileFile : profileFile.path);
    }

    const galleryFiles = req.files?.images;
    if (galleryFiles?.length > 0) {
      update.images = await Promise.all(
        galleryFiles.map(f => uploadImage(f.buffer ? f : f.path))
      );
    }

    const artisan = await ArtisanProfile.findOneAndUpdate(
      { user: req.user._id },
      { $set: update },
      { returnDocument: "after", upsert: true }   // also fixes the mongoose warning
    ).populate("user", "name email image");

    res.json(artisan);
  } catch (error) {
    console.error("[upsertMyProfile]", error);
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
    const { phone, region, city, specialite, description } = req.body;

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
      city,
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

export const getAllApprovedArtisans = async (req, res) => {
  try {
    const artisans = await ArtisanProfile.find({ isApproved: true })
      .populate("user", "name image")
      // ranked artisans (rank: 1, 2, 3…) come first; unranked (null) come last
      .sort({ rank: 1, createdAt: -1 });
    res.json(artisans);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const adminUpdateArtisan = async (req, res) => {
  try {
    const FORBIDDEN = ["user", "_id", "__v"];
    const update = Object.fromEntries(
      Object.entries(req.body).filter(([k]) => !FORBIDDEN.includes(k))
    );

    if (req.files && req.files.length > 0) {
      update.images = await Promise.all(req.files.map((f) => uploadImage(f.path)));
    }

    const artisan = await ArtisanProfile.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true, runValidators: false }
    ).populate("user", "name email image status createdAt");

    if (!artisan) return res.status(404).json({ message: "Artisan not found" });

    res.json(artisan);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * PATCH /api/artisans/:id/rank
 * Body: { rank: 1 }        → set rank
 *       { rank: null }     → remove rank (unranked)
 *
 * Admin only — protect this route with your isAdmin middleware.
 */
export const setArtisanRank = async (req, res) => {
  try {
    const { rank } = req.body;

    // Validate: must be a positive integer or null
    if (rank !== null && (!Number.isInteger(rank) || rank < 1)) {
      return res.status(400).json({
        message: "rank must be a positive integer (1, 2, 3…) or null to remove it.",
      });
    }

    // If assigning a rank, clear it from any other artisan first (unique ranks)
    if (rank !== null) {
      await ArtisanProfile.updateMany(
        { rank, _id: { $ne: req.params.id } },
        { $set: { rank: null } }
      );
    }

    const artisan = await ArtisanProfile.findByIdAndUpdate(
      req.params.id,
      { $set: { rank: rank ?? null } },
      { new: true, runValidators: false }
    ).populate("user", "name email image");

    if (!artisan) return res.status(404).json({ message: "Artisan not found" });

    res.json({ message: `Rank ${rank ?? "removed"} applied.`, artisan });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};