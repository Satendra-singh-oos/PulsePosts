import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware";
import {
  getAllBookmarkedBlog,
  toggleBookmark,
} from "../controllers/bookmarks.controllers";

const router = Router();

router.use(verifyJwt);

router.route("/").get(getAllBookmarkedBlog);

router.route("/:blogId").post(toggleBookmark);

export default router;
