import { User } from "../models/user.model";
import { ApiError } from "../utils/ApiError";
import asyncHandler from "../utils/asyncHandler";
import jwt from "jsonwebtoken"

export const verifyJWT = asyncHandler( async(req, _, next) => {
    const token = req.cookies?.accessToken || req.header( "Authorization" )?.split("Bearer ")[1]

    if ( !token ) {

        throw new ApiError(401, "Unauthorized request")

    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

    const user = await User.findById(decodedToken?._id).select("-password -refreshToken")

    if ( !user ) {

        throw new ApiError(401, "Invalid Access Token")

    }

    req.user = user // add a new object in req example: user

    next() // In last forward to next operation

})