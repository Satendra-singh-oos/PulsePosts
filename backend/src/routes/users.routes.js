import { Router } from "express";
import { upload } from "../middlewares/multer.middlewares";
import {
  changeCurrentPassword,
  getCurrentUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  updateUserAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
} from "../controllers/users.controllers";
import { verifyJwt } from "../middlewares/auth.middleware";

const router = Router();

router.route("/register").post(
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  registerUser
);

router.route("/login").post(loginUser);
router.route("/refresh-token").post(refreshAccessToken);
// secured Token

router.route("/logout").post(verifyJwt, logoutUser);
router.route("/change-password").post(verifyJwt, changeCurrentPassword);
router.route("/getCurrentUser").get(verifyJwt, getCurrentUser);
router.route("/update-account").patch(verifyJwt, updateUserAccountDetails);

router
  .route("/update-avatar")
  .patch(verifyJwt, upload.single("avatar"), updateUserAvatar);

router
  .route("/update-coverImage")
  .patch(verifyJwt, upload.single("avatar"), updateUserCoverImage);

export default router;
