const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");

// Mock data or simple implementation
// You should replace this with actual controller logic later

router.get("/stats", authMiddleware, (req, res) => {
  res.json({
    success: true,
    data: {
      today: {
        workouts: 0,
        calories: 0,
        minutes: 0,
      },
      week: {
        workouts: 0,
      },
    },
  });
});

router.get("/activity", authMiddleware, (req, res) => {
  res.json({
    success: true,
    data: {
      activities: [],
    },
  });
});

router.get("/progress", authMiddleware, (req, res) => {
  res.json({
    success: true,
    data: {
      labels: [],
      datasets: [],
    },
  });
});

module.exports = router;
