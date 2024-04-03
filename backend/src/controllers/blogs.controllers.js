import prisma from "../../prisma/prisma.js";
import { client } from "../app.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  deleteFileOnCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";
import {
  blogSchemaValidation,
  updateBlogSchemaValidation,
} from "../validations/blogs.validations.js";

const publishBlog = asyncHandler(async (req, res) => {
  /*
   1)Get the data from the frontend 
   2) upload the thumbanil of blog to cloudnairy
   3)  crate the blog and send the response 
  
  */
  try {
    const userId = req.user?.id;

    const userData = await blogSchemaValidation.parse(req.body);

    const { title, content, tag } = userData;
    const thumbnailLocalPath = req.file?.path;

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
    3)  allow to update the blog title,content,thumbnail,tag
    */

    const userId = req.user?.id;
    const { content, title } = updateBlogSchemaValidation.parse(req.body);

    const blogId = parseInt(req.params.blogId);

    const blog = await prisma.blog.findFirst({
      where: {
        id: blogId,
        ownerId: userId,
        isPublished: true,
      },
    });

    if (!blog) {
      throw new ApiError(
        404,
        "Blog Dose Not Exists || You ARe Not Authorized To Edit This Blog"
      );
    }

    const newThumbnailLocalPath = req.file?.path;

    const updatedBlogData = {};
    if (content) {
      updatedBlogData.content = content;
    }

    if (title) {
      updatedBlogData.title = title;
    }

    if (newThumbnailLocalPath) {
      const oldThumbnailUrl = blog.thumbnail;
      const updatedThumbnail = await uploadOnCloudinary(newThumbnailLocalPath);
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
  /*
  1-> get the blog id and ownerId
  2-> match the ownerId with userId
  3-> first delte the image from cloudnairy
  4-> deltet the user form the db and send repsonse
  */
  try {
    const userId = req.user?.id;
    const blogId = parseInt(req.params.blogId);

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
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          deletd: true,
        },
        "Succesfully Deleted The Blog"
      )
    );
  } catch (error) {
    throw new ApiError(500, error?.message);
  }
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  try {
    const blogId = parseInt(req.params.blogId, 10);

    const userId = req.user?.id;

    const blog = await prisma.blog.findFirst({
      where: {
        id: blogId,
      },
    });

    if (blog.ownerId != userId) {
      throw new ApiError(404, "You Are Not Authorized to edit this blog");
    }

    const togglePublised = !blog.isPublished;

    const updatedBlog = await prisma.blog.update({
      where: {
        id: blogId,
      },
      data: {
        isPublished: togglePublised,
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

const getAllBlogs = asyncHandler(async (req, res) => {
  try {
    const { page = 0, limit = 10, query, userId, sortBy, sortType } = req.query;

    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    };

    const ownerId = parseInt(userId, 10);

    if (ownerId) {
      const allBlogs = await prisma.blog.findMany({
        where: {
          ownerId: ownerId,
          isPublished: true,
        },
        include: {
          owner: true,
        },
        skip: options.page,
        take: options.limit,
      });

      const formatedData = allBlogs.map((blog) => {
        const ownerId = blog?.owner?.id;
        const ownerUsername = blog?.owner?.username;
        const ownerAvatar = blog?.owner?.avatar;

        return {
          id: blog.id,
          thumbnail: blog.thumbnail,
          title: blog.title,
          content: blog.content,
          views: blog.views || 0,
          isPublished: blog.isPublished,
          owner: blog.ownerId,
          createdAt: blog.createdAt,
          authorInfo: {
            id: ownerId,
            username: ownerUsername,
            avatar: ownerAvatar,
          },
        };
      });

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            formatedData,
            "Successfully Fetched The Blog By The Querey"
          )
        );
    }

    if (query) {
      const allBlogs = await prisma.blog.findMany({
        where: {
          title: {
            contains: query,
          },
          isPublished: true,
        },
        include: {
          owner: true,
        },
        skip: options.page,
        take: options.limit,
      });

      const formatedData = allBlogs.map((blog) => {
        const ownerId = blog?.owner?.id;
        const ownerUsername = blog?.owner?.username;
        const ownerAvatar = blog?.owner?.avatar;

        return {
          id: blog.id,
          thumbnail: blog.thumbnail,
          title: blog.title,
          content: blog.content,
          views: blog.views || 0,
          isPublished: blog.isPublished,
          owner: blog.ownerId,
          createdAt: blog.createdAt,
          authorInfo: {
            id: ownerId,
            username: ownerUsername,
            avatar: ownerAvatar,
          },
        };
      });

      console.log("first time typeOf" + typeof formatedData);

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            formatedData,
            "Successfully Fetched The Blog By The Querey"
          )
        );
    }

    const chachedData = await client.get("blogs");

    if (chachedData) {
      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            JSON.parse(chachedData),
            "Succesfully Fetched All The Blogs"
          )
        );
    }

    const allBlogs = await prisma.blog.findMany({
      where: {
        isPublished: true,
      },
      include: {
        owner: true,
      },
      skip: options.page,
      take: options.limit,
    });

    const formatedData = allBlogs.map((blog) => {
      const ownerId = blog?.owner?.id;
      const ownerUsername = blog?.owner?.username;
      const ownerAvatar = blog?.owner?.avatar;

      return {
        id: blog.id,
        thumbnail: blog.thumbnail,
        title: blog.title,
        content: blog.content,
        views: blog.views || 0,
        isPublished: blog.isPublished,
        owner: blog.ownerId,
        createdAt: blog.createdAt,
        authorInfo: {
          id: ownerId,
          username: ownerUsername,
          avatar: ownerAvatar,
        },
      };
    });

    await client.set("blogs", JSON.stringify(formatedData));
    await client.expire("blogs", 40000);

    return res
      .status(200)
      .json(
        new ApiResponse(200, formatedData, "Succesfully Fetched All The Blogs")
      );
  } catch (error) {
    throw new ApiError(500, error?.message);
  }
});

