const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const {
  getDashboardStats,
  getRecentActivity,
  getProgressData,
} = require("../controllers/dashboardController");

router.get("/stats", authMiddleware, getDashboardStats);
router.get("/activity", authMiddleware, getRecentActivity);
router.get("/progress", authMiddleware, getProgressData);

module.exports = router;