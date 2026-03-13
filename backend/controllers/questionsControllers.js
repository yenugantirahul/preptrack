import dotenv from "dotenv";
dotenv.config();

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
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

function getQuestionName(url) {
  const parts = url.split("/").filter(Boolean);
  return parts[parts.length - 1] || "Untitled";
}

export const createQuestion = async (req, res) => {
  try {
    await getAuthenticatedUser(req);

    const { url, platform, difficulty, no } = req.body;

    if (!url || !platform || !difficulty) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const title = getQuestionName(url);

    const { data, error } = await supabase
      .from("Questions")
      .insert([
        {
          title,
          url,
          platform,
          difficulty,
        },
      ])
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(201).json({
      message: "Question created successfully",
      question: data,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";

    if (message === "Missing token" || message === "Invalid or expired token") {
      return res.status(401).json({ error: message });
    }

    return res.status(500).json({ error: message });
  }
};

export const createLink = async (req, res) => {
  try {
    await getAuthenticatedUser(req);

    const { sid, qid } = req.body;

    if (!sid || !qid) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const { data, error } = await supabase
      .from("sheetquestions")
      .insert([
        {
          sheetid: sid,
          questionid: qid,
        },
      ])
      .select();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({
      message: "Link successful",
      ques: data,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";

    if (message === "Missing token" || message === "Invalid or expired token") {
      return res.status(401).json({ error: message });
    }

    return res.status(500).json({ error: message });
  }
};
export const updatestatus = async (req, res) => {
  try {
    const { sid, qid } = req.body;

    if (!sid || !qid) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Get all question IDs in the sheet
    const { data, error: err1 } = await supabase
      .from("sheetquestions")
      .select("questionid")
      .eq("sheetid", sid);

    if (err1) throw err1;

    const questionIds = data.map(q => q.questionid);

    // Get their statuses
    const { data: ques, error: err2 } = await supabase
      .from("Questions")
      .select("id, status")
      .in("id", questionIds);

    if (err2) throw err2;

    // Find the specific question
    const question = ques.find(q => q.id === qid);

    if (!question) {
      return res.status(404).json({ error: "Question not found" });
    }

    const newStatus = !question.status;

    // Update status
    const { error: err3 } = await supabase
      .from("Questions")
      .update({ status: newStatus })
      .eq("id", qid);

    if (err3) throw err3;

    return res.json({
      message: "Status updated successfully",
      status: newStatus
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};


export const getQuestions = async (req, res) => {
  try {
    const sheetId = req.params.id;

    if (!sheetId) {
      return res.status(400).json({ message: "sheetId is required" });
    }

    const { data, error } = await supabase
      .from("sheetquestions")
      .select("questionid")
      .eq("sheetid", sheetId);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const questionIds = data.map((q) => q.questionid);

    if (questionIds.length === 0) {
      return res.status(200).json({
        message: "Successful",
        ques: [],
      });
    }

    const { data: questions, error: qerror } = await supabase
      .from("Questions")
      .select("*")
      .in("id", questionIds);

    if (qerror) {
      return res.status(500).json({ error: qerror.message });
    }

    return res.status(200).json({
      message: "Successful",
      ques: questions,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return res.status(500).json({ error: message });
  }
};
