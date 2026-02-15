import express from "express";
import dotenv from "dotenv";
import { createClient } from "npm:@supabase/supabase-js@2";
dotenv.config();
const router = express.Router();

router.get("/", async (req, res) => {
  const { title, desc } = req.body;
});
