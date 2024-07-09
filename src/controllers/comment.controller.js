import mongoose, { isValidObjectId } from "mongoose"
import {Comment} from "../models/comment.model.js"
import {Video} from "../models/video.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import asyncHandler from "../utils/asyncHandler.js"
import { Like } from "../models/like.model.js"

// get all comments for a video

const getVideoComments = asyncHandler(async (req, res) => {
 
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    if(!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id")
    }

    const video = await Video.findById(videoId)

    if(!video) {
        throw new ApiError(404, "Video not found")
    }

    const pipeline = [
        {
            $match: {
                video: new mongoose.Types.ObjectId(video._id)   // get all the comments of this perticular videoId
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",        // lookup from users schema for owner of all the respective comments document from previous match aggregation
                as: "owner" 
            }       
        },
        {
           $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "comment",    // then after getting owner now lookup for comments like from likes schema for each respective comments from match aggregation
                as: "likes"
           } 
        },
        {
            $addFields: {                   // here add fields like count, owner of the comment, and is this LoggedIn user liked the comment or not
                likesCount: {
                    $size: "$likes"
                },
                owner: {
                    $first: "$owner"
                },
                isLiked: {
                    $cond: {
                        if: { $in: [req.user?._id, "$likes.likedBy"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $sort: {
                createdAt: -1       // show all the comments in descending order most recent comments come first
            }
        },
        {
            $project: {
                content: 1,
                createdAt: 1,
                likesCount: 1,
                owner: {
                    username: 1,
                    fullName: 1,
                    "avatar.url": 1
                },
                isLiked: 1,
            }
        }
    ]

    const videoComments = await Comment.aggregatePaginate(
        Comment.aggregate(pipeline),
        {
            page: parseInt(page, 10),
            limit: parseInt(limit,10)
        }
    )

    if(!videoComments) {
        throw new Error('No comments found')
    }

    return res.status(200)
                .json(new ApiResponse(200, videoComments, "Comments fetched successfully"))

})

// add a comment to a video controller

const addComment = asyncHandler(async (req, res) => {

    const { videoId } = req.params

    const { content } = req.body

    if(!isValidObjectId(videoId)) {
        throw new ApiError("Invalid video id", 400)
    }

    const video = await Video.findById(videoId)

    if(!video) {
        throw new ApiError("Video not found", 404)
    }

    if(!content) {
        throw new ApiError("Content is required", 400)
    }

    const comment = await Comment.create({
        content,
        video: videoId,
        owner: req.user?._id
    })

    if(!comment) {
        throw new ApiError("Comment not created please try again", 400)
    }

    return res.status(200)
                .json(new ApiResponse(200, comment, "Comment added successfully"))

})

// update a comment controller

const updateComment = asyncHandler(async (req, res) => {

    const { commentId } = req.params
    const { content } = req.body

    if(!isValidObjectId(commentId)) {
        throw new ApiError("Invalid comment id", 400)
    }

    if(!content) {
        throw new ApiError("Content is required", 400)
    }

    const comment = await Comment.findById(commentId)

    if(!comment) {
        throw new ApiError("Comment not found", 404)
    }

    if( comment?.owner.toString() !== req.user?._id.toString() ) {
        throw new ApiError("You can only update your comment's", 403)
    }

    const updateComment = await Comment.findByIdAndUpdate(
        comment?._id,
        {
            $set: {
                content
            }
        },
        { new: true }
    )

    if(!updateComment) {
        throw new ApiError("Comment not updated please try again", 400)
    }

    return res.status(200)
                .json(new ApiResponse(200, updateComment, "Comment edited successfully"))

})

// delete a comment controller

const deleteComment = asyncHandler(async (req, res) => {
    
    const { commentId } = req.params

    if(!isValidObjectId(commentId)) {
        throw new ApiError("Invalid comment id", 400)
    }

    const comment = await Comment.findById(commentId)

    if(!comment) {
        throw new ApiError("Comment not found", 404)
    }

    if(comment.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(400, "Only owner can delete their comments")
    }

    await Comment.findByIdAndDelete(commentId)

    await Like.deleteMany({
        comment: commentId
    })

    return res.status(200)
                .json(new ApiResponse(200, commentId, "Comment deleted successfully"))

})

export {
    getVideoComments, 
    addComment, 
    updateComment,
    deleteComment
    }