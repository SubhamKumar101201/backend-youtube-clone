import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import mongoose, { isValidObjectId } from "mongoose";


// publish video controller

const publishAVideo = asyncHandler ( async (req,res) => {

    // first take the title and description from body
    const { title, description } = req.body

    if([ title, description ].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "Please provide all the fields")
    }

    const videoFileLocalPath = req.files?.videoFile[0].path
    const thumbnailLocalPath = req.files?.thumbnail[0].path

    if ( !videoFileLocalPath ) {
        throw new ApiError(400, "Please provide a video file")
    }

    if ( !thumbnailLocalPath ) {
        throw new ApiError(400, "Please provide a thumbnail file")
    }

    const videoFile = await uploadOnCloudinary(videoFileLocalPath);
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if ( !videoFile ) {
        throw new ApiError(400, "Video file upload in cloudinary failed")
    }

    if (!thumbnail) {
        throw new ApiError(400, "Thumbnail upload in cloudinary failed")
    }

    // console.log(`video file: ${JSON.stringify(videoFile, null, 2)} \n thumbanil file: ${JSON.stringify(thumbnail, null, 2)}`)

    const video = await Video.create({
        title,
        description,
        duration: videoFile?.duration, // get the duration from cloudinary response
        videoFile: {
            publicId: videoFile?.public_id,
            url: videoFile?.secure_url
        },
        thumbnail: {
            publicId: thumbnail?.public_id,
            url: thumbnail?.secure_url
        },
        owner: req.user?._id,
        isPublished: false
    })

    if (!video) {
        throw new ApiError(500, "Video uploaded failed please try again")
    }

    return res.status(200)
                .json(new ApiResponse(200, video, "Video uploaded successfully"))

})

export { publishAVideo }