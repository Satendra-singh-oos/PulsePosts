import prisma from "../../prisma/prisma";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import {
  deleteFileOnCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary";
import {
  blogSchemaValidation,
  updateBlogSchemaValidation,
} from "../validations/blogs.validations";

const publishBlog = asyncHandler(async (req, res) => {
  try {
    const userId = req.user?.id;
    const userData = blogSchemaValidation.parse(req.body);

    const { title, content, tag } = userData;
    const thumbnailLocalPath =
      req.files?.thumbnail && req.files?.thumbnail[0]?.path;

    if (!thumbnailLocalPath) {
      throw new ApiError(400, "Thumbnail are required to publish a blog");
    }

    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if (!thumbnail.url) {
      throw new ApiError(404, "Something Went Wrong ON Uplaoding Thumbnail");
    }

    const newBlog = await prisma.blog.create({
      data: {
        title,
        content,
        tag,
        thumbnail: thumbnail.url,
        ownerId: userId,
      },
    });

    if (!newBlog) {
      throw new ApiError(
        500,
        "Something Went Wrong During The Save And Publish of The Blog! Try Again"
      );
    }

    return res
      .status(200)
      .json(new ApiResponse(200, newBlog, "Succesfully Published The Blog"));
  } catch (error) {
    throw new ApiError(500, error?.message);
  }
});

const updateBlog = asyncHandler(async (req, res) => {
  try {
    /*
    1)  get userId , get blogId    
    2)  search that blogId if not there throw err check current userID is owner of blogId
    3)  allow to update the blpg title,content,thumbnail
    */

    const userId = req.user?.id;
    const {
      content,
      title,
      tag: newTags,
    } = updateBlogSchemaValidation.parse(req.body);

    const blogId = parseInt(req.params.blogId, 10);

    const blog = await prisma.blog.findFirst({
      where: {
        id: blogId,
        ownerId: userId,
      },
    });

    if (!blog) {
      throw new ApiError(404, "blog dose not exists");
    }

    const newThumbnailLocalPath =
      req.files?.thumbnail && req.files?.thumbnail[0]?.path;

    // if (!thumbnailLocalPath) {
    //   throw new ApiError(400, "Thumbnail are required to publish a blog");
    // }

    const updatedBlogData = {};
    if (content) {
      updatedBlogData.content = content;
    }

    if (title) {
      updatedBlogData.title = title;
    }

    if (newTags && Array.isArray(newTags)) {
      const updatedTag = Array.from([...blog.tag, ...newTags]);
      updatedBlogData.tag = updatedTag;
    }

    if (newThumbnailLocalPath) {
      const oldThumbnailUrl = blog.thumbnail;
      const updatedThumbnail = await uploadOnCloudinary(thumbnailLocalPath);
      updatedBlogData.thumbnail = updatedThumbnail.url;
      await deleteFileOnCloudinary(oldThumbnailUrl, "image");
    }

    const udpatedBlog = await prisma.blog.update({
      where: {
        id: blogId,
      },
      data: updatedBlogData,
    });

    // const updatedBlog = await prisma.blog.update({
    //   where: {
    //     id: blogId,
    //   },
    //   data: {
    //     title: title || blog.title,
    //     thumbnail: newThumbnailLocalPath
    //       ? (await uploadOnCloudinary(newThumbnailLocalPath)).url
    //       : blog.thumbnail,
    //     tag: tag ? Array.from([...blog.tag, ...newTags]) : blog.tag,
    //     content: content || blog.content,
    //   },
    // });
    //  if(newThumbnailLocalPath){
    //  await deleteFileOnCloudinary(oldThumbnailUrl, "image");
    //  }

    return res
      .status(200)
      .json(
        new ApiResponse(200, udpatedBlog, "Succesfully udpate the blog data")
      );
  } catch (error) {
    throw new ApiError(500, error?.message);
  }
});

const deleteBlog = asyncHandler(async (req, res) => {
  try {
    const userId = req.user?.id;
    const blogId = parseInt(req.params, 10);

    const blog = await prisma.blog.findFirst({
      where: {
        id: blogId,
        ownerId: userId,
      },
    });

    if (!blog) {
      throw new ApiError(
        404,
        "You Are Not Allowed To delete the blog, Thank you"
      );
    }

    const deletedThumbnail = await deleteFileOnCloudinary(
      blog.thumbnail,
      "image"
    );

    if (deletedThumbnail.result !== "ok") {
      throw new ApiError(500, "Failed to delete Thumbanialfile on Cloudinary");
    }

    await prisma.blog.delete({
      where: {
        id: blogId,
        ownerId: userId,
      },
    });
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Succesfully Deleted The Blog"));
  } catch (error) {
    throw new ApiError(500, error?.message);
  }
});

const getAllBlogs = asyncHandler(async (req, res) => {
  try {
    const { page = 1, limit = 10 } = rqe.query;
    const allBlogs = await prisma.blog.findMany({
      where: {
        isPublished: true,
      },
      skip: page,
      take: limit,
    });

    return res
      .status(200)
      .json(
        new ApiResponse(200, allBlogs, "SUccesfully Fetched All The Blogs")
      );
  } catch (error) {
    throw new ApiError(500, error?.message);
  }
});

const getAllBlogsByUsername = asyncHandler(async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const { username } = req.params;

    const author = await prisma.user.findUnique({
      where: {
        username,
      },
    });

    if (!author) {
      throw new ApiError(
        404,
        "Author/Username" + username + " dose not exist "
      );
    }

    const authorId = author.id;
    const blogs = await prisma.blog.findMany({
      where: {
        ownerId: authorId,
        isPublished: true,
      },

      skip: page,
      take: limit,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, blogs, "Succesfuly Fetched users blog"));
  } catch (error) {
    throw new ApiError(500, error?.message);
  }
});

