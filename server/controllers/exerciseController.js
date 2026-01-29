const supabase = require("../config/supabase");

// Get all exercises
const getExercises = async (req, res) => {
  try {
    if (!supabase) {
      return res.status(503).json({
        success: false,
        message: "Database not configured.",
      });
    }

    const { muscle_group, difficulty, search } = req.query;

    let query = supabase
      .from("exercises")
      .select("*")
      .order("created_at", { ascending: false });

    // Filter by muscle group
    if (muscle_group) {
      query = query.eq("muscle_group", muscle_group);
    }

    // Filter by difficulty
    if (difficulty) {
      query = query.eq("difficulty", difficulty);
    }

    // Search by name
    if (search) {
      query = query.ilike("name", `%${search}%`);
    }

    const { data: exercises, error } = await query;

    if (error) {
      console.error("Supabase error:", error);
      return res.status(500).json({
        success: false,
        message: "Error fetching exercises",
      });
    }

    res.json({
      success: true,
      data: { exercises },
      count: exercises.length,
    });
  } catch (error) {
    console.error("Get exercises error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching exercises",
    });
  }
};

// Get single exercise by ID
const getExercise = async (req, res) => {
  try {
    if (!supabase) {
      return res.status(503).json({
        success: false,
        message: "Database not configured.",
      });
    }

    const { id } = req.params;

    const { data: exercise, error } = await supabase
      .from("exercises")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !exercise) {
      return res.status(404).json({
        success: false,
        message: "Exercise not found",
      });
    }

    res.json({
      success: true,
      data: { exercise },
    });
  } catch (error) {
    console.error("Get exercise error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching exercise",
    });
  }
};

// Create new exercise
const createExercise = async (req, res) => {
  try {
    if (!supabase) {
      return res.status(503).json({
        success: false,
        message: "Database not configured.",
      });
    }

    const { name, description, muscle_group, difficulty, image_url } = req.body;

    if (!name || !muscle_group) {
      return res.status(400).json({
        success: false,
        message: "Please provide name and muscle_group",
      });
    }

    const { data: exercise, error } = await supabase
      .from("exercises")
      .insert([
        {
          name,
          description: description || null,
          muscle_group,
          difficulty: difficulty || "Beginner",
          image_url: image_url || null,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      if (error.code === "23505") {
        return res.status(400).json({
          success: false,
          message: "Exercise with this name already exists",
        });
      }
      return res.status(500).json({
        success: false,
        message: "Error creating exercise",
      });
    }

    res.status(201).json({
      success: true,
      message: "Exercise created successfully",
      data: { exercise },
    });
  } catch (error) {
    console.error("Create exercise error:", error);
    res.status(500).json({
      success: false,
      message: "Server error creating exercise",
    });
  }
};

// Update exercise
const updateExercise = async (req, res) => {
  try {
    if (!supabase) {
      return res.status(503).json({
        success: false,
        message: "Database not configured.",
      });
    }

    const { id } = req.params;
    const { name, description, muscle_group, difficulty, image_url } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (muscle_group !== undefined) updateData.muscle_group = muscle_group;
    if (difficulty !== undefined) updateData.difficulty = difficulty;
    if (image_url !== undefined) updateData.image_url = image_url;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No update data provided",
      });
    }

    const { data: exercise, error } = await supabase
      .from("exercises")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      if (error.code === "23505") {
        return res.status(400).json({
          success: false,
          message: "Exercise with this name already exists",
        });
      }
      return res.status(500).json({
        success: false,
        message: "Error updating exercise",
      });
    }

    if (!exercise) {
      return res.status(404).json({
        success: false,
        message: "Exercise not found",
      });
    }

    res.json({
      success: true,
      message: "Exercise updated successfully",
      data: { exercise },
    });
  } catch (error) {
    console.error("Update exercise error:", error);
    res.status(500).json({
      success: false,
      message: "Server error updating exercise",
    });
  }
};

// Delete exercise
const deleteExercise = async (req, res) => {
  try {
    if (!supabase) {
      return res.status(503).json({
        success: false,
        message: "Database not configured.",
      });
    }

    const { id } = req.params;

    const { error } = await supabase.from("exercises").delete().eq("id", id);

    if (error) {
      console.error("Supabase error:", error);
      return res.status(500).json({
        success: false,
        message: "Error deleting exercise",
      });
    }

    res.json({
      success: true,
      message: "Exercise deleted successfully",
    });
  } catch (error) {
    console.error("Delete exercise error:", error);
    res.status(500).json({
      success: false,
      message: "Server error deleting exercise",
    });
  }
};

// Get exercises grouped by muscle group
const getExercisesByMuscleGroup = async (req, res) => {
  try {
    if (!supabase) {
      return res.status(503).json({
        success: false,
        message: "Database not configured.",
      });
    }

    const { data: exercises, error } = await supabase
      .from("exercises")
      .select("*")
      .order("muscle_group", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      return res.status(500).json({
        success: false,
        message: "Error fetching exercises",
      });
    }

    // Group by muscle_group
    const grouped = exercises.reduce((acc, exercise) => {
      const group = exercise.muscle_group;
      if (!acc[group]) {
        acc[group] = [];
      }
      acc[group].push(exercise);
      return acc;
    }, {});

    res.json({
      success: true,
      data: { grouped },
    });
  } catch (error) {
    console.error("Get exercises by muscle group error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = {
  getExercises,
  getExercise,
  createExercise,
  updateExercise,
  deleteExercise,
  getExercisesByMuscleGroup,
};