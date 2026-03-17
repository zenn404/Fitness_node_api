const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");
const {
  getExercises,
  getExercise,
  createExercise,
  updateExercise,
  deleteExercise,
  getExercisesByMuscleGroup,
} = require("../controllers/exerciseController");

// Public routes - anyone can view exercises
router.get("/", getExercises);
router.get("/grouped", getExercisesByMuscleGroup);
router.get("/:id", getExercise);

// Protected routes - require authentication
router.post("/", authMiddleware, adminOnly, createExercise);
router.put("/:id", authMiddleware, adminOnly, updateExercise);
router.delete("/:id", authMiddleware, adminOnly, deleteExercise);

module.exports = router;
