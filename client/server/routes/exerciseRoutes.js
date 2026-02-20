const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
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
router.post("/", authMiddleware, createExercise);
router.put("/:id", authMiddleware, updateExercise);
router.delete("/:id", authMiddleware, deleteExercise);

module.exports = router;