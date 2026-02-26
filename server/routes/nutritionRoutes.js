const express = require("express");
const {
  getNutrition,
  getLogs,
  createLog,
  deleteLog,
} = require("../controllers/nutritionController");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

router.get("/nutrition", getNutrition);
router.get("/logs", authMiddleware, getLogs);
router.post("/logs", authMiddleware, createLog);
router.delete("/logs/:id", authMiddleware, deleteLog);

module.exports = router;
