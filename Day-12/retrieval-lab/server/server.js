import "dotenv/config";
import express from "express";
import cors from "cors";
import documentRoutes from "./routes/documentRoutes.js";
import labRoutes from "./routes/labRoutes.js";
import errorHandler from "./middleware/errorHandler.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

app.use("/api/documents", documentRoutes);
app.use("/api/documents", labRoutes);
app.use(errorHandler);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
