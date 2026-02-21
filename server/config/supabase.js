const { createClient } = require("@supabase/supabase-js");
const MockSupabase = require("./mockSupabase");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

let supabase = null;

const useMock = process.env.MOCK_DB === "true";

if (useMock) {
  console.log("🔶 Using Mock Database (Environment Flag)");
  supabase = new MockSupabase();
} else if (
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== "your_supabase_project_url" &&
  supabaseAnonKey !== "your_supabase_anon_key"
) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log("✅ Supabase connected successfully");
  } catch (error) {
    console.error("⚠️  Supabase connection failed:", error.message);
    console.log("🔶 Falling back to Mock Database");
    supabase = new MockSupabase();
  }
} else {
  console.warn(
    "⚠️  Supabase credentials not configured. Running in Mock Mode."
  );
  console.log("🔶 Using Mock Database");
  supabase = new MockSupabase();
}

module.exports = supabase;