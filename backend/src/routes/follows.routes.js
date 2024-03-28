import { Router } from "express";

import { verifyJwt } from "../middlewares/auth.middleware.js";
import {
  getUserFollowerList,
  getUserFollowingList,
  toggleFollow,
} from "../controllers/follows.controllers.js";

const router = Router();

router.use(verifyJwt);

router.route("/page/:pageId").post(toggleFollow).get(getUserFollowerList);

// router.route("/list/followers/:pageId").get(getUserFollowerList);;
router.route("/user/:followerId").get(getUserFollowingList);

export default router;
