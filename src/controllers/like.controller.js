import mongoose, { isValidObjectId } from "mongoose"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"

//  toggle like on video controller

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id")
    }

    const videoLikedAlready = await Like.findOne({
        video: videoId,
        likedBy: req.user?._id
    })

    if (videoLikedAlready) {
        await Like.findByIdAndDelete(videoLikedAlready?._id)

        return res.status(200)
            .json(new ApiResponse(200, { isLiked: false }, "Video like status toggled successfully"))
    }

    await Like.create({
        video: videoId,
        likedBy: req.user?._id
    })

    return res.status(200)
        .json(new ApiResponse(200, { isLiked: true }, "Video like status toggled successfully"))

})

//  toggle like on comment controller

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment id")
    }

    const commentLikedAlready = await Like.findOne({
        comment: commentId,
        likedBy: req.user?._id
    })

    if (commentLikedAlready) {
        await Like.findByIdAndDelete(commentLikedAlready?._id)

        return res.status(200)
            .json(new ApiResponse(200, { isLiked: false }, "Comment like status toggles successfully"))
    }

    await Like.create({
        comment: commentId,
        likedBy: req.user?._id
    })

    return res.status(200)
        .json(new ApiResponse(200, { isLiked: true }, "Comment like status toggles successfully"))

})

//  toggle like on tweet controller

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid comment id")
    }

    const tweetLikedAlready = await Like.findOne({
        tweet: tweetId,
        likedBy: req.user?._id
    })

    if (tweetLikedAlready) {
        await Like.findByIdAndDelete(tweetLikedAlready?._id)

        return res.status(200)
            .json(new ApiResponse(200, { isLiked: false }, "Tweet like status toggles successfully"))
    }

    await Like.create({
        tweet: tweetId,
        likedBy: req.user?._id
    })

    return res.status(200)
        .json(new ApiResponse(200, { isLiked: true }, "Tweet like status toggles successfully"))

})

//  get all liked videos

const getLikedVideos = asyncHandler(async (req, res) => {

    const likedVideosAggregate = await Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "likedVideo",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "ownerDetails"
                        }
                    },
                    {
                        $unwind: "$ownerDetails"
                    }
                ]
            }
        },
        {
            $unwind: "$likedVideo"
        },
        {
            $sort: {
                createdAt: -1
            }
        },
        {
            $project: {
                likedVideo: {
                    _id: 1,
                    title: 1,
                    description: 1,
                    "videoFile.url": 1,
                    "thumbnail.url": 1,
                    owner: 1,
                    views: 1,
                    createdAt: 1,
                    duration: 1,
                    isPublished: 1,
                    ownerDetails: {
                        username: 1,
                        fullName: 1,
                        "avatar.url": 1
                    }
                }
            }
        }
    ])

    if(!likedVideosAggregate) {
        throw new ApiError(404, "No liked videos found try again")
    }

    return res.status(200)
                .json(new ApiResponse(200, likedVideosAggregate, "Liked videos fetched successfully"))

})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}