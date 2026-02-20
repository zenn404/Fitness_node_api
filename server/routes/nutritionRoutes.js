const express = require("express");
const {
  getNutrition,
  getLogs,
  createLog,
  deleteLog,
} = require("../controllers/nutritionController");

const router = express.Router();

router.get("/nutrition", getNutrition);
router.get("/logs", getLogs);
router.post("/logs", createLog);
router.delete("/logs/:id", deleteLog);

module.exports = router;
