const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");
const {
  getWorkouts,
  getWorkout,
  createWorkout,
  updateWorkout,
  deleteWorkout,
  addExerciseToWorkout,
  removeExerciseFromWorkout,
  updateWorkoutExercise,
} = require("../controllers/workoutController");

// Public routes - anyone can view workouts
router.get("/", getWorkouts);
router.get("/:id", getWorkout);

// Protected routes - require authentication
router.post("/", authMiddleware, adminOnly, createWorkout);
router.put("/:id", authMiddleware, adminOnly, updateWorkout);
router.delete("/:id", authMiddleware, adminOnly, deleteWorkout);

// Workout exercises management
router.post("/:id/exercises", authMiddleware, adminOnly, addExerciseToWorkout);
router.put("/:id/exercises/:exerciseId", authMiddleware, adminOnly, updateWorkoutExercise);
router.delete(
  "/:id/exercises/:exerciseId",
  authMiddleware,
  adminOnly,
  removeExerciseFromWorkout
);

module.exports = router;
