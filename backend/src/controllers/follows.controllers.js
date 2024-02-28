import prisma from "../../prisma/prisma";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";

const toggleFollow = asyncHandler(async (req, res) => {
  try {
    const userId = req.user?.id;
    const { authorId } = parseInt(req.params, 10);

    // check if user alredy toBeFollowedUserId exists
    const toBeFollowed = await prisma.user.findFirst({
      where: {
        id: authorId,
      },
    });

    if (!toBeFollowed) {
      throw new ApiError(404, "User Not Found");
    }

    //  Check of the user who is being followed is not the one who is requesting
    if (authorId === userId) {
      throw new ApiError(422, "You Cannot follow yourself ");
    }

    //check if the user is already following the to bed followed user
    const isAlreadyFolllowing = await prisma.follow.findFirst({
      where: {
        followerId: userId,
        authorId: authorId,
      },
    });

    if (isAlreadyFolllowing) {
      await prisma.follow.delete({
        where: {
          followerId: userId,
          authorId: authorId,
        },
      });

      return res.status(200).json(
        new ApiResponse(
          200,
          {
            following: false,
          },
          "Un-Followed author Succesfuly"
        )
      );
    } else {
      await prisma.follow.create({
        data: {
          followerId: userId,
          authorId: authorId,
        },
      });

      return res.status(200).json(
        new ApiResponse(
          200,
          {
            following: true,
          },
          "Followed Author Succesfuly"
        )
      );
    }
  } catch (error) {
    throw new ApiError(500, error?.message);
  }
});

const getUserFollowerList = asyncHandler(async (req, res) => {
  try {
    const userId = req.user?.id;

    const followerList = await prisma.follow.findMany({
      where: {
        authorId: userId,
      },
    });
    // const followerList = await prisma.user.findFirst({
    //   where: {
    //     id: userId,
    //   },
    //   select: {
    //     follows: {
    //       where: {
    //         authorId: userId,
    //       },
    //     },
    //   },
    // });

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          followerList,
          "Fetched All Subscriber List of the authro"
        )
      );
  } catch (error) {
    throw new ApiError(500, error?.message);
  }
});

const getUserFollowingList = asyncHandler(async (rqe, res) => {
  try {
    const userId = req.user?.id;

    const followingList = await prisma.follow.findFirst({
      where: {
        followerId: userId,
      },
    });

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          followingList,
          "Fetched All the followed author list of your"
        )
      );
  } catch (error) {
    throw new ApiError(500, error?.message);
  }
});

export { toggleFollow, getUserFollowerList, getUserFollowingList };
