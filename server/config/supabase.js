const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

let supabase = null;

// Only create client if credentials are provided
if (
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
  }
} else {
  console.warn(
    "⚠️  Supabase credentials not configured. Running in demo mode."
  );
  console.warn(
    "   Set SUPABASE_URL and SUPABASE_ANON_KEY in .env to enable database features."
  );
}

module.exports = supabase;