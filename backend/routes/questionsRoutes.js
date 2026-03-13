import express from "express";
import {
  createQuestion,
  createLink,
  getQuestions,
  updatestatus,
} from "../controllers/questionsControllers.js";
const router = express.Router();

router.post("/create", createQuestion);
router.post("/linkquestion", createLink);
router.get("/getquestions/:id", getQuestions);
router.patch("/updatestatus/:id", updatestatus);

export default router;
