import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import {
  publishBlog,
  updateBlog,
  deleteBlog,
  getAllBlogs,
  getBlogById,
  togglePublishStatus,
} from "../controllers/blogs.controllers.js";
import { upload } from "../middlewares/multer.middlewares.js";

const router = Router();
// router.use(verifyJwt);

router.route("/").get(getAllBlogs);

// restricted route
router
  .route("/publish-blog")
  .post(verifyJwt, upload.single("thumbnail"), publishBlog);
router
  .route("/:blogId")
  .get(verifyJwt, getBlogById)
  .delete(verifyJwt, deleteBlog)
  .patch(verifyJwt, upload.single("thumbnail"), updateBlog);

router.route("/toggle/publish/:blogId").patch(verifyJwt, togglePublishStatus);

export default router;
