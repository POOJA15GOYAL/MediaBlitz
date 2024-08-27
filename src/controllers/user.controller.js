import {asyncHandler} from "../utils/asyncHandler.js"
import {Apierror} from "../utils/Apierror.js"
import {User} from "../models/user.model.js"
import uplaodOnCloudinary from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"


const registerUser=asyncHandler(async(req,res)=>{
   const {fullname, email,username,password}=req.body
   console.log("email:",email);
   /*  i can write condition one by one 
   if(fullname===""){
    throw new Apierror(400,"fullname is required")
   }
    or */
    if([fullname,email,username,password].some((field)=>field?.trim()==="")){
throw new Apierror(400,"all these fields are required")
    }

    const existedUser= User.findOne({
        $or :[{username},{email}]
    })
    if(existedUser){
        throw new Apierror(409,"user with email or username already exists")
    }
    const avatarLocalPath=req.files?.avatar[0]?.path;
    const coverImageLocalPath=req.files?.coverImage[0]?.path;
    if(!avatarLocalPath){
        throw new Apierror(400,"avatar file is required")
    }

    const avatar=await uplaodOnCloudinary(avatarLocalPath)
    const coverImage=await uplaodOnCloudinary(coverImageLocalPath)
    if(!avatar){
        throw new Apierror(400,"avatar file required")
    }

    const user=awaitUser.create({
        fullname,
        avatar:avatar.url,
        coverImage:coverImage?.url|| "" ,
        email,
        password,
        username:username.toLowerCase()
     })
     const createdUser=await User.findById(user._id).select(
        "-password -refreshToken"
     )
     if(!createdUser){
        throw new Apierror(500,"something went wrong while registering user")
     }

     return res.status(201).json(
        new ApiResponse(200, createdUser,"User registered successsfully")
     )
})


export {registerUser}