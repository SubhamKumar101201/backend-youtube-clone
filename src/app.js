import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express();


app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

//routes import
import userRouter from './routes/user.routes.js'
import videoRoute from './routes/video.routes.js'
import commentRoute from './routes/comment.routes.js'
import likeRoute from './routes/like.routes.js'
import tweetRoute from './routes/tweet.routes.js'
import playlistRoute from './routes/playlist.routes.js'
import subscriptionRoute from './routes/subscription.routes.js'
import dashboardRoute from './routes/dashboard.routes.js'
import healthcheckRoute from './routes/healthcheck.routes.js'

//routes declaration
app.use("/api/v1/users", userRouter)
app.use("/api/v1/video", videoRoute)
app.use("/api/v1/comment", commentRoute)
app.use("/api/v1/like", likeRoute)
app.use("/api/v1/tweet", tweetRoute)
app.use("/api/v1/playlist", playlistRoute)
app.use("/api/v1/subscription", subscriptionRoute)
app.use("/api/v1/dashboard", dashboardRoute)
app.use("/api/v1/healthcheck", healthcheckRoute)

export { app }