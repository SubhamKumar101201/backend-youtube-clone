import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"


//  create playlist controller

const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body

    if(
        [name, description].some((field) => field?.trim() === "" ||  field === undefined)
    ) {
        throw new ApiError("name and description both fields are required", 400)
    }

    const playlist = await Playlist.create({
        name,
        description,
        owner: req.user?._id
    })

    if(!playlist) {
        throw new ApiError("Failed to create playlist", 500)
    }

    return res.status(200)
                .json(new ApiResponse(200, playlist, "Playlist created successfully"))
    
})

//  get user playlists controller

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params

    if(!isValidObjectId(userId)) {
        throw new ApiError("Invalid user id", 400)
    }

    const playlists = await Playlist.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos"
            }
        },
        {
            $addFields: {
                totalVideos: {
                    $size: "$videos"
                },
                totalViews: {
                    $sum: "$videos.views"
                }
            }
        },
        {
            $project: {
                _id: 1,
                name: 1,
                description: 1,
                totalVideos: 1,
                totalViews: 1,
                updatedAt: 1
            }
        }
    ])

    if(!playlists) {
        throw new ApiError("Failed to fetch playlists", 404)
    }

    return res.status(200)
                .json(new ApiResponse(200, playlists, "User playlists fetched successfully"))            
    
})

//  get playlist by id controller

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params

    if(!isValidObjectId(playlistId)) {
        throw new ApiError("Invalid playlist id", 400)
    }

    const playlist = await Playlist.findById(playlistId)

    if(!playlist) {
        throw new ApiError("Playlist not found", 404)
    }

    const playlistVideos = await Playlist.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(playlistId)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos",
                pipeline: [
                    {
                        $match: {
                            isPublished: ture
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
                as: "owner"
            }
        },
        {
            $addFields: {
                totalVideos: {
                    $size: "$videos"
                },
                ownerDetails: {
                    $first: "$owner"
                },
                totalViews: {
                    $sum: "$videos.views"
                }
            }
        },
        {
            $project: {
                name: 1,
                description: 1,
                createdAt: 1,
                updatedAt: 1,
                totalVideos: 1,
                totalViews: 1,
                videos: {
                    _id: 1,
                    "videoFile.url": 1,
                    "thumbnail.url": 1,
                    title: 1,
                    description: 1,
                    duration: 1,
                    createdAt: 1,
                    views: 1
                },
                ownerDetails: {
                    username: 1,
                    fullName: 1,
                    "avatar.url": 1
                }
            }
        }
    ])   
    
    if(playlistVideos.length < 0) {
        throw new ApiError(500, "Failed to fetch videos for playlist")
    }

    return res.status(200)
                .json(new ApiResponse(200, playlistVideos[0],"Playlist fetched successfully"))
    
})

// add video to playlist controller

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    if (!(isValidObjectId(playlistId) || isValidObjectId(videoId))) {
        throw new ApiError(400, "Invalid VideoId or PlaylistId")
    }

    const playlist = await Playlist.findById(playlistId)

    if(!playlist) {
        throw new ApiError("Playlist not found", 404)
    }

    const videoFile = await Video.findById(videoId)

    if(!videoFile) {
        throw new ApiError("Video not found", 404)
    }

    if(playlist?.owner.toString() !== req.user?._id.toString() || videoFile?.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(400, "Only owner can add video to their playlist")
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $addToSet: {videos: videoId}
        },
        {new: true}
    )

    if(!updatedPlaylist) {
        throw new ApiError("Failed to add video to playlist please try again", 404)
    }

    return res.status(200)
                .json(new ApiResponse(200, updatedPlaylist, "Add video to playlist successfully"))

})

 // remove video from playlist controller

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
   
    if(!(isValidObjectId(playlistId) || isValidObjectId(videoId))) {
        throw new ApiError(400, "Invalid VideoId or PlaylistId")
    }

    const playlist = await Playlist.findById(playlistId)

    const videoFile = await Video.findById(videoId)

    if(!playlist) {
        throw new ApiError("Playlist not found", 404)
    }

    if(!videoFile) {
        throw new ApiError("Video not found", 404)
    }

    if(playlist?.owner.toString() !== req.user?._id.toString() ||  videoFile?.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(400, "Only owner can remove video from their playlist")
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull: {videos: videoId}
        },
        {new: true}
    )

    if(!updatedPlaylist) {
        throw new ApiError("Failed to remove video from playlist please try again", 404)
    }

    return res.status(200)
                .json(new ApiResponse(200, updatedPlaylist, "Remove video from playlist successfully"))


})

//  delete playlist controller

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params

    if(!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid PlaylistId")
    }

    const playlist = await Playlist.findById(playlistId)

    if(!playlist) {
        throw new ApiError("Playlist not found", 404)
    }

    if(playlist?.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(400, "Only owner can delete their playlist")
    }

    await Playlist.findByIdAndDelete(playlistId)

    return res.status(200)
                .json(new ApiResponse(200, {}, "Playlist delete successfully"))
})

//  update playlist controller

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    
    if(!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid PlaylistId")
    }

    if(
        [name,description].some((field) => field?.trim()  === "" || field === undefined) 
    ) {
        throw new ApiError(400, "name and description both are required")
    }

    const playlist = await Playlist.findById(playlistId)

    if(!playlist) {
        throw new ApiError("Playlist not found", 404)
    }

    if(playlist?.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(400, "Only owner can edit their playlist")
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $set: {
                name,
                description
            }
        },
        {new: true}
    )

    if(!updatedPlaylist) {
        throw new ApiError("Failed to update playlist please try again", 404)
    }

    return res.status(200)
                .json(new ApiResponse(200, updatedPlaylist, "Playlist updated successfully"))

})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}