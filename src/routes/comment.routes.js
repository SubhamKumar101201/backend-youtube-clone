import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { addComment, deleteComment, getVideoComments, updateComment } from "../controllers/comment.controller.js";


const router = Router()

router.use(verifyJWT)   // Apply verifyJWT middleware to all routes in this file and no files are expected in the request

// get and add comments route
router.route("/:videoId").get(getVideoComments).post(addComment)

// update and delete comments route
router.route("/comnt/:commentId").delete(deleteComment).patch(updateComment)

export default router