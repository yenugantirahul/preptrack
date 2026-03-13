import express from "express";
import { createSheet } from "../controllers/sheetControllers.js";
import { getSheets } from "../controllers/sheetControllers.js";
import { deleteSheet } from "../controllers/sheetControllers.js";
import { updatestatus } from "../controllers/questionsControllers.js";
const router = express.Router();

router.post("/create", createSheet);
router.get("/get", getSheets);
router.delete("/delete/:id", deleteSheet);

export default router;
