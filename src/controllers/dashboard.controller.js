import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

//  Get the channel stats like total video views, total subscribers, total videos, total likes etc.


const getChannelStats = asyncHandler(async (req, res) => {

    const totalSubscribers = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $group: {
                _id: null,
                SubscribersCount: {
                    $sum: 1
                }
            }
        }
    ])

    const video = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            }
        },
        {
            $project: {
                totalLikes: {
                    $size: "$likes"
                },
                totalViews: "$views",
                totalVideos: 1
            }   
        },
        {
            $group: {
                _id: null,
                totalLikes: {
                    $sum: "$totalLiks"
                },
                totalViews: {
                    $sum: "$totalViews"
                },
                totalVideos: {
                    $sum: "$totalVideos"
                }
            }
        }
    ])

    const channelStats = {
        totalSubscribers: totalSubscribers[0]?.SubscribersCount || 0,
        totalLikes: video[0]?.totalLikes || 0,
        totalViews: video[0]?.totalViews || 0,
        totalVideos: video[0]?.totalVideos || 0
    }

    return res.status(200)  
                .json(new ApiResponse(200, channelStats, "Channel status fetched successfully"))

})

//  Get all the videos uploaded by the channel

const getChannelVideos = asyncHandler(async (req, res) => {

    const videos = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            }
        },
        {
            $addFields: {
                totalLikes: {
                    $size: "$likes"
                },
                createdAt: {
                    $dateToParts: {
                        date: "$createdAt"
                    }
                }
            }
        },
        {
            $sort: {
                createdAt: -1
            }
        },
        {
            $project: {
                _id: 1,
                title: 1,
                description: 1,
                "thumbnail.url": 1,
                "videoFile.url": 1,
                createdAt: {
                    year: 1,
                    month: 1,
                    day: 1
                },
                isPublished: 1,
                totalLikes: 1
            }
        }
    ])

    return res.status(200)
                .json(new ApiResponse(200, videos, "Channel stats fetched successfully"))
    

})

export {
    getChannelStats, 
    getChannelVideos
    }