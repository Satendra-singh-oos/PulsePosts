import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

import { asyncHandler } from "../utils/asyncHandler.js";
const healthcheck = asyncHandler(async (req, res) => {
  try {
    res.status(200).json(new ApiResponse(200, {}, "My Health is good"));
  } catch (error) {
    throw new ApiError(500, error.message);
  }
});

export default healthcheck;
