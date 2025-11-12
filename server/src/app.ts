import compression from "compression";
import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import morgan from "morgan";
import apiRouter from "./api/api";
import { connectDB } from "./config/connectMongo";

export const configApp = () => {
  connectDB(process.env.MONGODB_URI ?? "");

  const app = express();

  app.use(compression());
  app.use(cors({ origin: true }));
  app.use(morgan("dev"));

  app.use("/", apiRouter);

  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: "Not found" });
  });

  app.use(
    (error: unknown, _req: Request, res: Response, _next: NextFunction) => {
      console.error("Unhandled error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  );

  return app;
};
