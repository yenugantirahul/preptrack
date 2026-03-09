import express from "express";
import {
  createQuestion,
  createLink,
  getQuestions,
} from "../controllers/questionsControllers.js";
const router = express.Router();

router.post("/create", createQuestion);
router.post("/linkquestion", createLink);
router.get("/getquestions/:id", getQuestions)
export default router;
