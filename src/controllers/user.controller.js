import asyncHandler from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import cleanUpFiles from "../utils/cleanUpFiles.js"
import jwt from "jsonwebtoken"

// for secure cookies
const options = {
    httpOnly: true,
    secure: true
}

// create access and refresh token

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = await user.generateAccessToken()
        const refreshToken = await user.generateRefreshToken()

        user.refreshToken = refreshToken // save the refresh token in the user object
        await user.save({ validateBeforeSave: false }) // then update in model but while save the refresh token in model it also required all the fileds but we only update the refresh toke filed so to avoid that error we use ( validateBeforeSave: false )

        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token")
    }
}

// register controller

const registerUser = asyncHandler(async (req, res) => {
    /*
     get user details from frontend
     validation - not empty, valid email
     check if user already exists - check by email or username coz both are unique
     check for images, check for avatar
     upload them to cloudinary get a response and save the response url in db, avatar
     create user object - create entry in db
     remove password and refresh token field from response
     check for user creation
     return response  
    */

    // get user details
    const { username, email, password, fullName } = req.body

    // check user details
    if (
        [ username, email, password, fullName ].some((field) => field?.trim() === "" || field === undefined )
    ) {
        cleanUpFiles(req) // cleanup the temp file if error occurs
        throw new ApiError(400, "All fields are required")
    }

    // check the email and username from db
    const existedUser = await User.findOne({
        $or: [{ email }, { username }]
    })

    if (existedUser) {
        cleanUpFiles(req) // cleanup the temp file if error occurs
        throw new ApiError(409, "User with email or username already exists")
    }

    // get avatar and coverImage lacal path 
    const avatarLocalPath = req.files?.avatar[0]?.path
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path // more checks while access a empty array


    // let coverImageLocalPath;

    // // check for the coverImage file path
    // if ( req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0 ) {
    //     coverImageLocalPath = req.files.coverImage[0].path
    // }

    if ( !avatarLocalPath ) {
        throw new ApiError(400, "Avatar file is required")
    }

    // upload avatar and coverImage into cloudinary
    const avatar = await uploadOnCloudinary( avatarLocalPath )
    const coverImage = await uploadOnCloudinary( coverImageLocalPath )

    if ( !avatar ) {
        throw new ApiError(500, "Avatar upload failed")
    }

    // create user object and create a entry in db
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "", // optional
        email,
        password,
        username: username.toLowerCase()
    })

    // remove password and refreshToken field from response
    const createdUser = await User.findById( user._id ).select(
        "-password -refreshToken"
    )

    if ( !createdUser ) {
        throw new ApiError(500, "Failed to create user") 
    }

    // return response
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    )

})

// login controller

const loginUser = asyncHandler( async (req,res) => {
    /*
        req body -> data
        check username or email
        find the user
        check password
        generate access and refresh token
        send cookie with access token
    */

        const { email, username, password } = req.body

        if ( !(username || email) ) {
            throw new ApiError(400, "username or email is required")
        }

        const user = await User.findOne({
            $or: [{ username }, { email }]
        })

        if ( !user ) {
            throw new ApiError(404, "User does not exist")
        }

        const isPasswordValid = await user.isPasswordCorrect( password )

        if ( !isPasswordValid ) {
            throw new ApiError(401, "Invalid password")
        }

        const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)

        const loggedInUser = await User.findById(user._id).select("-password -refreshToken") // modified user object where refresh token is added


        return  res.status(200)
                .cookie("accessToken", accessToken, options)
                .cookie("refreshToken", refreshToken, options)
                .json(
                    new ApiResponse(200, {
                        user: loggedInUser, accessToken, refreshToken
                    }, "User logged In Successfully")
                )



})

const logoutUser = asyncHandler( async (req,res) => {

    const userId = req.user._id // get the user id from req.user object which we add in auth middleware
    await User.findByIdAndUpdate( 
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true // to get the new updated value in return that we update here
        }
    )
    
    return  res.status(200)
                .clearCookie("accessToken", options)
                .clearCookie("refreshToken", options)
                .json( new ApiResponse(200, {}, "User logged Out Successfully") )

})

const refreshAccessToken = asyncHandler( async (req,res) => {

    const incomingRefreshToken  = req.cookies?.refreshToken || req.body?.refreshToken // get the refresh token from cookies or from body

    if ( !incomingRefreshToken ) {
        throw new ApiError(401, "Unauthorized request")
    }
    
    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

    const user = await User.findById(decodedToken?._id) // get the user from decoded refresh token 

    if ( !user ) {
        throw new ApiError(401, "Invalid refresh token")
    }

    if ( incomingRefreshToken !== user?.refreshToken ) {
        throw new ApiError(401, "Refresh token is expired or used")
    }

    const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefreshTokens(user._id)

    return  res.status(200)
                .cookie("accessToken", accessToken, options)
                .cookie("refreshToken", newRefreshToken, options)
                .json(
                    new ApiResponse(200, {
                        accessToken, newRefreshToken
                    }, "Access token refreshed successfully")
                )

})

export { registerUser, loginUser, logoutUser, refreshAccessToken }

