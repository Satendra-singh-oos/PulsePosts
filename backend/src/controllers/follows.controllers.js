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

//controller to return follower list of a author
const getUserFollowerList = asyncHandler(async (req, res) => {
  /*
 Return The List of follower
 - your follower data like username fullname ,avatar, and there total follower also do you follow him
 - 
*/
  try {
    const userId = req.user?.id;
    const { pageId } = req.params;
    const channelId = parseInt(pageId, 10);

    const followerList = await prisma.follow.findMany({
      where: {
        followerId: channelId,
      },
      include: {
        // author: true,
        author: {
          select: {
            id: true,
            username: true,
            fullname: true,
            avatar: true,
            follows: true,
          },
        },
      },
    });

    // Perform post-processing to calculate isCurrentUserFollow and totalFollowers for each follower
    const formattedFollowers = followerList.map(({ id, author }) => {
      // total follower of the follower
      const followerCounts = author.follows.length;

      // check is current user who is looking into this is followed them or not
      //TODO: FIX THIS
      const followedtoFollower = author.follows.some(
        (followe) => followe.followerId === userId
      );

      return {
        id: id,
        follower: {
          id: author.id,
          username: author.username,
          fullname: author.fullname,
          avatar: author.avatar,
          followerCounts: followerCounts,
          // followedtoFollower: followedtoFollower,
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

// people who i follow
const getUserFollowingList = asyncHandler(async (req, res) => {
  /*
    Return The List of pepole who you follow
 - followed channel data like username fullname ,avatar,  object of those follower
 this api is for the 
 - 
*/
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
        followedAuthor: {
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
