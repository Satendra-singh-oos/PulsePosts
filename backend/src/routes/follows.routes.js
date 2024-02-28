import { Router } from "express";

import { verifyJwt } from "../middlewares/auth.middleware";
import {
  getUserFollowerList,
  getUserFollowingList,
  toggleFollow,
} from "../controllers/follows.controllers";

const router = Router();

router.use(verifyJwt);

router.route("/:authorId").post(toggleFollow);

router.route("/list/followers").get(getUserFollowerList);
router.route("/list/following").get(getUserFollowingList);

export default router;
