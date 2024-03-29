import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import {
  getProfileBlogs,
  getProfileStats,
} from "../controllers/dashboard.controller.js";

const router = Router();

router.use(verifyJwt); // Apply verifyJWT middleware to all routes in this file

router.route("/stats").get(getProfileStats);
router.route("/blogs").get(getProfileBlogs);

export default router;
