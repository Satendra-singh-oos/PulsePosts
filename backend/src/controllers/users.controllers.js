import prisma from "../../prisma/prisma.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  deleteFileOnCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";
import {
  loginUserSchemaValidation,
  passwordValidation,
  registerUserSchemaValidation,
  updatedUserAccountValidation,
} from "../validations/users.validations.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const genrateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new ApiError(404, "No User Found With this id");
    }
    const accessToken = await jwt.sign(
      {
        id: user.id,
        email: user?.email,
        username: user?.username,
        fullname: user?.fullname,
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
    );

    const refreshToken = await jwt.sign(
      { id: user.id },
      process.env.REFERESH_TOKEN_SECRET,
      { expiresIn: process.env.REFERESH_TOKEN_EXPIRY }
    );

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        refreshToken: refreshToken,
      },
    });
    return { refreshToken, accessToken };
  } catch (error) {
    throw new ApiError(500, error.message);
  }
};

const registerUser = asyncHandler(async (req, res) => {
  /*
   1->get data from  frontend
   2->get image from frontend
   3->check dose the email exist or userName  throw err if they exist
   4->then create the  user and send the response
  */
  try {
    // validating user data
    const userData = await registerUserSchemaValidation.parse(req.body);

    const avatarLocalPath = req.files?.avatar && req.files?.avatar[0]?.path;
    const coverImageLocalPath =
      req.files?.coverImage && req.files?.coverImage[0]?.path;

    // hasing the password before saving in the db
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    //checking  email exist in db or not
    const checkEmailExists = await prisma.user.findFirst({
      where: {
        email: userData.email,
        OR: [
          {
            username: userData.username,
          },
        ],
      },
    });

    if (checkEmailExists) {
      throw new ApiError(401, "Email Or Username Already Exist");
    }

    // now upload photo on cloudnairy
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    const newUser = await prisma.user.create({
      data: {
        username: userData.username,
        fullname: userData.fullname,
        email: userData.email,
        password: hashedPassword,
        avatar: avatar.url,
        coverImage: coverImage.url,
        dob: userData.dob,
        bio: userData.bio,
      },
      select: {
        id: true,
        username: true,
        fullname: true,
        email: true,
        avatar: true,
        coverImage: true,
        dob: true,
        bio: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res
      .status(200)
      .json(new ApiResponse(200, newUser, "Succesfully Account Created"));
  } catch (error) {
    throw new ApiError(500, error?.message);
  }
});

const loginUser = asyncHandler(async (req, res) => {
  /*
  
  1-> get the data email and password
  2-> check the password is correct
  3-> if password correct then genrate access and refresh token
  4->then login the user succesfuly and send response 
  5->while in reposne set the cokkies 
  
  */
  try {
    const userData = await loginUserSchemaValidation.parse(req.body);

    const user = await prisma.user.findFirst({
      where: {
        email: userData.email,
      },
    });

    if (!user) {
      throw new ApiError(404, "Email not found");
    }

    const isPasswordCorrect = await bcrypt.compare(
      user.password,
      userData.password
    );

    if (!isPasswordCorrect) {
      throw new ApiError(404, "Password is not correct || check your password");
    }

    const { accessToken, refreshToken } = await genrateAccessAndRefreshToken(
      user.id
    );

    const logedinUser = await prisma.user.findFirst({
      where: {
        id: user.id,
      },
      select: {
        id: true,
        username: true,
        fullname: true,
        email: true,
        avatar: true,
        coverImage: true,
        dob: true,
        bio: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const options = {
      httpOnly: true,
      secure: true,
    };
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          { logedinUser, refreshToken, accessToken },
          "User LoggedIn Succesfully"
        )
      );
  } catch (error) {
    throw new ApiError(500, error?.message);
  }
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  /*
   1-> refresh the acces tokken
   2-> check the id of the old refresh token
   3-> genrate the new refresh token
   4-> send the responseand set the cokkies
  
  */
  try {
    const incomingRefreshToken =
      req.cookies?.refreshToken ||
      req.body?.refreshToken ||
      req.headers?.refreshToken;

    if (!incomingRefreshToken) {
      throw new ApiError(404, "No Refesh Token found");
    }
    const verifyiedRefreshToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFERESH_TOKEN_SECRET
    );

    if (!verifyiedRefreshToken) {
      throw new ApiError(
        404,
        "Not Able to verify refresh token please login again"
      );
    }

    const userId = verifyiedRefreshToken.id;

    const user = await prisma.user.findFirst({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new ApiError(404, "No user found with this refresh token");
    }

    if (incomingRefreshToken !== user.refreshToken) {
      throw new ApiError(
        404,
        "Refersh Token dosen't match might be expierd or used , Try Login Again"
      );
    }

    const { refreshToken, accessToken } =
      await genrateAccessAndRefreshToken(userId);

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(200, { accessToken, newRefreshToken: refreshToken })
      );
  } catch (error) {
    throw new ApiError(500, error?.message);
  }
});

const logoutUser = asyncHandler(async (req, res) => {
  /*

  1-> logout just clear the cookie of the user 
  
  */
  try {
    const userId = req.user?.id;

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .clearCookie("accesToken", options)
      .clearCookie("refreshToken", options)
      .json(new ApiResponse(200, {}, "User Logout SuccesFully"));
  } catch (error) {
    throw new ApiError(500, error.message);
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  /*
   1-> for change the password check the user id from token
   2-> get the password from the forntend and and check it with the database password
   3-> hashthe new password
   4-> save it in the db
   5-> send the response
  */
  try {
    const userId = req.user?.id;
    const passwordData = passwordValidation.parse(req.bdoy);

    const user = await prisma.user.findFirst({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new ApiError(400, "No user Found");
    }

    const isOldPasswordCorrect = await bcrypt.compare(
      user.password,
      passwordData.oldPassword
    );

    if (!isOldPasswordCorrect) {
      throw new ApiError(404, "Old Password dosent match");
    }

    const hashedPassword = await bcrypt.hash(passwordData.newPassword, 10);

    const updatedUser = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        password: hashedPassword,
      },
    });

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          passwordData.newPassword,
          "Succesfully Update The Password"
        )
      );
  } catch (error) {
    throw new ApiError(500, error?.message);
  }
});

