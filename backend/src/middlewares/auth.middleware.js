import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import prisma from "../../prisma/prisma";

export const verifyJwt = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    const verifyToken = await jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET
    );

    const userId = verifyToken?.id;

    const user = await prisma.user.findFirst({
      where: {
        id: userId,
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
    if (!findUser) {
      throw new ApiError(405, "Invaled Access Token");
    }

    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(
      500,
      error.message || "Your Token Dose not match login again"
    );
  }
});
