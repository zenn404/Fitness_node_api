const supabase = require("../config/supabase");

// Get dashboard stats for a user
const getDashboardStats = async (req, res) => {
  try {
    if (!supabase) {
      return res.status(503).json({
        success: false,
        message: "Database not configured.",
      });
    }

    const userId = req.user?.id;

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    // Get this week's date range
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weekStartISO = weekStart.toISOString();

    // Count today's completed workouts
    let todayWorkouts = 0;
    let todayCalories = 0;
    let todayMinutes = 0;

    if (userId) {
      const { data: todayData } = await supabase
        .from("user_workout_sessions")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "completed")
        .gte("started_at", todayISO);

      if (todayData) {
        todayWorkouts = todayData.length;
        todayCalories = todayData.reduce(
          (sum, s) => sum + (s.calories_burned || 0),
          0,
        );
        todayMinutes = todayData.reduce(
          (sum, s) => sum + Math.floor((s.total_duration_seconds || 0) / 60),
          0,
        );
      }
    }

    // Count this week's workouts
    let weekWorkouts = 0;

    if (userId) {
      const { data: weekData } = await supabase
        .from("user_workout_sessions")
        .select("id")
        .eq("user_id", userId)
        .eq("status", "completed")
        .gte("started_at", weekStartISO);

      weekWorkouts = weekData?.length || 0;
    }

    res.json({
      success: true,
      data: {
        today: {
          workouts: todayWorkouts,
          calories: todayCalories,
          minutes: todayMinutes,
        },
        week: {
          workouts: weekWorkouts,
        },
      },
    });
  } catch (error) {
    console.error("Get dashboard stats error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching dashboard stats",
    });
  }
};

// Get recent activity for a user
const getRecentActivity = async (req, res) => {
  try {
    if (!supabase) {
      return res.status(503).json({
        success: false,
        message: "Database not configured.",
      });
    }

    const userId = req.user?.id;
    const limit = parseInt(req.query.limit) || 5;

    if (!userId) {
      return res.json({
        success: true,
        data: { activities: [] },
      });
    }

    const { data: sessions, error } = await supabase
      .from("user_workout_sessions")
      .select(
        `
        id,
        status,
        started_at,
        completed_at,
        total_duration_seconds,
        calories_burned,
        workouts (
          id,
          name,
          difficulty
        )
      `,
      )
      .eq("user_id", userId)
      .order("started_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Supabase error:", error);
      return res.status(500).json({
        success: false,
        message: "Error fetching recent activity",
      });
    }

    // Format the data
    const activities = (sessions || []).map((session) => ({
      id: session.id,
      title: session.workouts?.name || "Unknown Workout",
      difficulty: session.workouts?.difficulty || "Beginner",
      status: session.status,
      duration: session.total_duration_seconds
        ? `${Math.floor(session.total_duration_seconds / 60)} min`
        : null,
      calories: session.calories_burned,
      date: formatDate(session.started_at),
    }));

    res.json({
      success: true,
      data: { activities },
    });
  } catch (error) {
    console.error("Get recent activity error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching recent activity",
    });
  }
};

// Helper function to format date
function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) {
    return date.toLocaleDateString("en-US", { weekday: "long" });
  }
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// Get progress data (weekly chart + summary stats)
const getProgressData = async (req, res) => {
  try {
    if (!supabase) {
      return res.status(503).json({
        success: false,
        message: "Database not configured.",
      });
    }

    const userId = req.user?.id;

    if (!userId) {
      return res.json({
        success: true,
        data: {
          weeklyChart: [],
          totalStats: { workouts: 0, calories: 0, minutes: 0 },
        },
      });
    }

    // Get last 7 days range
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      days.push(date);
    }

    const weekStart = days[0].toISOString();

    // Get all completed sessions in the last 7 days
    const { data: sessions, error } = await supabase
      .from("user_workout_sessions")
      .select("started_at, total_duration_seconds, calories_burned, status")
      .eq("user_id", userId)
      .eq("status", "completed")
      .gte("started_at", weekStart)
      .order("started_at", { ascending: true });

    if (error) {
      console.error("Progress data error:", error);
      return res.status(500).json({
        success: false,
        message: "Error fetching progress data",
      });
    }

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    // Build chart data for each of the 7 days
    const weeklyChart = days.map((day) => {
      const dayLabel = dayNames[day.getDay()];
      const nextDay = new Date(day);
      nextDay.setDate(nextDay.getDate() + 1);

      const daySessions = (sessions || []).filter((s) => {
        const sessionDate = new Date(s.started_at);
        return sessionDate >= day && sessionDate < nextDay;
      });

      const workouts = daySessions.length;
      const minutes = daySessions.reduce(
        (sum, s) => sum + Math.floor((s.total_duration_seconds || 0) / 60),
        0,
      );
      const calories = daySessions.reduce(
        (sum, s) => sum + (s.calories_burned || 0),
        0,
      );

      return { day: dayLabel, workouts, minutes, calories };
    });

    // Get all-time stats
    const { data: allTimeSessions, error: allTimeError } = await supabase
      .from("user_workout_sessions")
      .select("total_duration_seconds, calories_burned")
      .eq("user_id", userId)
      .eq("status", "completed");

    const totalStats = {
      workouts: allTimeSessions?.length || 0,
      calories: (allTimeSessions || []).reduce(
        (sum, s) => sum + (s.calories_burned || 0),
        0,
      ),
      minutes: (allTimeSessions || []).reduce(
        (sum, s) => sum + Math.floor((s.total_duration_seconds || 0) / 60),
        0,
      ),
    };

    res.json({
      success: true,
      data: { weeklyChart, totalStats },
    });
  } catch (error) {
    console.error("Get progress data error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching progress data",
    });
  }
};

module.exports = {
  getDashboardStats,
  getRecentActivity,
  getProgressData,
};