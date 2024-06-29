import { v2 as cloudinary } from "cloudinary"


// Configuration
cloudinary.config({

    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET

})

export const deleteFileFromCloudinary = async (cloudinaryPublicId) => {

    try {

        if (!cloudinaryPublicId) return null

        await cloudinary.uploader.destroy(cloudinaryPublicId) // delete file from cloudinary using publicId

    } catch (error) {
        console.log(`Error while deleting file from Cloudinary: ${error}`)
        return null
    }

}