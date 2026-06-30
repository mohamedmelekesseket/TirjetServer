import Notification from "../models/Notification.js";
import User from "../models/User.js";

// ─────────────────────────────────────────
// @desc    Get notifications for logged-in user
// @route   GET /api/notifications
// @access  Private
// ─────────────────────────────────────────
export const getMyNotifications = async (req, res) => {
  try {
    const { unreadOnly = false, limit = 20 } = req.query;
    
    const filter = { recipient: req.user._id };
    if (unreadOnly === "true") {
      filter.isRead = false;
    }

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false,
    });

    res.json({ notifications, unreadCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────
// @desc    Mark notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
// ─────────────────────────────────────────
export const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    if (notification.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    notification.isRead = true;
    await notification.save();

    res.json({ message: "Marked as read", notification });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────
// @desc    Mark all notifications as read
// @route   PATCH /api/notifications/mark-all-read
// @access  Private
// ─────────────────────────────────────────
export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { isRead: true }
    );

    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────
// @desc    Delete a notification
// @route   DELETE /api/notifications/:id
// @access  Private
// ─────────────────────────────────────────
export const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    if (notification.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await notification.deleteOne();
    res.json({ message: "Notification deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────
// @desc    Helper function to create notification
// ─────────────────────────────────────────
export const createNotification = async ({
  recipient,
  type,
  title,
  message,
  relatedId,
  relatedModel,
}) => {
  try {
    console.log("[createNotification] Creating notification for recipient:", recipient);
    console.log("[createNotification] Type:", type, "Title:", title);
    const notification = await Notification.create({
      recipient,
      type,
      title,
      message,
      relatedId,
      relatedModel,
    });
    console.log("[createNotification] Notification created successfully, ID:", notification._id);
    return notification;
  } catch (error) {
    console.error("[createNotification] Error:", error);
    // Don't throw - notifications shouldn't break the main flow
  }
};

// ─────────────────────────────────────────
// @desc    Helper function to get admin users
// ─────────────────────────────────────────
export const getAdminUsers = async () => {
  try {
    const admins = await User.find({ role: "admin" }).select("_id email name");
    return admins;
  } catch (error) {
    console.error("[getAdminUsers]", error);
    return [];
  }
};
