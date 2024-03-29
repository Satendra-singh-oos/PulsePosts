import prisma from "../../prisma/prisma.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleBookmark = asyncHandler(async (req, res) => {
  try {
    const blogId = parseInt(req.params.blogId, 10);
    const userId = req.user?.id;

    if (isNaN(blogId)) {
      // Handle invalid input (blogId is not a valid integer string)
      throw new ApiError(405, "No A Valid blogId");
    }

    const isBlogAlreadyBookmarked = await prisma.bookmark.findFirst({
      where: {
        AND: [{ blogId: blogId }, { bookmarkedBy: userId }],
      },
    });

    if (isBlogAlreadyBookmarked) {
      await prisma.bookmark.deleteMany({
        where: {
          AND: [{ blogId: blogId }, { bookmarkedBy: userId }],
        },
      });

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            { isBookemarked: false },
            "Removed From Bookmarked"
          )
        );
    }
    await prisma.bookmark.create({
      data: {
        blogId: blogId,
        bookmarkedBy: userId,
      },
    });

    return res
      .status(200)
      .json(
        new ApiResponse(200, { isBookemarked: true }, "Added To Bookmarked")
      );
  } catch (error) {
    throw new ApiError(500, error?.message);
  }
});

const getAllBookmarkedBlog = asyncHandler(async (req, res) => {
  try {
    const userId = req.user?.id;

    const bookmarkedBlogs = await prisma.bookmark.findMany({
      where: {
        bookmarkedBy: userId,
      },
    });

    if (!bookmarkedBlogs) {
      return res
        .status(200)
        .json(new ApiResponse(200, [], "No Bookmarked Found"));
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, bookmarkedBlogs, "Fetched All Bookmarked Blogs")
      );
  } catch (error) {
    throw new ApiError(500, error?.message);
  }
});

export { toggleBookmark, getAllBookmarkedBlog };
