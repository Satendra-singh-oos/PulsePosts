import prisma from "../../prisma/prisma.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { commentSchemaValidation } from "../validations/comment.validation.js";

const addCommnet = asyncHandler(async (req, res) => {
  try {
    const userId = req.user?.id;
    const blogId = parseInt(req.params.blogId, 10);

    if (isNaN(blogId)) {
      // Handle invalid input (blogId is not a valid integer string)
      throw new ApiError(405, "No A Valid blogId");
    }

    const { content } = commentSchemaValidation.parse(req.body);

    const isBlogPublished = await prisma.blog.findFirst({
      where: {
        id: blogId,
      },
    });

    if (!isBlogPublished.isPublished) {
      throw new ApiError(404, "Blog Is Private Or Not Avaliable");
    }

    const comment = await prisma.comment.create({
      data: {
        content: content,
        ownerId: userId,
        blogId: blogId,
      },
    });

    return res
      .status(200)
      .json(new ApiResponse(200, comment, "commnet added successfully"));
  } catch (error) {
    throw new ApiError(500, error?.message);
  }
});

const updateComment = asyncHandler(async (req, res) => {
  try {
    const userId = req.user?.id;
    const commentId = parseInt(req.params.commentId, 10);

    if (isNaN(commentId)) {
      // Handle invalid input (commentId is not a valid integer string)
      throw new ApiError(405, "No A Valid commentId");
    }

    const { content } = commentSchemaValidation.parse(req.body);

    const comment = await prisma.comment.findFirst({
      where: {
        id: commentId,
        ownerId: userId,
      },
    });

    if (!comment) {
      throw new ApiError(
        404,
        "No Commnet found || You are not authorized to update this comment"
      );
    }

    const blogId = comment.blogId;

    const isBlogPublished = await prisma.blog.findFirst({
      where: {
        id: blogId,
        isPublished: true,
      },
    });
    if (!isBlogPublished) {
      throw new ApiError(404, "Blog Is Private Or Not Avaliable");
    }

    const updatedComment = await prisma.comment.update({
      where: {
        id: commentId,
        ownerId: userId,
      },
      data: {
        content: content,
      },
    });

    return res
      .status(200)
      .json(
        new ApiResponse(200, updatedComment, "Comment updated successfully")
      );
  } catch (error) {
    throw new ApiError(500, error?.message);
  }
});

const deleteComment = asyncHandler(async (req, res) => {
  try {
    const userId = req.user?.id;
    const commentId = parseInt(req.params.commentId, 10);

    const checkCommentIsThere = await prisma.comment.findFirst({
      where: {
        id: commentId,
        ownerId: userId,
      },
    });

    if (!checkCommentIsThere) {
      throw new ApiError(
        404,
        "Comment is already deleted or you are not authorized for this action."
      );
    }

    await prisma.comment.delete({
      where: {
        id: commentId,
        ownerId: userId,
      },
    });

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { commentId, isDeleted: true },
          "Comment deleted successfully"
        )
      );
  } catch (error) {
    throw new ApiError(500, error?.message);
  }
});

const getBlogComments = asyncHandler(async (req, res) => {
  try {
    const userId = req.user?.id;
    const blogId = parseInt(req.params.blogId, 10);
    const { page = 0, limit = 10 } = req.query;

    const blogComments = await prisma.comment.findMany({
      where: {
        blogId: blogId,
      },
      skip: page,
      take: limit,
    });
    return res
      .status(200)
      .json(
        new ApiResponse(200, blogComments, "Blog comments fetched successfully")
      );
  } catch (error) {
    throw new ApiError(500, error?.message);
  }
});

export { addCommnet, updateComment, deleteComment, getBlogComments };