const getCurrentUser = asyncHandler(async (req, res) => {
  try {
    const user = req.user;
    return res
      .status(200)
      .json(new ApiResponse(200, user, "User Details Fetched Succesfuly"));
  } catch (error) {
    throw new ApiError(500, error?.message);
  }
});

const updateUserAccountDetails = asyncHandler(async (req, res) => {
  /*
  
    1-> get the data from frontend and update the details with the db
    2-> check the user exist in db if yes then update the details
    3-> send the response
  */
  try {
    const userId = req.user?.id;

    const userData = await updatedUserAccountValidation.parse(req.body);

    const user = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        email: userData.email,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        username: true,
        email: true,
        fullname: true,
        avatar: true,
        coverImage: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new ApiError(404, "No User Found");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, user, "Account Details Update Successfully"));
  } catch (error) {
    throw new ApiError(500, error?.message);
  }
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  /*
  1-> find the userId from the middleware
  2-> get the oldAvatar from the userData
  3-> update the avatar to the in cloudnairy then save the updated url in the db
  4-> after succesfully update the avatar delte the old avatar form cloudnairy strogae
  5-> send the response
  */
  try {
    const userId = req.user?.id;

    const avatarLocalPath = req.file?.path;
    if (!avatarLocalPath) {
      throw new ApiError(404, "No Avatar Uploaded || Avatar file missing");
    }

    const user = await prisma.user.findFirst({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new ApiError(404, "No User Found");
    }

    const oldAvatarCloudinaryUrl = user.avatar;

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    const updatedUser = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        avatar: avatar.url,
      },
      select: {
        id: true,
        username: true,
        email: true,
        fullname: true,
        avatar: true,
        coverImage: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const response = await deleteFileOnCloudinary(
      oldAvatarCloudinaryUrl,
      "image"
    );

    if (response.result !== "ok") {
      throw new ApiError(500, "Failed to delted old file ");
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, updatedUser, "Succesfully updated the avatar")
      );
  } catch (error) {
    throw new ApiError(200, error?.message);
  }
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  try {
    const coverImageLocalPath = req.file?.path;
    const userId = req.user?.id;

    if (!coverImageLocalPath) {
      throw new ApiError(
        404,
        "Unable to get the cover image || Cover Image is missing"
      );
    }
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new ApiError(404, "No User found by these id ");
    }

    const oldCoverImageCloudnaryUrl = user.coverImage;

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!coverImage.url) {
      throw new ApiError(400, "Error while uploading the coverImage try again");
    }

    const updatedUser = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        coverImage: coverImage,
      },
      select: {
        id: true,
        username: true,
        email: true,
        fullname: true,
        avatar: true,
        coverImage: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const response = await deleteFileOnCloudinary(
      oldCoverImageCloudnaryUrl,
      "image"
    );

    if (response.result !== "ok") {
      throw new ApiError(500, "Failed to delete file on Cloudinary");
    }
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          updatedUser,
          "updated user Cover Image succesfully"
        )
      );
  } catch (error) {
    throw new ApiError(500, error?.message);
  }
});

//TODO: get User Profile Withe total followers and all that thing will add if requried in forntend

export {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  changeCurrentPassword,
  getCurrentUser,
  updateUserAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
};
