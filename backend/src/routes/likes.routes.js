import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import {
  getLikedBlogs,
  toggleBlogLike,
  togleCommentLike,
} from "../controllers/like.controllers.js";

const router = Router();

router.use(verifyJwt);

router.route("/toggle/b/:blogId").post(toggleBlogLike);

router.route("/toggle/c/:commentId").post(togleCommentLike);

router.route("/blogs").get(getLikedBlogs);

export default router;
