import prisma from "../../prisma/prisma.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getProfileStats = asyncHandler(async (req, res) => {
  /*
   1) get the userId from = req.user?._id 
   2) now using mongose aggregation
   fetching folowwing data
   -username
   -avatar,
   -fullname, 
   -email,
   -totalLikes in all blog
   -totalBlog uploaded in channel published and notPublished
   -totalViews in all Blog
   -totalFollower
   -totalauthorFollowedTo(user followed to other author)
   
  
  */

  try {
    const userId = req.user?.id;

    const profileStatus = await prisma.user.findFirst({
      where: {
        id: userId,
      },
      include: {
        blogs: {
          include: {
            likes: true,
          },
        },
        followers: true,
        follows: true,
      },
    });

    let totalLikes = 0;

    profileStatus.blogs.map((blog) => {
      totalLikes += blog.likes.length;
    });

    let totalViews = 0;
    profileStatus.blogs.map((blog) => {
      totalViews += blog.views;
    });

    const formatedData = {
      id: profileStatus.id,
      username: profileStatus.username,
      fullname: profileStatus.fullname,
      avatar: profileStatus.avatar,
      coverImage: profileStatus.coverImage,
      totalBlogs: profileStatus.blogs.length,
      totalLikes: totalLikes,
      totalViews: totalViews,
      totalFollower: profileStatus.follows.length,
      totalauthorFollowedTo: profileStatus.followers.length,
    };

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          formatedData,
          "fetched the profile data succesfully"
        )
      );
  } catch (error) {
    throw new ApiError(500, error.message);
  }
});

const getProfileBlogs = asyncHandler(async (req, res) => {
  // TODO: Get all the videos uploaded by the channel

  /*
   1) get the userId from = req.user?._id 
   2) now find all the blogs which have ownerId as req.user?.id   
   fetching folowwing data
   -thumbnail,
   -title, 
   -content,
   -isPublished  
   -totalLikes on the blog
   -created At(Uploaded at)
  */
  try {
    const userId = req.user?.id;

    const allBlogs = await prisma.blog.findMany({
      where: {
        ownerId: userId,
      },
      include: {
        likes: true,
      },
    });

    const formatedData = allBlogs.map((blog) => {
      const dateObject = new Date(blog.createdAt);
      return {
        id: blog.id,
        thumbnail: blog.thumbnail,
        title: blog.title,
        content: blog.content,
        views: blog.views || 0,
        isPublished: blog.isPublished,
        createdAt: {
          year: dateObject.getFullYear(),
          month: dateObject.getMonth() + 1,
          day: dateObject.getDate(),
        },
        totalLikes: blog.likes.length,
      };
    });

    return res
      .status(200)
      .json(
        new ApiResponse(200, formatedData, "Fetched Blogs Data Succesfully")
      );
  } catch (error) {
    throw new ApiError(500, error.message);
  }
});

export { getProfileStats, getProfileBlogs };
