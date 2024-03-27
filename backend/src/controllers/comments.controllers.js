import prisma from "../../prisma/prisma.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { commentSchemaValidation } from "../validations/comment.validation.js";

const addCommnet = asyncHandler(async (req, res) => {
  try {
    const userId = req.user?.id;
    const { blogId } = parseInt(req.params, 10);

    const { content } = commentSchemaValidation.parse(req.body);

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
    const { blogId } = parseInt(req.params, 10);

    const { content } = commentSchemaValidation.parse(req.body);

    const updatedComment = await prisma.comment.update({
      where: {
        blogId: blogId,
        AND: {
          ownerId: userId,
        },
      },
      data: {
        content: content,
      },
    });

    if (!updatedComment) {
      throw new ApiError(
        404,
        "Comment does not exist or you are not authorized for this action."
      );
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, updatedComment, "Comment updated successfully")
      );
  } catch (error) {
    new ApiError(500, error?.message);
  }
});

const deleteComment = asyncHandler(async (req, res) => {
  try {
    const userId = req.user?.id;
    const { blogId } = parseInt(req.params, 10);

    const checkCommentIsThere = await prisma.comment.findFirst({
      where: {
        blogId: blogId,
        AND: {
          ownerId: userId,
        },
      },
    });

    if (!checkCommentIsThere) {
      throw new ApiError(
        404,
        "Comment is already deleted or you are not authorized for this action."
      );
    }

    const deletedComment = await prisma.comment.delete({
      where: {
        blogId: blogId,
        AND: {
          ownerId: ownerId,
        },
      },
    });

    return res
      .status(200)
      .json(
        new ApiResponse(200, { deletedComment }, "Comment deleted successfully")
      );
  } catch (error) {
    throw new ApiError(500, error?.message);
  }
});

const getBlogComments = asyncHandler(async (req, res) => {
  try {
    const userId = req.user?.id;
    const { blogId } = parseInt(req.params, 10);
    const { page = 1, limit = 10 } = req.query;

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
