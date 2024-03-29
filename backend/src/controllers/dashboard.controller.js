import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getProfileStats = asyncHandler(async (req, res) => {
  // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
  /*
   1) get the userId from = req.user?._id 
   2) now using mongose aggregation
   fetching folowwing data
   -username
   -avatar,
   -fullname, 
   -email,
   -totalLikes in all video
   -totalVideos uploaded in channel published and notPublished
   -totalViews in all video
   -totalSubscribers
   -totalChannelSubscribedTo(user subscribed to other channel)
   
  
  */

  try {
  } catch (error) {
    throw new ApiError(500, error.message);
  }
});

const getProfileBlogs = asyncHandler(async (req, res) => {
  // TODO: Get all the videos uploaded by the channel

  /*
   1) get the userId from = req.user?._id 
   2) now using mongose aggregation which will aplly on video and do match on owner:req.user?._id
   fetching folowwing data
   -videoFile
   -thumbnail,
   -title, 
   -duration,
   -isPublished  video
   -totalLikes on the video
   -created At(Uploaded at)
  */
  try {
  } catch (error) {
    throw new ApiError(500, error.message);
  }
});

export { getProfileStats, getProfileBlogs };
