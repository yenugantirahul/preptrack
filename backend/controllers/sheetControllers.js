// middleware/authMiddleware.js
import dotenv from "dotenv";
dotenv.config();
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

// Helper to get authenticated user
async function getAuthenticatedUser(req) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Missing token");
  }

  const token = authHeader.split(" ")[1];

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    throw new Error("Invalid or expired token");
  }

  return user;
}

// =============================
// CREATE SHEET
// =============================
export const createSheet = async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    const userId = user.id;

    const { title } = req.body;

    if (!title || title.trim() === "") {
      return res.status(400).json({ error: "Title is required" });
    }

    const trimmedTitle = title.trim();

    // Check if sheet already exists for this user
    const { count, error: countError } = await supabase
      .from("Sheets")
      .select("id", { count: "exact", head: true })
      .eq("userid", userId)
      .eq("title", trimmedTitle);

    if (countError) {
      return res.status(400).json({ error: countError.message });
    }

    if (count > 0) {
      return res.status(400).json({
        error: "You already have a sheet with this title.",
      });
    }

    // Insert new sheet with authenticated user ID
    const { data, error } = await supabase
      .from("Sheets")
      .insert([
        {
          title: trimmedTitle,
          userid: userId, // ✅ ALWAYS from authenticated user
        },
      ])
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(201).json({
      message: "Sheet created successfully",
      sheet: data,
    });
  } catch (err) {
    return res.status(401).json({ error: err.message });
  }
};

// =============================
// GET SHEETS
// =============================
export async function getSheets(req, res) {
  try {
    const user = await getAuthenticatedUser(req);
    const userId = user.id;

    const { data, error } = await supabase
      .from("Sheets")
      .select("*")
      .eq("userid", userId)
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({ sheets: data });
  } catch (err) {
    return res.status(401).json({ error: err.message });
  }
}

export async function deleteSheet(req, res) {
  try {
    const user = await getAuthenticatedUser(req);
    const userId = user.id;

    const title = req.params.title;

    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }

    // ✅ Delete ONLY sheet that belongs to current user
    const { data, error } = await supabase
      .from("Sheets")
      .delete()
      .eq("userid", userId)
      .eq("title", title)
      .select(); // return deleted row

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({
        error: "Sheet not found or not owned by user",
      });
    }

    return res.status(200).json({
      deleted: data,
      message: "Deleted successfully",
    });
  } catch (err) {
    return res.status(401).json({ error: err.message });
  }
}
