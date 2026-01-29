const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
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
router.post("/", authMiddleware, createWorkout);
router.put("/:id", authMiddleware, updateWorkout);
router.delete("/:id", authMiddleware, deleteWorkout);

// Workout exercises management
router.post("/:id/exercises", authMiddleware, addExerciseToWorkout);
router.put("/:id/exercises/:exerciseId", authMiddleware, updateWorkoutExercise);
router.delete(
  "/:id/exercises/:exerciseId",
  authMiddleware,
  removeExerciseFromWorkout
);

module.exports = router;