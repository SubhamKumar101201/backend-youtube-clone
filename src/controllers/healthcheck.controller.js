import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


//  build a healthcheck response that simply returns the OK status as json with a message controller


const healthcheck = asyncHandler(async (req, res) => {
    return res.status(200)
                .json(new ApiResponse(200, { message: "Everything is OK" }, "OK"))
})

export {
    healthcheck
    }
    