// TODO: Update after like comment bookmarks api done
const getBlogById = asyncHandler(async (req, res) => {
  try {
    const blogId = parseInt(req.params.blogId, 10);
    const userId = req.user?.id;

    const blog = await prisma.blog.findFirst({
      where: {
        id: blogId,
        isPublished: true,
      },
      include: {
        owner: {
          include: {
            // follows: {
            //   select: {
            //     authorId: true,
            //   },
            // },
            follows: true,
          },
        },
        likes: true,
        comment: true,
        bookmarks: true,
      },
    });

    if (!blog) {
      throw new ApiError(404, "No Blog Found By This Id");
    }
    // Increment the views count
    await prisma.blog.update({
      where: { id: blogId },
      data: { views: { increment: 1 } },
    });

    const isUserFollowed = blog.owner.follows.some(
      (follow) => userId === follow.followerId
    );

    const isUserLiked = blog.likes.some((like) => userId === like.likedById);

    const formatedData = {
      id: blog?.id,
      thumbnail: blog?.thumbnail,
      title: blog?.title,
      content: blog?.content,
      views: blog?.views + 1 || 0,
      isPublished: blog?.isPublished,
      ownerId: blog?.ownerId,
      createdAt: blog?.createdAt,
      authorInfo: {
        id: blog?.owner?.id,
        username: blog?.owner?.username,
        avatar: blog?.owner?.avatar,
      },
      followersCount: blog?.owner?.follows.length,
      isUserFollowed: isUserFollowed,
      totalLikes: blog.likes.length,
      isUserLiked: isUserLiked,
      totalComments: blog.comment.length,
    };

    return res
      .status(200)
      .json(new ApiResponse(200, formatedData, "Succesfully fetched blog"));
  } catch (error) {
    console.log(error);
    throw new ApiError(500, error?.message);
  }
});

export {
  publishBlog,
  updateBlog,
  deleteBlog,
  getAllBlogs,
  getBlogById,
  togglePublishStatus,
};
