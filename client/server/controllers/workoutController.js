const supabase = require("../config/supabase");

// Get all workouts
const getWorkouts = async (req, res) => {
  try {
    if (!supabase) {
      return res.status(503).json({
        success: false,
        message: "Database not configured.",
      });
    }

    const { user_id, difficulty } = req.query;

    let query = supabase
      .from("workouts")
      .select("*")
      .order("created_at", { ascending: false });

    if (user_id) {
      query = query.eq("user_id", user_id);
    }

    if (difficulty) {
      query = query.eq("difficulty", difficulty);
    }

    const { data: workouts, error } = await query;

    if (error) {
      console.error("Supabase error:", error);
      return res.status(500).json({
        success: false,
        message: "Error fetching workouts",
      });
    }

    res.json({
      success: true,
      data: { workouts },
      count: workouts.length,
    });
  } catch (error) {
    console.error("Get workouts error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching workouts",
    });
  }
};

// Get single workout with exercises
const getWorkout = async (req, res) => {
  try {
    if (!supabase) {
      return res.status(503).json({
        success: false,
        message: "Database not configured.",
      });
    }

    const { id } = req.params;

    // Get workout
    const { data: workout, error: workoutError } = await supabase
      .from("workouts")
      .select("*")
      .eq("id", id)
      .single();

    if (workoutError || !workout) {
      return res.status(404).json({
        success: false,
        message: "Workout not found",
      });
    }

    // Get exercises for this workout
    const { data: exercises, error: exercisesError } = await supabase
      .from("exercises")
      .select("*")
      .eq("workout_id", id)
      .order("order_index", { ascending: true });

    if (exercisesError) {
      console.error("Supabase error:", exercisesError);
    }

    res.json({
      success: true,
      data: {
        workout: {
          ...workout,
          exercises: exercises || [],
        },
      },
    });
  } catch (error) {
    console.error("Get workout error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching workout",
    });
  }
};

// Create new workout
const createWorkout = async (req, res) => {
  try {
    if (!supabase) {
      return res.status(503).json({
        success: false,
        message: "Database not configured.",
      });
    }

    const { name, description, difficulty, duration_minutes } = req.body;
    const user_id = req.user?.id || null;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Please provide workout name",
      });
    }

    const { data: workout, error } = await supabase
      .from("workouts")
      .insert([
        {
          user_id,
          name,
          description: description || null,
          difficulty: difficulty || "Beginner",
          duration_minutes: duration_minutes || null,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return res.status(500).json({
        success: false,
        message: "Error creating workout",
      });
    }

    res.status(201).json({
      success: true,
      message: "Workout created successfully",
      data: { workout },
    });
  } catch (error) {
    console.error("Create workout error:", error);
    res.status(500).json({
      success: false,
      message: "Server error creating workout",
    });
  }
};

// Update workout
const updateWorkout = async (req, res) => {
  try {
    if (!supabase) {
      return res.status(503).json({
        success: false,
        message: "Database not configured.",
      });
    }

    const { id } = req.params;
    const { name, description, difficulty, duration_minutes } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (difficulty !== undefined) updateData.difficulty = difficulty;
    if (duration_minutes !== undefined)
      updateData.duration_minutes = duration_minutes;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No update data provided",
      });
    }

    const { data: workout, error } = await supabase
      .from("workouts")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return res.status(500).json({
        success: false,
        message: "Error updating workout",
      });
    }

    res.json({
      success: true,
      message: "Workout updated successfully",
      data: { workout },
    });
  } catch (error) {
    console.error("Update workout error:", error);
    res.status(500).json({
      success: false,
      message: "Server error updating workout",
    });
  }
};

