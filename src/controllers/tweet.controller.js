import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import asyncHandler from "../utils/asyncHandler.js"

//  create tweet controllers

const createTweet = asyncHandler(async (req, res) => {

    const { content } = req.body

    if(!content) {
        throw new ApiError(400, "Content is required")
    }

    const tweet = await Tweet.create({
        content,
        owner: req.user?._id
    })

    if(!tweet) {
        throw new ApiError(500, "Failed to create tweet please try again")
    }

    return res.status(200)
                .json(new ApiResponse(201, tweet, "Tweet created successfully"))

})

//  get user tweets controllers

const getUserTweets = asyncHandler(async (req, res) => {

    const {userId} = req.params

    if(!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user id")
    }

    const tweets = await Tweet.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "tweet",
                as: "likeDetails",
                pipeline: [
                    {
                        $project: {
                            likedBy: 1
                        }
                    }
                ]
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            "avatar.url": 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                likesCount: {
                    $size: "$likeDetails"
                },
                ownerDetails: {
                    $first: "$ownerDetails"
                },
                isLiked: {
                    $cond: {
                        if: {
                            $in: [userId, "$likeDetails.likedBy"]
                        },
                        then: true,
                        else: false
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
                ownerDetails: 1,
                content: 1,
                likesCount: 1,
                createdAt: 1,
                isLiked: 1
            }
        }
    ])

    if(tweets.length < 0) {
        throw new ApiError(500, "No tweets found")
    }

    return res.status(200)
                .json(new ApiResponse(200, tweets, "Tweets fetched successfully"))

})

//  update tweet controllers

const updateTweet = asyncHandler(async (req, res) => {
    
    const { content } = req.body
    const { tweetId } = req.params

    if(!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet id")
    }

    if(!content) {
        throw new ApiError(400, "Content is required")
    }

    const tweet = await Tweet.findById(tweetId)

    if(!tweet) {
        throw new ApiError(404, "Tweet not found")
    }

    if(req.user?._id.toString() !== tweet?.owner.toString()) {
        throw new ApiError(403, "You are not authorized to update this tweet")
    }

    const updatedTweet = await Tweet.findByIdAndUpdate(tweet?._id,
        {
           $set: {
                content
           }
        },
        { new: true }
    )

    if(!updateTweet) {
        throw new ApiError(500, "Failed to edit tweet please try again")
    }

    return res.status(200)
                .json(new ApiResponse(200, updateTweet, "Tweet updated successfully"))

})

//  delete tweet controllers

const deleteTweet = asyncHandler(async (req, res) => {
    
    const { tweetId } = req.params

    if(!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet id")
    }

    const tweet = await Tweet.findById(tweetId)

    if (!tweet) {
        throw new ApiError(404, "Tweet not found")
    }

    if(req.user?._id.toString() !==  tweet?.owner.toString()) {
        throw new ApiError(403, "You are not authorized to delete this tweet")
    }

    await Tweet.findByIdAndDelete(tweet?._id)

    return res.status(200)
                .json(new ApiResponse(200, {}, "Tweet deleted successfully"))

})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}