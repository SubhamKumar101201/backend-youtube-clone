import { v2 as cloudinary } from "cloudinary";
import fs from "fs"


// Configuration
cloudinary.config({

    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET

});


const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null
        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        // file has been uploaded on cloudinary
        // console.log("file  is uploaded on cloudinary ", response.url);
        // remove the local file
        fs.unlinkSync(localFilePath); 
        return response;

    } catch (error) {

        console.log(error);
        fs.unlinkSync(localFilePath); //remove the locally saved tempory file as the upload operation got failed
        return null;

    }
}

const deleteOnCloudinary = async (publicId, resource_type="image") => {
    try {

        if (!publicId) return null

        await cloudinary.uploader.destroy(publicId, {
            resource_type: `${resource_type}`
        })

    } catch (error) {
        console.log(`Delete on cloudinary failed: ${error}`);
        return error;
    }
}

export { uploadOnCloudinary, deleteOnCloudinary }