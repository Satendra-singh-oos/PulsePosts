import { Router } from "express";

import { verifyJwt } from "../middlewares/auth.middleware.js";
import {
  getUserFollowerList,
  getUserFollowingList,
  toggleFollow,
} from "../controllers/follows.controllers.js";

const router = Router();

router.use(verifyJwt);

router.route("/:authorId").post(toggleFollow);

router.route("/list/followers").get(getUserFollowerList);
router.route("/list/following").get(getUserFollowingList);

export default router;
