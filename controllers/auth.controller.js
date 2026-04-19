import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

const getGoogleClient = () => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) throw new Error("Missing GOOGLE_CLIENT_ID on server");
  return new OAuth2Client(clientId);
};

async function verifyGoogleIdToken(idToken) {
  const client = getGoogleClient();
  const ticket = await client.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  if (!payload?.email) throw new Error("Google token missing email");
  return {
    name: payload.name || payload.email,
    email: payload.email,
    image: payload.picture,
  };
}

async function verifyFacebookAccessToken(accessToken) {
  if (!accessToken) throw new Error("Missing Facebook access token");
  // Requires valid Facebook app settings to return email.
  const url =
    "https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token=" +
    encodeURIComponent(accessToken);
  const resp = await fetch(url);
  const data = await resp.json();
  if (!resp.ok) {
    const msg = data?.error?.message || "Facebook token invalid";
    throw new Error(msg);
  }
  if (!data?.email) throw new Error("Facebook account has no email (or permission missing)");
  return {
    name: data.name || data.email,
    email: data.email,
    image: data?.picture?.data?.url,
  };
}

// ─────────────────────────────────────────
// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
// ─────────────────────────────────────────
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      provider: "credentials",
    });

    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────
// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
// ─────────────────────────────────────────
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });

    if (!user || !user.password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (user.status === "blocked") {
      return res.status(403).json({ message: "Your account has been blocked" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user._id);

    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        image: user.image,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────
// @desc    Get currently logged-in user
// @route   GET /api/auth/me
// @access  Private
// ─────────────────────────────────────────
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────
// @desc    Update password
// @route   PUT /api/auth/password
// @access  Private
// ─────────────────────────────────────────
export const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Both passwords are required" });
    }

    const user = await User.findById(req.user._id);

    if (!user.password) {
      return res
        .status(400)
        .json({ message: "Password change not allowed for OAuth accounts" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// ─────────────────────────────────────────
// @desc    OAuth login/register (Google, Facebook)
// @route   POST /api/auth/oauth
// @access  Public
// ─────────────────────────────────────────
export const oauthLogin = async (req, res) => {
  try {
    const { provider, idToken, accessToken } = req.body;

    if (!provider || !["google", "facebook"].includes(provider)) {
      return res.status(400).json({ message: "Invalid provider" });
    }

    let profile;
    if (provider === "google") {
      if (!idToken) return res.status(400).json({ message: "Missing Google idToken" });
      profile = await verifyGoogleIdToken(idToken);
    } else {
      if (!accessToken) return res.status(400).json({ message: "Missing Facebook accessToken" });
      profile = await verifyFacebookAccessToken(accessToken);
    }

    const { name, email, image } = profile;

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name,
        email,
        image,
        provider,
        isVerified: true,
        password: null,
      });
    } else {
      // Update image in case it changed
      if (image) user.image = image;
      if (provider && user.provider !== provider && user.provider === "credentials") {
        user.provider = provider;
      }
      await user.save();
    }

    const token = generateToken(user._id);

    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        image: user.image,
        status: user.status,
      },
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ─────────────────────────────────────────
// @desc    Link NextAuth session → API JWT (Vercel → Railway, trusted internal key)
// @route   POST /api/auth/link-nextauth
// @access  Internal (x-internal-key)
// ─────────────────────────────────────────
export const linkNextAuth = async (req, res) => {
  try {
    const key = req.headers["x-internal-key"];
    if (!process.env.INTERNAL_API_KEY || key !== process.env.INTERNAL_API_KEY) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { name, email, image, provider } = req.body;
    if (!email) return res.status(400).json({ message: "Email required" });
    if (!provider || !["google", "facebook"].includes(provider)) {
      return res.status(400).json({ message: "Invalid provider" });
    }

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name: name || email,
        email,
        image,
        provider,
        isVerified: true,
        password: null,
      });
    } else {
      if (image) user.image = image;
      if (provider && user.provider !== provider && user.provider === "credentials") {
        user.provider = provider;
      }
      await user.save();
    }

    const token = generateToken(user._id);

    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        image: user.image,
        status: user.status,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};





