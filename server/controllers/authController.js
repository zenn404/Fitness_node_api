const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const supabase = require("../config/supabase");

// Cookie options
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

const normalizeGender = (value) => {
  if (!value) return undefined;
  const normalized = String(value).toLowerCase();
  return ["male", "female", "other"].includes(normalized)
    ? normalized
    : undefined;
};

const isMissingColumnError = (error, columnName) =>
  Boolean(
    error &&
      error.message &&
      error.message.toLowerCase().includes(`column`) &&
      error.message.toLowerCase().includes(columnName.toLowerCase()),
  );

const isMissingUsersProfileColumnError = (error) =>
  Boolean(
    error &&
      error.code === "PGRST204" &&
      error.message &&
      error.message.toLowerCase().includes("column") &&
      error.message.toLowerCase().includes("users") &&
      ["age", "weight", "height", "goals", "gender"].some((col) =>
        error.message.toLowerCase().includes(`'${col}'`),
      ),
  );

const USER_PROFILE_COLUMNS = [
  "id",
  "email",
  "name",
  "gender",
  "age",
  "weight",
  "height",
  "goals",
  "created_at",
];

const getMissingColumnFromError = (error) => {
  if (!error || error.code !== "PGRST204" || !error.message) return null;
  const match = error.message.match(/'([^']+)' column/);
  return match?.[1] || null;
};

const buildUserSelect = (columns) => columns.join(", ");

const getUserWithAvailableColumns = async (userId) => {
  let columns = [...USER_PROFILE_COLUMNS];

  while (columns.length > 0) {
    const result = await supabase
      .from("users")
      .select(buildUserSelect(columns))
      .eq("id", userId)
      .single();

    if (!result.error) {
      return { user: result.data, error: null, columns };
    }

    const missingColumn = getMissingColumnFromError(result.error);
    if (missingColumn && columns.includes(missingColumn)) {
      columns = columns.filter((column) => column !== missingColumn);
      continue;
    }

    return { user: null, error: result.error, columns };
  }

  return {
    user: null,
    error: { message: "No readable profile columns found in users table." },
    columns,
  };
};

// Register new user
const register = async (req, res) => {
  try {
    // Check if Supabase is configured
    if (!supabase) {
      return res.status(503).json({
        success: false,
        message: "Database not configured. Please set up Supabase credentials.",
      });
    }

    const { email, password, name, gender } = req.body;
    const normalizedGender = normalizeGender(gender);

    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: "Please provide email, password, and name",
      });
    }

    // Check if user already exists
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

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user in Supabase
    let { data: newUser, error } = await supabase
      .from("users")
      .insert([
        {
          email,
          password: hashedPassword,
          name,
          ...(normalizedGender ? { gender: normalizedGender } : {}),
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error && normalizedGender && isMissingColumnError(error, "gender")) {
      const retry = await supabase
        .from("users")
        .insert([
          {
            email,
            password: hashedPassword,
            name,
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();
      newUser = retry.data;
      error = retry.error;
    }

    if (error) {
      console.error("Supabase error:", error);
      return res.status(500).json({
        success: false,
        message: "Error creating user",
      });
    }

    // Generate token
    const token = generateToken(newUser);

    // Set cookie
    res.cookie("token", token, cookieOptions);

    // Return user without password
    const { password: _, ...userWithoutPassword } = newUser;

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        user: userWithoutPassword,
        token,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during registration",
    });
  }
};

// Login user
const login = async (req, res) => {
  try {
    if (!supabase) {
      return res.status(503).json({
        success: false,
        message: "Database not configured. Please set up Supabase credentials.",
      });
    }

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    // Find user
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (error || !user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Generate token
    const token = generateToken(user);

    // Set cookie
    res.cookie("token", token, cookieOptions);

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      message: "Login successful",
      data: {
        user: userWithoutPassword,
        token,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during login",
    });
  }
};

// Logout user
const logout = async (req, res) => {
  try {
    res.cookie("token", "", {
      httpOnly: true,
      expires: new Date(0),
    });

    res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during logout",
    });
  }
};

