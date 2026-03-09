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

function getQuestionName(url) {
  const parts = url.split("/");
  return parts[parts.length - 3];
}

// Create Question
export const createQuestion = async (req, res) => {
  try {
    const { url, platform, difficulty, no } = req.body;
    const title = getQuestionName(url);
    if (!url || !platform || !difficulty) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const { data, error } = await supabase
      .from("Questions")
      .insert([
        {
          si: no,
          title: title,
          url: url,
          platform: platform,
          difficulty: difficulty,
        },
      ])
      .select()
      .single();
    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(201).json({
      message: "Question created successfully",
      question: data,
    });
  } catch (err) {
    return res.status(400).json({ error: error.message });
  }
};


// Create Link
export const createLink = async (req, res) => {
  try {
    const { sid, qid } = req.body;
    if (!sid || !qid) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const { data, error } = await supabase.from("sheetquestions").insert([
      {
        sheetid: sid,
        questionid: qid,
      },
    ]);

    if (error) {
      return res.status(400).json({ err: error });
    }
    return res.status(400).json({
      message: "Link successful",
      ques: data,
    });
  } catch (err) {
    return res.status(400).json({ error: err });
  }
};


// GET Questions
export const getQuestions = async (req, res) => {
  try {
    const  sheetId  = req.params.id;

    if (!sheetId) {
      return res.status(400).json({ message: "sheetId is required" });
    }

    // Step 1: get question ids from sheetquestions
    const { data, error } = await supabase
      .from("sheetquestions")
      .select("questionid")
      .eq("sheetid", sheetId);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Step 2: extract ids
    const questionIds = data.map(q => q.questionid);

    // Step 3: fetch questions using those ids
    const { data: questions, error: qerror } = await supabase
      .from("Questions")
      .select("*")
      .in("id", questionIds);

    if (qerror) {
      return res.status(500).json({ error: qerror.message });
    }

    return res.status(200).json({
  message: "Successful",
  ques: questions
});

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};