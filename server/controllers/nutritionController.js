const supabase = require("../config/supabase");

const isValidDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value);

const toNumber = (value, field, required = false) => {
  if (value === undefined || value === null || value === "") {
    if (required) {
      throw new Error(`${field} is required`);
    }
    return 0;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`${field} must be a number`);
  }
  return parsed;
};

const getNutrition = async (req, res) => {
  try {
    const query = req.query.query;

    if (!query || typeof query !== "string" || !query.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please provide a nutrition query",
      });
    }

    const apiKey = process.env.CALORIE_NINJAS_KEY;
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message: "CalorieNinjas API key not configured",
      });
    }

    const url = `https://api.calorieninjas.com/v1/nutrition?query=${encodeURIComponent(
      query
    )}`;

    const response = await fetch(url, {
      headers: {
        "X-Api-Key": apiKey,
      },
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      console.error("CalorieNinjas error:", response.status, text);
      return res.status(500).json({
        success: false,
        message: "Error fetching nutrition data",
      });
    }

    const data = await response.json();

    res.json({
      success: true,
      data: {
        items: Array.isArray(data.items) ? data.items : [],
      },
    });
  } catch (error) {
    console.error("Nutrition search error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching nutrition data",
    });
  }
};

const getLogs = async (req, res) => {
  try {
    if (!supabase) {
      return res.status(503).json({
        success: false,
        message: "Database not configured.",
      });
    }

    const date = req.query.date;
    if (!date || typeof date !== "string" || !isValidDate(date)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid date (YYYY-MM-DD)",
      });
    }

    const { data: logs, error } = await supabase
      .from("daily_logs")
      .select("*")
      .eq("log_date", date)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase error:", error);
      return res.status(500).json({
        success: false,
        message: "Error fetching daily logs",
      });
    }

    res.json({
      success: true,
      data: { logs },
      count: logs.length,
    });
  } catch (error) {
    console.error("Get logs error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching daily logs",
    });
  }
};

const createLog = async (req, res) => {
  try {
    if (!supabase) {
      return res.status(503).json({
        success: false,
        message: "Database not configured.",
      });
    }

    const {
      name,
      calories,
      protein,
      carbs,
      fat,
      sugar,
      fiber,
      serving_size,
      log_date,
    } = req.body || {};

    if (!name || typeof name !== "string") {
      return res.status(400).json({
        success: false,
        message: "Please provide a food name",
      });
    }

    if (log_date && !isValidDate(log_date)) {
      return res.status(400).json({
        success: false,
        message: "log_date must be in YYYY-MM-DD format",
      });
    }

    let payload;
    try {
      payload = {
        name: name.trim(),
        calories: toNumber(calories, "calories", true),
        protein: toNumber(protein, "protein"),
        carbs: toNumber(carbs, "carbs"),
        fat: toNumber(fat, "fat"),
        sugar: toNumber(sugar, "sugar"),
        fiber: toNumber(fiber, "fiber"),
        serving_size: toNumber(serving_size, "serving_size"),
        ...(log_date ? { log_date } : {}),
      };
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    const { data: log, error } = await supabase
      .from("daily_logs")
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return res.status(500).json({
        success: false,
        message: "Error creating daily log",
      });
    }

    res.status(201).json({
      success: true,
      message: "Log created successfully",
      data: { log },
    });
  } catch (error) {
    console.error("Create log error:", error);
    res.status(500).json({
      success: false,
      message: "Server error creating daily log",
    });
  }
};

const deleteLog = async (req, res) => {
  try {
    if (!supabase) {
      return res.status(503).json({
        success: false,
        message: "Database not configured.",
      });
    }

    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Log id is required",
      });
    }

    const { error } = await supabase.from("daily_logs").delete().eq("id", id);

    if (error) {
      console.error("Supabase error:", error);
      return res.status(500).json({
        success: false,
        message: "Error deleting daily log",
      });
    }

    res.json({
      success: true,
      message: "Log deleted successfully",
    });
  } catch (error) {
    console.error("Delete log error:", error);
    res.status(500).json({
      success: false,
      message: "Server error deleting daily log",
    });
  }
};

module.exports = {
  getNutrition,
  getLogs,
  createLog,
  deleteLog,
};
