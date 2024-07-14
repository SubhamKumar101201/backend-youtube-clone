import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


//  toggle subscription controller

const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    
    if(!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid Channel Id")
    }

    const isSubscribed = await Subscription.findOne({
        subscriber: req.user?._id,
        channel: channelId
    })

    if(isSubscribed) {
        await Subscription.findByIdAndDelete(isSubscribed?._id)

        return res.status(200)
                .json(new ApiResponse(200, { subscribed: false },"Unsubscribe to this channel successfully"))

    }

    await Subscription.create({
        subscriber: req.user?._id,
        channel: channelId
    })

    return res.status(200)
                .json(new ApiResponse(200, { subscribed: true },"Subscribe to this channel successfully"))

})

// controller to return subscriber list of a channel

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel Id")
    }

    const subscribers = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscribers",
                pipeline: [
                    {
                        $lookup: {
                            from: "subscriptions",
                            localField: "_id",
                            foreignField: "channel",
                            as: "subscribedToSubcriber"
                        }
                    },
                    {
                        $addFields: {
                            subscribedToSubcriber: {
                                $cond: {
                                    if: {
                                        $in: [
                                            channelId, "$subscribedToSubcriber.subscriber"
                                        ]
                                    },
                                    then: true,
                                    else: false
                                }
                            },
                            subscribersCount: {
                                $size: "$subscribedToSubcriber"
                            }
                        }
                    }
                ]
            }   
        },
        {
            $unwind: "$subscribers"
        },
        {
            $project: {
                _id: 1,
                subscribers: {
                    _id: 1,
                    username: 1,
                    fullName: 1,
                    "avatar.url": 1,
                    subscribedToSubcriber: 1,
                    subscribersCount: 1
                }
            }
        }
    ])

    if(!subscribers) {
        throw new ApiError(500, "Failed to fetch subscribers")
    }

    return res.status(200)
                .json(new ApiResponse(200, subscribers, "Fetched Subscribers successfully"))

})

// controller to return channel list to which user has subscribed

const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Invalid subscriber Id")
    }

    const subscribedChannels = await Subscription.aggregate([
        {
            $match: {
                subscriber : new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "channelSubscribed",
                pipeline: [
                    {
                        $lookup: {
                            from: "vidoes",
                            localField: "_id",
                            foreignField: "owner",
                            as: "videos"
                        }
                    },
                    {
                        $addFields: {
                            latestVideo: {
                                $last: "$videos"
                            }
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$channelSubscribed"
        },
        {
            $project: {
                channelSubscribed: {
                    _id: 1,
                    username: 1,
                    fullName: 1,
                    "avatar.url": 1,
                    latestVideo: {
                        _id: 1,
                        title: 1,
                        description: 1,
                        "thumbnail.url": 1,
                        "videoFile.url" : 1,
                        views: 1,
                        owner: 1,
                        createdAt: 1,
                        duration: 1,
                    }
                }
            }
        }
    ])

    if(!subscribedChannels) {
        throw new ApiError(500, "Failed to fetch subscribed channels")
    }

    return res.status(200)
                .json(new ApiResponse(200, subscribedChannels, "Subscribed channels fetched sucessfully"))

})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}