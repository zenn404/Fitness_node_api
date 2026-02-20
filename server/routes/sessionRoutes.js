const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const {
  startSession,
  completeSession,
} = require("../controllers/sessionController");

router.post("/start", authMiddleware, startSession);
router.put("/:id/complete", authMiddleware, completeSession);

module.exports = router;