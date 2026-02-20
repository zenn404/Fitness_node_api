const supabase = require("../config/supabase");

// Start a new workout session
const startSession = async (req, res) => {
  try {
    if (!supabase) {
      return res.status(503).json({
        success: false,
        message: "Database not configured.",
      });
    }

    const userId = req.user?.id;
    const { workout_id } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated.",
      });
    }

    if (!workout_id) {
      return res.status(400).json({
        success: false,
        message: "workout_id is required.",
      });
    }

    const { data, error } = await supabase
      .from("user_workout_sessions")
      .insert({
        user_id: userId,
        workout_id,
        status: "in_progress",
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Start session error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to start workout session.",
      });
    }

    res.status(201).json({
      success: true,
      message: "Workout session started.",
      data: { session: data },
    });
  } catch (error) {
    console.error("Start session error:", error);
    res.status(500).json({
      success: false,
      message: "Error starting workout session.",
    });
  }
};

// Complete a workout session
const completeSession = async (req, res) => {
  try {
    if (!supabase) {
      return res.status(503).json({
        success: false,
        message: "Database not configured.",
      });
    }

    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated.",
      });
    }

    // Fetch the session to calculate duration
    const { data: session, error: fetchError } = await supabase
      .from("user_workout_sessions")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (fetchError || !session) {
      return res.status(404).json({
        success: false,
        message: "Workout session not found.",
      });
    }

    if (session.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "Session is already completed.",
      });
    }

    const completedAt = new Date();
    const startedAt = new Date(session.started_at);
    const totalDurationSeconds = Math.floor((completedAt - startedAt) / 1000);

    // Estimate calories: ~7 kcal per minute of exercise
    const durationMinutes = Math.floor(totalDurationSeconds / 60);
    const caloriesBurned = durationMinutes * 7;

    const { data, error } = await supabase
      .from("user_workout_sessions")
      .update({
        status: "completed",
        completed_at: completedAt.toISOString(),
        total_duration_seconds: totalDurationSeconds,
        calories_burned: caloriesBurned,
      })
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      console.error("Complete session error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to complete workout session.",
      });
    }

    res.json({
      success: true,
      message: "Workout session completed.",
      data: { session: data },
    });
  } catch (error) {
    console.error("Complete session error:", error);
    res.status(500).json({
      success: false,
      message: "Error completing workout session.",
    });
  }
};

module.exports = {
  startSession,
  completeSession,
};