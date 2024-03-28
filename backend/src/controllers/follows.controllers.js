import prisma from "../../prisma/prisma.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleFollow = asyncHandler(async (req, res) => {
  /*
   1- get user id from the req.user and author id from the params
   2- no check dose bhot exist in db then unfllow
   3- if not then create new and add in db
   4- return the resposne
  */
  try {
    const { pageId } = req.params;
    const userId = req.user?.id;

    const authorId = parseInt(pageId, 10);

    if (isNaN(authorId)) {
      // Handle invalid input (pageId is not a valid integer string)
      throw new ApiError(405, "No A Valid PageId");
    }

    const isUserFollow = await prisma.follow.findFirst({
      where: {
        AND: [{ followerId: userId }, { authorId: authorId }],
      },
    });

    if (isUserFollow) {
      // didn't use delete methord cause it want id as one of it's parmeter to delte the row
      await prisma.follow.deleteMany({
        where: {
          AND: [{ authorId: authorId }, { followerId: userId }],
        },
      });

      return res.status(200).json(
        new ApiResponse(
          200,
          {
            isFollow: false,
          },
          "UnFollowed The Author"
        )
      );
    }

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
          isFollow: true,
        },
        "Followed The Author"
      )
    );
  } catch (error) {
    throw new ApiError(500, error?.message);
  }
});

const getUserFollowerList = asyncHandler(async (req, res) => {
  /*
 Return The List of follower
 - total follower count
 - 
*/
  try {
    const userId = req.user?.id;
    const { pageId } = req.params;
    const authorId = parseInt(pageId, 10);

    const followerList = await prisma.follow.findMany({
      where: {
        authorId: authorId,
      },
      include: {
        author: true,
        follower: {
          select: {
            id: true,
            username: true,
            fullname: true,
            avatar: true,
            followers: true,
          },
        },
      },
    });

    // Perform post-processing to calculate isCurrentUserFollow and totalFollowers for each follower
    const formattedFollowers = followerList.map(({ id, follower, author }) => {
      const isCurrentUserFollow = follower.followers.some(
        (follow) => follow.authorId === userId
      );

      const totalFollowers = follower.followers.length;

      return {
        id: id,
        author: author.id,
        authorName: author.username,
        follower: {
          id: follower.id,
          username: follower.username,
          fullname: follower.fullname,
          avatar: follower.avatar,
          isCurrentUserFollow: isCurrentUserFollow,
          totalFollowers: totalFollowers,
        },
      };
    });

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          formattedFollowers,
          "Fetched All Subscriber List of the authro"
        )
      );
  } catch (error) {
    throw new ApiError(500, error?.message);
  }
});

const getUserFollowingList = asyncHandler(async (req, res) => {
  try {
    const userId = req.user?.id;
    const { followerId } = req.params;
    const subscriberId = parseInt(followerId, 10);

    const followingList = await prisma.follow.findMany({
      where: {
        followerId: subscriberId,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            fullname: true,
            avatar: true,
          },
        },
      },
    });

    const formattedFollow = followingList.map(({ id, author }) => {
      return {
        id: id,
        author: {
          id: author.id,
          username: author.username,
          fullname: author.username,
          avatar: author.avatar,
        },
      };
    });

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          formattedFollow,
          "Fetched All the followed author list of your"
        )
      );
  } catch (error) {
    console.log(error);
    throw new ApiError(500, error?.message);
  }
});

export { toggleFollow, getUserFollowerList, getUserFollowingList };
