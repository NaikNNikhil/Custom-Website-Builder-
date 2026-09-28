import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { env } from "./config/env";
import { errorMiddleware } from "./middleware/error.middleware";
import routes from "./routes";

const app = express();

// Security middleware
app.use(helmet());

// CORS
app.use(
  cors({
    origin: env.frontendUrl,
    credentials: true,
  })
);
// JSON parser
app.use(express.json());

// cookie
app.use(cookieParser());

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Server running",
  });
});

app.use("/api", routes);
app.use(errorMiddleware);

export default app;