// Delete workout
const deleteWorkout = async (req, res) => {
  try {
    if (!supabase) {
      return res.status(503).json({
        success: false,
        message: "Database not configured.",
      });
    }

    const { id } = req.params;

    const { error } = await supabase.from("workouts").delete().eq("id", id);

    if (error) {
      console.error("Supabase error:", error);
      return res.status(500).json({
        success: false,
        message: "Error deleting workout",
      });
    }

    res.json({
      success: true,
      message: "Workout deleted successfully",
    });
  } catch (error) {
    console.error("Delete workout error:", error);
    res.status(500).json({
      success: false,
      message: "Server error deleting workout",
    });
  }
};

// Add exercise to workout
const addExerciseToWorkout = async (req, res) => {
  try {
    if (!supabase) {
      return res.status(503).json({
        success: false,
        message: "Database not configured.",
      });
    }

    const { id } = req.params;
    const { exercise_id, sets, reps, rest_seconds, order_index, notes } =
      req.body;

    if (!exercise_id) {
      return res.status(400).json({
        success: false,
        message: "Please provide exercise_id",
      });
    }

    const { data: workoutExercise, error } = await supabase
      .from("workout_exercises")
      .insert([
        {
          workout_id: id,
          exercise_id,
          sets: sets || 3,
          reps: reps || 10,
          rest_seconds: rest_seconds || 60,
          order_index: order_index || 0,
          notes: notes || null,
        },
      ])
      .select(
        `
        id,
        sets,
        reps,
        rest_seconds,
        order_index,
        notes,
        exercises (
          id,
          name,
          muscle_group
        )
      `,
      )
      .single();

    if (error) {
      console.error("Supabase error:", error);
      if (error.code === "23505") {
        return res.status(400).json({
          success: false,
          message: "Exercise already in this workout",
        });
      }
      return res.status(500).json({
        success: false,
        message: "Error adding exercise to workout",
      });
    }

    res.status(201).json({
      success: true,
      message: "Exercise added to workout",
      data: { workoutExercise },
    });
  } catch (error) {
    console.error("Add exercise to workout error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Remove exercise from workout
const removeExerciseFromWorkout = async (req, res) => {
  try {
    if (!supabase) {
      return res.status(503).json({
        success: false,
        message: "Database not configured.",
      });
    }

    const { id, exerciseId } = req.params;

    const { error } = await supabase
      .from("workout_exercises")
      .delete()
      .eq("workout_id", id)
      .eq("exercise_id", exerciseId);

    if (error) {
      console.error("Supabase error:", error);
      return res.status(500).json({
        success: false,
        message: "Error removing exercise from workout",
      });
    }

    res.json({
      success: true,
      message: "Exercise removed from workout",
    });
  } catch (error) {
    console.error("Remove exercise from workout error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Update exercise in workout (sets, reps, etc)
const updateWorkoutExercise = async (req, res) => {
  try {
    if (!supabase) {
      return res.status(503).json({
        success: false,
        message: "Database not configured.",
      });
    }

    const { id, exerciseId } = req.params;
    const { sets, reps, rest_seconds, order_index, notes } = req.body;

    const updateData = {};
    if (sets !== undefined) updateData.sets = sets;
    if (reps !== undefined) updateData.reps = reps;
    if (rest_seconds !== undefined) updateData.rest_seconds = rest_seconds;
    if (order_index !== undefined) updateData.order_index = order_index;
    if (notes !== undefined) updateData.notes = notes;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No update data provided",
      });
    }

    const { data: workoutExercise, error } = await supabase
      .from("workout_exercises")
      .update(updateData)
      .eq("workout_id", id)
      .eq("exercise_id", exerciseId)
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return res.status(500).json({
        success: false,
        message: "Error updating workout exercise",
      });
    }

    res.json({
      success: true,
      message: "Workout exercise updated",
      data: { workoutExercise },
    });
  } catch (error) {
    console.error("Update workout exercise error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = {
  getWorkouts,
  getWorkout,
  createWorkout,
  updateWorkout,
  deleteWorkout,
  addExerciseToWorkout,
  removeExerciseFromWorkout,
  updateWorkoutExercise,
};