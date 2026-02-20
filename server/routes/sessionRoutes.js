const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");

router.post("/start", authMiddleware, (req, res) => {
  const { workout_id } = req.body;
  // Mock response
  res.json({
    success: true,
    data: {
      session: {
        id: "mock-session-id",
        workout_id,
        start_time: new Date().toISOString(),
        status: "in_progress",
      },
    },
  });
});

router.put("/:id/complete", authMiddleware, (req, res) => {
  const { id } = req.params;
  // Mock response
  res.json({
    success: true,
    data: {
      session: {
        id,
        end_time: new Date().toISOString(),
        status: "completed",
      },
    },
  });
});

module.exports = router;
