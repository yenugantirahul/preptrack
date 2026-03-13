import dotenv from "dotenv";
dotenv.config();
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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

// CREATE SHEET
export const createSheet = async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    const userId = user.id;

    const { title, desc } = req.body;

    if (!title || title.trim() === "") {
      return res.status(400).json({ error: "Title is required" });
    }

    const trimmedTitle = title.trim();
    const trimmedDesc = desc?.trim() || "";

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

    const { data, error } = await supabase
      .from("Sheets")
      .insert([
        {
          title: trimmedTitle,
          Description: trimmedDesc,
          userid: userId,
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

// GET SHEETS
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

// DELETE SHEET
export const deleteSheet = async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    const userId = user.id;
    const { id } = req.params;

    const { data, error } = await supabase
      .from("Sheets")
      .delete()
      .eq("id", id)
      .eq("userid", userId)
      .select();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (!data || data.length === 0) {
      return res
        .status(404)
        .json({ error: "Sheet not found or not authorized" });
    }

    return res.status(200).json({
      message: "Deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};