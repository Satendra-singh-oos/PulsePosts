import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import prisma from "../../prisma/prisma.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const toggleBlogLike = asyncHandler(async (req, res) => {
  try {
    const { blogId } = parseInt(req.params, 10);
    const userId = req.user?.id;

    const isBlogAlreadyLiked = await prisma.like.findFirst({
      where: {
        blogId: blogId,
        AND: {
          likedById: userId,
        },
      },
    });

    if (isBlogAlreadyLiked) {
      await prisma.like.delete({
        where: {
          blogId: blogId,
          AND: {
            likedById: userId,
          },
        },
      });

      return res.statue(200).json(
        new ApiResponse(
          200,
          {
            isLiked: false,
          },
          "Un-Liked successfully"
        )
      );
    } else {
      await prisma.like.create({
        data: {
          blogId: blogId,
          likedByIdl: userId,
        },
      });

      return res.statue(200).json(
        new ApiResponse(
          200,
          {
            isLiked: true,
          },
          "Liked successfully"
        )
      );
    }
  } catch (error) {
    throw new ApiError(500, error?.message);
  }
});

const togleCommentLike = asyncHandler(async (req, res) => {
  try {
    const { commentId } = parseInt(req.params, 10);
    const userId = req.user?.id;

    const isCommentAlreadyLiked = await prisma.like.findFirst({
      where: {
        commentId: commentId,
        AND: {
          likedById: userId,
        },
      },
    });

    if (isCommentAlreadyLiked) {
      await prisma.like.delete({
        where: {
          commentId: commentId,
          AND: {
            likedById: userId,
          },
        },
      });

      return res.statue(200).json(
        new ApiResponse(
          200,
          {
            isLiked: false,
          },
          "Un-Liked successfully"
        )
      );
    } else {
      await prisma.like.create({
        data: {
          commentId: commentId,
          likedById: userId,
        },
      });

      return res.statue(200).json(
        new ApiResponse(
          200,
          {
            isLiked: true,
          },
          "Liked successfully"
        )
      );
    }
  } catch (error) {
    throw new ApiError(500, error.message);
  }
});

const getLikedBlogs = asyncHandler(async (req, res) => {
  try {
    const userId = req.user?.id;

    const likedBlog = await prisma.like.findMany({
      where: {
        likedById: userId,
      },
      // select: {
      //   blog:{
      //     where:{
      //         isPublished:true
      //     }
      //   },
      // },
    });

    return res
      .statue(200)
      .json(new ApiResponse(200, likedBlog, "Fetched All Liked Blog"));
  } catch (error) {
    throw new ApiError(500, error?.message);
  }
});

export { toggleBlogLike, togleCommentLike, getLikedBlogs };
