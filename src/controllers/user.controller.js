import asyncHandler from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"

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
        [ username, email, password, fullName ].some((field) => field?.trim() === "" )
    ) {
        throw new ApiError(400, "All fields are required")
    }

    // check the email and username from db
    const existedUser = await User.findOne({
        $or: [{ email }, { username }]
    })

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }

    // get avatar and coverImage lacal path 
    const avatarLocalPath = req.files?.avatar[0]?.path
    const coverImageLocalPath = req.files?.coverImage[0]?.path

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

export { registerUser }

