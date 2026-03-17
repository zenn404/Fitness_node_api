const bcrypt = require("bcryptjs");
const supabase = require("../config/supabase");

const normalizeGender = (value) => {
  if (!value) return null;
  const normalized = String(value).toLowerCase();
  return ["male", "female", "other"].includes(normalized) ? normalized : null;
};

const getUsers = async (req, res) => {
  try {
    if (!supabase) {
      return res.status(503).json({
        success: false,
        message: "Database not configured.",
      });
    }

    const { data: users, error } = await supabase
      .from("users")
      .select("id, name, email, role, gender, age, weight, height, goals, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Admin users error:", error);
      return res.status(500).json({
        success: false,
        message: "Error fetching users",
      });
    }

    res.json({
      success: true,
      data: { users: users || [] },
      count: users?.length || 0,
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching users",
    });
  }
};

const createUser = async (req, res) => {
  try {
    if (!supabase) {
      return res.status(503).json({
        success: false,
        message: "Database not configured.",
      });
    }

    const { name, email, password, role, gender } = req.body;
    const normalizedRole = role === "admin" ? "admin" : "user";
    const normalizedGender = normalizeGender(gender);

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, email, and password",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const { data: user, error } = await supabase
      .from("users")
      .insert([
        {
          name,
          email,
          password: hashedPassword,
          role: normalizedRole,
          gender: normalizedGender,
          created_at: new Date().toISOString(),
        },
      ])
      .select("id, name, email, role, gender, age, weight, height, goals, created_at")
      .single();

    if (error) {
      console.error("Create admin user error:", error);
      return res.status(500).json({
        success: false,
        message: "Error creating user",
      });
    }

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: { user },
    });
  } catch (error) {
    console.error("Create user error:", error);
    res.status(500).json({
      success: false,
      message: "Server error creating user",
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    if (!supabase) {
      return res.status(503).json({
        success: false,
        message: "Database not configured.",
      });
    }

    const { id } = req.params;

    if (req.user?.id === id) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own account here",
      });
    }

    const { error } = await supabase.from("users").delete().eq("id", id);

    if (error) {
      console.error("Delete user error:", error);
      return res.status(500).json({
        success: false,
        message: "Error deleting user",
      });
    }

    res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({
      success: false,
      message: "Server error deleting user",
    });
  }
};

module.exports = {
  getUsers,
  createUser,
  deleteUser,
};
