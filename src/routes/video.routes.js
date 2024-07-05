import { Router } from "express";
import { deleteVideo, getAllVideos, getVideoById, publishAVideo, togglePublishStatus, updateVideo } from "../controllers/video.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router()


router.use(verifyJWT)


// -------- secured routes --------- //

// publish a video route
router.route('/')
    .get(getAllVideos)
    .post(upload.fields([
    {
        name: "videoFile",
        maxCount: 1
    },
    {
        name: "thumbnail",
        maxCount: 1
    }
]), publishAVideo )

router
    .route("/:videoId")
    .get(getVideoById)      // get video by id route
    .patch(upload.single("thumbnail"), updateVideo)     // update a video route
    .delete(deleteVideo)    // delete a video by id  route

// toggle a video publish status route

router.route("/toggle/publish/:videoId").patch(togglePublishStatus)

export default router