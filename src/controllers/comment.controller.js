import mongoose, { isValidObjectId } from "mongoose"
import {Comment} from "../models/comment.model.js"
import {Video} from "../models/video.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Like } from "../models/like.model.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

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