const getMyBlogs = asyncHandler(async (req, res) => {
  try {
    const userId = req.user?.id;
    const { page = 1, limit = 10 } = req.params;

    const myBlogs = await prisma.blog.findMany({
      where: {
        ownerId: userId,
      },
    });

    return res
      .status(200)
      .json(
        new ApiResponse(200, myBlogs, "Succesfully Fetched All Blogs By User")
      );
  } catch (error) {
    throw new ApiError(500, error?.message);
  }
});

const getBookMarkedPosts = asyncHandler(async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const userId = req.user?.id;

    const bookMarkedblogs = await prisma.bookmark.findMany({
      where: {
        bookmarkedBy: userId,
      },
    });

    if (!bookMarkedblogs) {
      return res
        .status(200)
        .json(new ApiResponse(200, [], "No Bookemarked Blog Found"));
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          bookMarkedblogs,
          "Succesfully Fetched The Bookmarked Blogs"
        )
      );
  } catch (error) {
    throw new ApiError(500, error?.message);
  }
});

const getBlogById = asyncHandler(async (req, res) => {
  try {
    const blogId = parseInt(req.params, 10);

    const blog = await prisma.blog.findFirst({
      where: {
        id: blogId,
      },
    });

    if (!blog) {
      throw new ApiError(404, "No Blog Found By This Id");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, blog, "Succesfully fetched blog"));
  } catch (error) {
    throw new ApiError(500, error?.message);
  }
});

const getBlogsByTag = asyncHandler(async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const { tag } = req.params;

    const blogs = await prisma.blog.findMany({
      where: {
        isPublished: true,
        tag: {
          has: tag,
        },
      },
      skip: page,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!blogs) {
      throw new ApiError(404, "No blog found by this tag");
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, blogs, "Succesfulyy fetched the blog by tags")
      );
  } catch (error) {
    throw new ApiError(500, error?.message);
  }
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  try {
    const blogId = parseInt(req.params.blogId, 10);

    const userId = req.user?.id;

    const user = await prisma.user.findFirst({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const blog = await prisma.blog.findFirst({
      where: {
        id: blogId,
      },
    });

    if (!blog) {
      throw new ApiError(404, "Blog not found");
    }

    const updatedBlog = await prisma.blog.update({
      where: {
        id: blogId,
      },
      data: {
        isPublished: !blog.isPublished,
      },
    });

    return res
      .status(200)
      .json(
        new ApiResponse(200, updatedBlog, "Publish status toggled successfully")
      );
  } catch (error) {
    throw new ApiError(500, error?.message);
  }
});

export {
  publishBlog,
  updateBlog,
  deleteBlog,
  getAllBlogs,
  getAllBlogsByUsername,
  getMyBlogs,
  getBookMarkedPosts,
  getBlogById,
  getBlogsByTag,
  togglePublishStatus,
};
