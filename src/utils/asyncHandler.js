export default asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise
            .resolve(requestHandler(req, res, next))
            .reject((error) => next(error))
    }
}

// export { asyncHandler }

// using try catch //
//1
/*
const asyncHandler = (func) => {
    async (req, res, next) => {
        try {
            await func(req,res,next)
        } catch (error) {
            res.status(error.code || 500).json({
                success: false,
                message: error.message
            })
        }
    }
}
*/
//2 
/*
const asyncHandler = (func) => async (req,res,next) => {
    try {
        await func(req,res,next)
    } catch (error) {
        res.status(error.code || 500).json({
            success: false,
            message: error.message
            })
    }
}
*/