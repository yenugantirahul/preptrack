import express from "express";
import { createSheet } from "../controllers/sheetControllers.js";
import { getSheets } from "../controllers/sheetControllers.js";
import { deleteSheet } from "../controllers/sheetControllers.js";

const router = express.Router();

router.post("/create", createSheet);
router.get("/get", getSheets);
router.delete("/delete/:title", deleteSheet);

export default router;
