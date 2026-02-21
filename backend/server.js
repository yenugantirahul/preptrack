import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import sheetRoutes from "./routes/sheetRoutes.js";

const app = express();
app.use(express.json());
dotenv.config();

const PORT = process.env.PORT || 50001;

app.use(
  cors({
    origin: ["https://preptrack-ten.vercel.app", "http://localhost:3000"],
    credentials: true,
  }),
);

app.use("/api/sheets", sheetRoutes);
app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
