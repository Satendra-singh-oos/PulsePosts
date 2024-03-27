import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import {
  addCommnet,
  deleteComment,
  getBlogComments,
  updateComment,
} from "../controllers/comments.controllers.js";

const router = Router();

// router.use(verifyJwt);

router.route("/:blogId").get(getBlogComments).post(verifyJwt, addCommnet);

router
  .route("/:commentId")
  .patch(verifyJwt, updateComment)
  .delete(verifyJwt, deleteComment);

export default router;
