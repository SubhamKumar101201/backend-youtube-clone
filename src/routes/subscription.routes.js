import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { getSubscribedChannels, getUserChannelSubscribers, toggleSubscription } from "../controllers/subscription.controller";

const router = Router()

router.use(verifyJWT, upload.none())

router.route("/c/:channelId").get(getUserChannelSubscribers).post(toggleSubscription)

router.route("/u/:subscriberId").get(getSubscribedChannels)

export default router