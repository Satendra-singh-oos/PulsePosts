import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { rateLimit } from "express-rate-limit";
import requestIp from "request-ip";
import { ApiError } from "./utils/ApiError.js";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(requestIp.mw());

// Rate limiter to avoid misuse of the service and avoid cost spikes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5000, // Limit each IP to 500 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  keyGenerator: (req, res) => {
    return req.clientIp; // IP address from requestIp.mw(), as opposed to req.ip
  },
  handler: (_, __, ___, options) => {
    throw new ApiError(
      options.statusCode || 500,
      `There are too many requests. You are only allowed ${
        options.max
      } requests per ${options.windowMs / 60000} minutes`
    );
  },
});
// Apply the rate limiting middleware to all requests
app.use(limiter);

app.use(express.json({ limit: "20kb" }));
app.use(express.urlencoded({ extended: true, limit: "20kb" }));
app.use(express.static("public"));

app.use(cookieParser());

//router Import
import healthcheckRouter from "./routes/healthcheck.routes.js";
import userRouter from "./routes/users.routes.js";
import blogRouter from "./routes/blogs.routes.js";
import followRouter from "./routes/follows.routes.js";
import likesRouter from "./routes/likes.routes.js";
import bookmarkRouter from "./routes/bookmarks.routes.js";

app.use("/api/v1/healthcheck", healthcheckRouter);

app.use("/api/v1/users", userRouter);
app.use("/api/v1/blogs", blogRouter);
app.use("/api/v1/follows", followRouter);
app.use("/api/v1/likes", likesRouter);
app.use("/api/v1/bookmarks", bookmarkRouter);

export { app };
