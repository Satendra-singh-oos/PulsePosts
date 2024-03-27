import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import {
  publishBlog,
  updateBlog,
  deleteBlog,
  getAllBlogs,
  getAllBlogsByUsername,
  getMyBlogs,
  getBookMarkedPosts,
  getBlogById,
  getBlogsByTag,
  togglePublishStatus,
} from "../controllers/blogs.controllers.js";
import { upload } from "../middlewares/multer.middlewares.js";

const router = Router();
// router.use(verifyJwt);

router.route("/").get(getAllBlogs);
router.route("/get/t/:tag").get(getBlogsByTag);

router.route("/get/u/:username").get(getAllBlogsByUsername);

// restricted route
router.route("/").post(verifyJwt, upload.single("thumbnail"), publishBlog);
router
  .route("/:blogId")
  .get(verifyJwt, getBlogById)
  .delete(verifyJwt, deleteBlog)
  .patch(verifyJwt, upload.single("thumbnail"), updateBlog);

router.route("/toggle/publish/:blogId").patch(verifyJwt, togglePublishStatus);

router.route("/get/myBlogs").get(verifyJwt, getMyBlogs);

router.route("/get/bookmarked").get(verifyJwt, getBookMarkedPosts);

export default router;