// Get current user profile
const getProfile = async (req, res) => {
  try {
    if (!supabase) {
      return res.status(503).json({
        success: false,
        message: "Database not configured.",
      });
    }

    const { user, error } = await getUserWithAvailableColumns(req.user.id);

    if (error || !user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching profile",
    });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    if (!supabase) {
      return res.status(503).json({
        success: false,
        message: "Database not configured.",
      });
    }

    const { name, email, age, weight, height, goals, gender } = req.body;
    const normalizedGender = normalizeGender(gender);
    const updateData = {};

    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (age !== undefined) updateData.age = age;
    if (weight !== undefined) updateData.weight = weight;
    if (height !== undefined) updateData.height = height;
    if (goals !== undefined) updateData.goals = goals;
    if (gender !== undefined) updateData.gender = normalizedGender || null;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No update data provided",
      });
    }

    let retryUpdateData = { ...updateData };
    let retrySelectColumns = [...USER_PROFILE_COLUMNS];
    let user = null;
    let error = null;

    while (Object.keys(retryUpdateData).length > 0) {
      const result = await supabase
        .from("users")
        .update(retryUpdateData)
        .eq("id", req.user.id)
        .select(buildUserSelect(retrySelectColumns))
        .single();

      user = result.data;
      error = result.error;

      if (!error) break;

      const missingColumn = getMissingColumnFromError(error);
      if (!missingColumn) break;

      let changed = false;
      if (missingColumn in retryUpdateData) {
        delete retryUpdateData[missingColumn];
        changed = true;
      }
      if (retrySelectColumns.includes(missingColumn)) {
        retrySelectColumns = retrySelectColumns.filter(
          (column) => column !== missingColumn,
        );
        changed = true;
      }

      if (!changed) break;
    }

    // If no profile columns exist for update, allow onboarding flow to continue.
    if (error && Object.keys(retryUpdateData).length === 0) {
      const fallback = await getUserWithAvailableColumns(req.user.id);
      if (!fallback.error && fallback.user) {
        user = fallback.user;
        error = null;
      }
    }

    if (error) {
      console.error("Update profile supabase error:", error);
      if (isMissingUsersProfileColumnError(error)) {
        return res.status(500).json({
          success: false,
          message:
            "users profile columns are missing. Run migration server/database/2026-02-26-add-gender-and-user-logs.sql.",
        });
      }
      return res.status(500).json({
        success: false,
        message: error.message || "Error updating profile",
      });
    }

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: { user },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error updating profile",
    });
  }
};

// Refresh token
const refreshToken = async (req, res) => {
  try {
    // User is already verified by auth middleware
    const token = generateToken(req.user);

    // Set new cookie
    res.cookie("token", token, cookieOptions);

    res.json({
      success: true,
      message: "Token refreshed successfully",
      data: { token },
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    res.status(500).json({
      success: false,
      message: "Server error refreshing token",
    });
  }
};

// Change current user's password
const changePassword = async (req, res) => {
  try {
    if (!supabase) {
      return res.status(503).json({
        success: false,
        message: "Database not configured.",
      });
    }

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const { data: user, error: findError } = await supabase
      .from("users")
      .select("id, password")
      .eq("id", req.user.id)
      .single();

    if (findError || !user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    const { error: updateError } = await supabase
      .from("users")
      .update({ password: hashedPassword })
      .eq("id", req.user.id);

    if (updateError) {
      return res.status(500).json({
        success: false,
        message: "Error updating password",
      });
    }

    res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error changing password",
    });
  }
};

// Delete user account
const deleteAccount = async (req, res) => {
  try {
    if (!supabase) {
      return res.status(503).json({
        success: false,
        message: "Database not configured.",
      });
    }

    const { error } = await supabase
      .from("users")
      .delete()
      .eq("id", req.user.id);

    if (error) {
      return res.status(500).json({
        success: false,
        message: "Error deleting account",
      });
    }

    // Clear cookie
    res.cookie("token", "", {
      httpOnly: true,
      expires: new Date(0),
    });

    res.json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("Delete account error:", error);
    res.status(500).json({
      success: false,
      message: "Server error deleting account",
    });
  }
};

module.exports = {
  register,
  login,
  logout,
  getProfile,
  updateProfile,
  refreshToken,
  deleteAccount,
  changePassword,
};
