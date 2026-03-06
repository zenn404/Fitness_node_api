const supabase = require("../config/supabase");
const USDA_API_KEY = (process.env.USDA_API_KEY || "DEMO_KEY").trim();
const USDA_SEARCH_URL = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${encodeURIComponent(
  USDA_API_KEY,
)}`;

const isValidDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value);
const isMissingUserIdColumn = (error) =>
  Boolean(
    error &&
      error.message &&
      error.message.toLowerCase().includes("user_id") &&
      error.message.toLowerCase().includes("column"),
  );

const isMissingDailyLogsTable = (error) =>
  Boolean(
    error &&
      error.code === "PGRST205" &&
      error.message &&
      error.message.toLowerCase().includes("public.daily_logs"),
  );

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

const normalizeText = (value = "") =>
  value
    .toString()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const getQueryTokens = (query) =>
  normalizeText(query)
    .split(" ")
    .filter((token) => token.length >= 2);

const toSearchText = (product) =>
  normalizeText(
    [
      product?.product_name_en,
      product?.product_name,
      product?.generic_name,
      product?.description,
      product?.brandOwner,
      product?.brands,
      product?.categories,
      product?.ingredients,
    ]
      .filter(Boolean)
      .join(" "),
  );

const toNameText = (product) =>
  normalizeText(
    [
      product?.product_name_en,
      product?.product_name,
      product?.generic_name,
      product?.description,
    ]
      .filter(Boolean)
      .join(" "),
  );

const isLikelyGarbageName = (name) => {
  const normalized = normalizeText(name);
  if (!normalized) return true;
  if (/^\d+$/.test(normalized.replace(/\s/g, ""))) return true;
  return normalized.length < 2;
};

const getMatchedTokenCount = (text, tokens) => {
  if (!text || tokens.length === 0) return 0;
  let matched = 0;
  for (const token of tokens) {
    const wholeWord = new RegExp(`(^|\\s)${token}(\\s|$)`).test(text);
    const startsWithWord = new RegExp(`(^|\\s)${token}`).test(text);
    if (wholeWord || startsWithWord || text.includes(token)) {
      matched += 1;
    }
  }
  return matched;
};

const getMatchScore = (nameText, searchText, query, queryTokens, hasEnglishName) => {
  if (!searchText) return 0;

  let score = 0;
  const normalizedQuery = normalizeText(query);

  if (normalizedQuery && nameText === normalizedQuery) {
    score += 300;
  }
  if (normalizedQuery && nameText.startsWith(normalizedQuery)) {
    score += 180;
  }
  if (normalizedQuery && nameText.includes(normalizedQuery)) {
    score += 110;
  }

  let matchedTokens = 0;
  for (const token of queryTokens) {
    const wholeWord = new RegExp(`(^|\\s)${token}(\\s|$)`).test(nameText);
    const startsWithWord = new RegExp(`(^|\\s)${token}`).test(nameText);
    if (wholeWord) {
      score += 70;
      matchedTokens += 1;
    } else if (startsWithWord) {
      score += 45;
      matchedTokens += 1;
    } else if (nameText.includes(token)) {
      score += 20;
      matchedTokens += 1;
    }
  }

  if (queryTokens.length > 0 && matchedTokens === queryTokens.length) {
    score += 120;
  } else if (matchedTokens > 0) {
    score += matchedTokens * 15;
  }

  // Metadata can help as a tie-breaker, but should never dominate ranking.
  if (normalizedQuery && searchText.includes(normalizedQuery)) {
    score += 10;
  }

  if (hasEnglishName) {
    score += 35;
  }

  return score;
};

const getNutrientValueByIds = (food, nutrientIds) => {
  const nutrients = Array.isArray(food?.foodNutrients) ? food.foodNutrients : [];
  const match = nutrients.find((nutrient) =>
    nutrientIds.includes(Number(nutrient?.nutrientId)),
  );
  const value = Number(match?.value ?? match?.amount);
  return Number.isFinite(value) ? value : 0;
};

const getNutrientValueByName = (food, nameMatchers) => {
  const nutrients = Array.isArray(food?.foodNutrients) ? food.foodNutrients : [];
  const match = nutrients.find((nutrient) => {
    const name = normalizeText(nutrient?.nutrientName || "");
    if (!name) return false;
    return nameMatchers.some((matcher) => name.includes(matcher));
  });
  const value = Number(match?.value ?? match?.amount);
  return Number.isFinite(value) ? value : 0;
};

const toNutritionItem = (food) => {
  const name = food?.description || "Unknown food";
  const servingSize =
    Number.isFinite(Number(food?.servingSize)) &&
    normalizeText(food?.servingSizeUnit || "") === "g"
      ? Number(food.servingSize)
      : 100;

  return {
    name,
    calories:
      getNutrientValueByIds(food, [1008]) || // Energy (kcal)
      getNutrientValueByName(food, ["energy"]),
    serving_size_g: servingSize > 0 ? servingSize : 100,
    protein_g:
      getNutrientValueByIds(food, [1003]) || // Protein
      getNutrientValueByName(food, ["protein"]),
    carbohydrates_total_g:
      getNutrientValueByIds(food, [1005]) || // Carbohydrate, by difference
      getNutrientValueByName(food, ["carbohydrate"]),
    fat_total_g:
      getNutrientValueByIds(food, [1004]) || // Total lipid (fat)
      getNutrientValueByName(food, ["total lipid", "fat"]),
    sugar_g:
      getNutrientValueByIds(food, [2000]) || // Sugars, total including NLEA
      getNutrientValueByName(food, ["sugars"]),
    fiber_g:
      getNutrientValueByIds(food, [1079]) || // Fiber, total dietary
      getNutrientValueByName(food, ["fiber"]),
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

    const response = await fetch(USDA_SEARCH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: query.trim(),
        pageSize: 30,
        dataType: ["Foundation", "SR Legacy", "Survey (FNDDS)", "Branded"],
      }),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      console.error("USDA FDC error:", response.status, text);

      return res.status(500).json({
        success: false,
        message: "Error fetching nutrition data from USDA FoodData Central",
        details: text ? text.slice(0, 240) : undefined,
      });
    }

    const data = await response.json().catch(() => ({}));
    const foods = Array.isArray(data?.foods) ? data.foods : [];

    const queryTokens = getQueryTokens(query);
    const rankedItems = foods
      .map((food) => {
        const displayName = food?.description || "";
        const nameText = toNameText(food);
        const searchText = toSearchText(food);
        const score = getMatchScore(nameText, searchText, query, queryTokens, true);
        const matchedNameTokens = getMatchedTokenCount(nameText, queryTokens);
        const item = toNutritionItem(food);
        return { item, score, matchedNameTokens, displayName };
      })
      .filter(
        ({ item, score, matchedNameTokens, displayName }) =>
          item.name &&
          Number.isFinite(item.calories) &&
          score > 0 &&
          !isLikelyGarbageName(displayName) &&
          (queryTokens.length === 0 || matchedNameTokens > 0),
      )
      .sort((a, b) => b.score - a.score);

    const items =
      rankedItems.length > 0
        ? rankedItems.slice(0, 10).map((entry) => entry.item)
        : foods
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
      .eq("user_id", req.user.id)
      .eq("log_date", date)
      .order("created_at", { ascending: false });

    if (error) {
      if (isMissingUserIdColumn(error) || isMissingDailyLogsTable(error)) {
        return res.json({
          success: true,
          data: { logs: [] },
          count: 0,
          message:
            "daily_logs schema is missing; returning empty logs. Run migration server/database/2026-02-26-add-gender-and-user-logs.sql.",
        });
      }
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
        user_id: req.user.id,
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
      if (isMissingUserIdColumn(error) || isMissingDailyLogsTable(error)) {
        return res.status(503).json({
          success: false,
          message:
            "daily_logs schema is missing. Please run migration server/database/2026-02-26-add-gender-and-user-logs.sql.",
        });
      }
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

    const { error } = await supabase
      .from("daily_logs")
      .delete()
      .eq("id", id)
      .eq("user_id", req.user.id);

    if (error) {
      if (isMissingUserIdColumn(error) || isMissingDailyLogsTable(error)) {
        return res.status(503).json({
          success: false,
          message:
            "daily_logs schema is missing. Please run migration server/database/2026-02-26-add-gender-and-user-logs.sql.",
        });
      }
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
