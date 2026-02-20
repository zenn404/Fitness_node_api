const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const {
  register,
  login,
  logout,
  getProfile,
  updateProfile,
  refreshToken,
  deleteAccount,
} = require("../controllers/authController");

// Public routes
router.post("/register", register);
router.post("/login", login);

// Protected routes (require authentication)
router.post("/logout", authMiddleware, logout);
router.get("/profile", authMiddleware, getProfile);
router.put("/profile", authMiddleware, updateProfile);
router.post("/refresh", authMiddleware, refreshToken);
router.delete("/account", authMiddleware, deleteAccount);

module.exports = router;