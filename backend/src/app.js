import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json({ limit: "20kb" }));
app.use(express.urlencoded({ extended: true, limit: "20kb" }));
app.use(express.static("public"));

app.use(cookieParser());

//router Import
import healthcheckRouter from "./routes/healthcheck.routes.js";
import userRouter from "./routes/users.routes.js";
import blogRouter from "./routes/blogs.routes.js";
import followRouter from "./routes/follows.routes.js";

app.use("/api/v1/healthcheck", healthcheckRouter);

app.use("/api/v1/users", userRouter);
app.use("/api/v1/blogs", blogRouter);
app.use("/api/v1/follows", followRouter);

export { app };
