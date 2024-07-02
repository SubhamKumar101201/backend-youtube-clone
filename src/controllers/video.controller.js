import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js"
import { deleteOnCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
import mongoose, { isValidObjectId } from "mongoose";


// publish video controller

const publishAVideo = asyncHandler(async (req, res) => {

    // first take the title and description from body
    const { title, description } = req.body

    if ([title, description].some((field) => field?.trim() === "")) {
        cleanUpFiles(req)
        throw new ApiError(400, "Please provide all the fields")
    }

    const videoFileLocalPath = req.files?.videoFile[0].path
    const thumbnailLocalPath = req.files?.thumbnail[0].path

    if (!videoFileLocalPath) {
        cleanUpFiles(req)
        throw new ApiError(400, "Please provide a video file")
    }

    if (!thumbnailLocalPath) {
        cleanUpFiles(req)
        throw new ApiError(400, "Please provide a thumbnail file")
    }

    const videoFile = await uploadOnCloudinary(videoFileLocalPath);
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if (!videoFile) {
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

// get video by id controller 

const getVideoById = asyncHandler(async (req, res) => {

    const { videoId } = req.params

    if (!videoId) {
        throw new ApiError(400, "Invalid videoId")
    }

    if (!isValidObjectId(req.user?._id)) {
        throw new ApiError(400, "Invalid or Unauthorized user")
    }

    const video = await Video.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $lookup: {
                            from: "subscriptions",
                            localField: "_id",
                            foreignField: "channel",
                            as: "subscribers"
                        }
                    },
                    {
                        $addFields: {
                            subscribersCount: {
                                $size: "$subscribers"
                            },
                            isSubscribed: {
                                $cond: {
                                    if: {
                                        $in: [
                                            req.user?._id,
                                            "$subscribers"
                                        ]
                                    },
                                    then: true,
                                    else: false
                                }
                            }
                        }
                    },
                    {
                        $project: {
                            username: 1,
                            "avatar.url": 1,
                            subscribersCount: 1,
                            isSubscribed: 1
                        }
                    }
                ]
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes",
            }
        },
        {
            $addFields: {
                likesCount: {
                    $size: "$likes"
                },
                owner: {
                    $first: "$owner"
                },
                isLiked: {
                    $cond: {
                        if: {
                            $in: [req.user?._id, "$likes.likedBy"]
                        },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                "videoFile.url": 1,
                title: 1,
                description: 1,
                isLiked: 1,
                owner: 1,
                createdAt: 1,
                duration: 1,
                likesCount: 1,
                views: 1
            }
        }
    ])

    if (!video) {
        throw new ApiError(500, "falied to fetch video")
    }

    await Video.findByIdAndUpdate(videoId, {
        $inc: {
            views: 1
        }
    })

    await User.findByIdAndUpdate(req.user?._id, {
        $addToSet: {
            watchHistory: videoId
        }
    })

    return res.status(200)
        .json(new ApiResponse(200, video[0], "video details fetched successfully"))


})

// update video details 

const updateVideo = asyncHandler ( async (req,res) => {

    const { videoId } = req.params

    const { title, description } = req.body

    if(!isValidObjectId(videoId)) {
        cleanUpFiles(req)
        throw new ApiError(400, "invalid video id")
    }

    const video = await Video.findById(videoId)

    if(video?.owner.toString() !== req.user?._id.toString()) {
        cleanUpFiles(req)
        throw new ApiError(400, "you can't edit the video you are not the owner")
    }

    if(!(title && description)) {
        cleanUpFiles(req)
        throw new ApiError(400, "title and description are required")
    }

    const thumbnailToDelete = video?.thumbnail.publicId

    const thumbnailLocalPath = req.file?.path

    if(!thumbnailLocalPath) {
        cleanUpFiles(req)
        throw new ApiError(400, "thumbnail is required")
    }

    const thumbanil = await uploadOnCloudinary(thumbnailLocalPath)

    if(!thumbanil?.url) {
        throw new ApiError(400, "thumbnail upload failed")
    }

    const updateVideo = await Video.findByIdAndUpdate(videoId, {
        $set: {
            title,
            description,
            thumbnail: {
                publicId: thumbanil?.public_id,
                url: thumbanil?.secure_url
            }
        }
    },{ new: true })

    if (!updateVideo) {
        throw new ApiError(500, "Failed to update video please try again")
    }

    if(updateVideo) {
        await deleteOnCloudinary(thumbnailToDelete)
    }

    return res.status(200)
                .json(new ApiResponse(200, updateVideo, "Video updated successfully"))

})

export { publishAVideo, getVideoById, updateVideo }