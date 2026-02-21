// middleware/authMiddleware.js
import dotenv from "dotenv";
dotenv.config();
import { createClient } from "@supabase/supabase-js";
import { jwtVerify, createRemoteJWKSet } from "jose";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const JWKS = createRemoteJWKSet(
  new URL(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/.well-known/jwks.json`,
  ),
);

export const createSheet = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing token" });
    }

    const token = authHeader.split(" ")[1];

    const { payload } = await jwtVerify(token, JWKS);

    const userId = payload.sub;
    // 3️⃣ Validate input
    const { title } = req.body;

    if (!title || title.trim() === "") {
      return res.status(400).json({ error: "Title is required" });
    }

    // 4️⃣ Insert into Supabase
    const { data, error } = await supabase
      .from("Sheets")
      .insert([
        {
          Title: title.trim(),
          Description: desc;
          userId: userId,
        },
      ])
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // 5️⃣ Success response
    return res.status(201).json({
      message: "Sheet created successfully",
      sheet: data,
    });
  } catch (err) {
    return res.status(401).json({
      error: "Invalid or expired token",
    });
  }
};

export const getUserSheets = async (req, res) => {
  try {
    // 1️⃣ Extract token
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing token" });
    }

    const token = authHeader.split(" ")[1];

    // 2️⃣ Verify JWT
    const { payload } = await jwtVerify(token, JWKS);

    const userId = payload.sub;

    if (!userId) {
      return res.status(401).json({ error: "Invalid token: no user id" });
    }

    // 3️⃣ Fetch only sheets belonging to user
    const { data, error } = await supabase
      .from("Sheets")
      .select("*")
      .eq("user_id", userId)   // 🔐 critical security filter
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({
      sheets: data
    });

  } catch (err) {
    console.error(err);
    return res.status(401).json({
      error: "Invalid or expired token"
    });
  }
};
