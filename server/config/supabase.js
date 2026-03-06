const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseKey = supabaseServiceRoleKey || supabaseAnonKey;

let supabase = null;

// Only create client if credentials are provided
if (
  supabaseUrl &&
  supabaseKey &&
  supabaseUrl !== "your_supabase_project_url" &&
  supabaseKey !== "your_supabase_anon_key"
) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    if (supabaseServiceRoleKey) {
      console.log("✅ Supabase connected successfully (service role key)");
    } else {
      console.log("✅ Supabase connected successfully (anon key)");
      console.warn(
        "⚠️  SUPABASE_SERVICE_ROLE_KEY is not set. Some write operations can fail depending on RLS policies."
      );
    }
  } catch (error) {
    console.error("⚠️  Supabase connection failed:", error.message);
  }
} else {
  console.warn(
    "⚠️  Supabase credentials not configured. Running in demo mode."
  );
  console.warn(
    "   Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY) in .env to enable database features."
  );
}

module.exports = supabase;
