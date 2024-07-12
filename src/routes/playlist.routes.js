import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { addVideoToPlaylist, createPlaylist, deletePlaylist, getPlaylistById, getUserPlaylists, removeVideoFromPlaylist, updatePlaylist } from "../controllers/playlist.controller";

const router = new Router()

router.use(verifyJWT, upload.none())

router.route("/").post(createPlaylist)

router.route("/:playlistId").get(getPlaylistById).patch(updatePlaylist).delete(deletePlaylist)

router.route("/add/:videoId/:playlistId").patch(addVideoToPlaylist)

router.route("/remove/:videoId/:playlistId").patch(removeVideoFromPlaylist)

router.route("/user/:userId").get(getUserPlaylists)

export default router