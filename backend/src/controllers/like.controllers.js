import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import prisma from "../../prisma/prisma.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const toggleBlogLike = asyncHandler(async (req, res) => {
  try {
    const blogId = parseInt(req.params.blogId, 10);
    const userId = req.user?.id;

    const isBlogAlreadyLiked = await prisma.like.findFirst({
      where: {
        AND: [{ blogId: blogId }, { likedById: userId }],
      },
    });

    if (isBlogAlreadyLiked) {
      await prisma.like.deleteMany({
        where: {
          AND: [{ blogId: blogId }, { likedById: userId }],
        },
      });

      return res.status(200).json(
        new ApiResponse(
          200,
          {
            isLiked: false,
          },
          "Un-Liked Blog Successfully"
        )
      );
    }
    await prisma.like.create({
      data: {
        blogId: blogId,
        likedById: userId,
      },
    });

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          isLiked: true,
        },
        "Liked BLog Successfully"
      )
    );
  } catch (error) {
    throw new ApiError(500, error?.message);
  }
});

const togleCommentLike = asyncHandler(async (req, res) => {
  try {
    const commentId = parseInt(req.params?.commentId, 10);
    const userId = req.user?.id;

    const isCommentAlreadyLiked = await prisma.like.findFirst({
      where: {
        AND: [{ commentId: commentId }, { likedById: userId }],
      },
    });

    if (isCommentAlreadyLiked) {
      await prisma.like.deleteMany({
        where: {
          AND: [{ commentId: commentId }, { likedById: userId }],
        },
      });

      return res.statue(200).json(
        new ApiResponse(
          200,
          {
            isLiked: false,
          },
          "Un-Liked Comment successfully"
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
          "Liked Comment Successfully"
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
      select: {
        blog: {
          where: {
            isPublished: true,
          },
          include: {
            owner: {
              select: {
                id: true,
                username: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    const filteredLikedBlogs = likedBlog.filter((item) => item.blog !== null);

    return res
      .status(200)
      .json(new ApiResponse(200, filteredLikedBlogs, "Fetched All Liked Blog"));
  } catch (error) {
    throw new ApiError(500, error?.message);
  }
});

export { toggleBlogLike, togleCommentLike, getLikedBlogs };
