import { Router } from "express"
import { loginUser, logoutUser, refreshAccessToken, registerUser } from "../controllers/user.controller.js"
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

export default router