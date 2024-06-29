import { Router } from "express"
import { 
    changeCurrentPassword, 
    getCurrentUser, 
    getUserChannelProfile, 
    getUserWatchHistory, 
    loginUser, 
    logoutUser, 
    refreshAccessToken, 
    registerUser, 
    updateAccountDetails, 
    updateUserAvatar, 
    updateUserCoverImage 
} from "../controllers/user.controller.js"
import { upload } from '../middlewares/multer.middleware.js'
import { verifyJWT } from "../middlewares/auth.middleware.js"

const router = Router()

/*
router.post('/register', upload.fields([
    {
        name: 'avatar',
        maxCount: 1
    }, 
    {
        name: 'coverImage',
        maxCount: 1
    }
]), registerUser )
*/

// register route
router.route('/register').post( upload.fields([
    {
        name: 'avatar',
        maxCount: 1
    }, 
    {
        name: 'coverImage',
        maxCount: 1
    }
]), registerUser )

// login route
router.route('/login').post( loginUser )

// ------- secured route ------- // 

// logout route
router.route('/logout').post( verifyJWT, logoutUser )

// refresh token route (endpoint)
router.route('/refresh-token').post( refreshAccessToken )

// change current password route
router.route('/change-password').post( verifyJWT, changeCurrentPassword )

// fetch current user route
router.route('/current-user').get( verifyJWT, getCurrentUser )

// update account details route
router.route('/update-account').patch( verifyJWT, updateAccountDetails )

// update user avatar route
router.route('/update-avatar').patch( verifyJWT, upload.single('avatar'), updateUserAvatar )

// update cover image route 
router.route('/update-cover-image').patch( verifyJWT, upload.single('coverImage'), updateUserCoverImage )

// get user channel profile
router.route('/channel-profile/:username').get( verifyJWT, getUserChannelProfile )

// get user watch history
router.route('/watch-history').get( verifyJWT, getUserWatchHistory )

export default router