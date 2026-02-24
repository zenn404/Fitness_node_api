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

const parseNumber = (value) => {
  if (value === undefined || value === null) return NaN;
  if (typeof value === "number") return value;
  if (typeof value !== "string") return NaN;
  const normalized = value.replace(",", ".").trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : NaN;
};

const parseServingSizeGrams = (servingSize) => {
  if (!servingSize || typeof servingSize !== "string") return 100;
  const match = servingSize.match(/([\d.,]+)\s*g/i);
  if (!match) return 100;
  const grams = parseNumber(match[1]);
  return Number.isFinite(grams) && grams > 0 ? grams : 100;
};

const nutrientPerServing = (nutriments, servingSizeGrams, servingKey, per100gKey) => {
  const fromServing = parseNumber(nutriments?.[servingKey]);
  if (Number.isFinite(fromServing)) {
    return fromServing;
  }

  const from100g = parseNumber(nutriments?.[per100gKey]);
  if (!Number.isFinite(from100g)) {
    return 0;
  }

  return (from100g * servingSizeGrams) / 100;
};

const toNutritionItem = (product) => {
  const nutriments = product?.nutriments || {};
  const servingSizeGrams = parseServingSizeGrams(product?.serving_size);
  const name =
    product?.product_name_en ||
    product?.product_name ||
    product?.generic_name ||
    "Unknown food";

  return {
    name,
    calories: nutrientPerServing(
      nutriments,
      servingSizeGrams,
      "energy-kcal_serving",
      "energy-kcal_100g"
    ),
    serving_size_g: servingSizeGrams,
    protein_g: nutrientPerServing(
      nutriments,
      servingSizeGrams,
      "proteins_serving",
      "proteins_100g"
    ),
    carbohydrates_total_g: nutrientPerServing(
      nutriments,
      servingSizeGrams,
      "carbohydrates_serving",
      "carbohydrates_100g"
    ),
    fat_total_g: nutrientPerServing(nutriments, servingSizeGrams, "fat_serving", "fat_100g"),
    sugar_g: nutrientPerServing(nutriments, servingSizeGrams, "sugars_serving", "sugars_100g"),
    fiber_g: nutrientPerServing(nutriments, servingSizeGrams, "fiber_serving", "fiber_100g"),
  };
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

    if (typeof fetch !== "function") {
      return res.status(500).json({
        success: false,
        message:
          "Server runtime does not support fetch. Use Node.js 18+ or add a fetch polyfill.",
      });
    }

    const url =
      `https://world.openfoodfacts.org/cgi/search.pl` +
      `?search_terms=${encodeURIComponent(query)}` +
      `&search_simple=1&action=process&json=1&page_size=15` +
      `&fields=product_name,product_name_en,generic_name,serving_size,nutriments`;

    const response = await fetch(url);

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      console.error("OpenFoodFacts error:", response.status, text);

      return res.status(500).json({
        success: false,
        message: "Error fetching nutrition data from OpenFoodFacts",
        details: text ? text.slice(0, 240) : undefined,
      });
    }

    const data = await response.json().catch(() => ({}));
    const products = Array.isArray(data?.products) ? data.products : [];

    const items = products
      .map(toNutritionItem)
      .filter((item) => item.name && Number.isFinite(item.calories))
      .slice(0, 10);

    res.json({
      success: true,
      data: {
        items,
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
