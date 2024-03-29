import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import {
  getLikedBlogs,
  toggleBlogLike,
  togleCommentLike,
} from "../controllers/like.controllers.js";

const router = Router();

router.use(verifyJwt);

router.route("/toggle/blog/:blogId").post(toggleBlogLike);

router.route("/toggle/comment/:commentId").post(togleCommentLike);

router.route("/blogs").get(getLikedBlogs);

export default router;
