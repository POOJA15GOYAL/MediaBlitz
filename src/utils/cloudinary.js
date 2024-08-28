import {v2 as cloudinary} from "cloudinary"
import fs from "fs"

    // Configuration
    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret:process.env.CLOUDINARY_API_SECRET
    });

    const uplaodOnCloudinary=async(localfilepath)=>{
        try{
            if(!localfilepath)return null
            //upload file
            const response=await cloudinary.uploader.upload(localfilepath,{
               resource_type:"auto" 
            })
               //ile uplosaded success
               console.log("file uplaoded successfully",response.url)

            
            return response
        }catch(error){
            //remove the locally saved temporary file as the upload op failed
            fs.unlinkSync(localfilepath);
            return null;
        }
    }

    export {uplaodOnCloudinary}