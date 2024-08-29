import {asyncHandler} from "../utils/asyncHandler.js"
import {Apierror} from "../utils/Apierror.js"
import {User} from "../models/user.model.js"
import {uplaodOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"

const generateAccessAndRefreshTokens= async(userId)=>{
    try{
        const user=await User.findById(userId)
        const accessToken=user.generateAccesToken()
        const refreshToken=user.generateRefreshToken()
        user.refreshToken=refreshToken
        await user.save({ validateBeforeSave: false })
        return {accessToken,refreshToken}
    }catch(error){
        throw new Apierror(500,"Something went wrong while generating refresh and access token")
    }

}

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

    const existedUser= await User.findOne({
        $or :[{username},{email}]
    })
    if(existedUser){
        throw new Apierror(409,"user with email or username already exists")
    }
    console.log(req.files)

    const avatarLocalPath=req.files?.avatar[0]?.path;
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }    
    if(!avatarLocalPath){
        throw new Apierror(400,"avatar file is required")
    }

    const avatar=await uplaodOnCloudinary(avatarLocalPath)
    const coverImage=await uplaodOnCloudinary(coverImageLocalPath)
    if(!avatar){
        throw new Apierror(400,"avatar file required")
    }

    const user= await User.create({
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

const loginUser =asyncHandler(async(req,res)=>{
// data from req body
//username or email
//find user
//password check
//access and refresh token send
//send cookies

const {email,username,password}=req.body

if(!(username || email)){
    throw new Apierror(400,"username or email is required")
}

const user =await User.findOne({
    $or:[{username},{email}]
})
if(!user){
    throw new Apierror(404,"User does not exist")
}
// this user is not from mongoose it is for the fns we made
const isPasswordValid= await user.isPasswordCorrect(password)
if(!isPasswordValid){
    throw new Apierror(401,"Invalid user credentials")
}
const {accessToken,refreshToken}=await generateAccessAndRefreshTokens(user._id)
const loogedInUser= await User.findById(user._id)
.select("-password -refreshToken")

const options={
    httpOnly:true,
    secure:true
}
return res
.status(200)
.cookie("accesToken",accessToken,options)
.cookie("refreshToken",refreshToken,options)
.json(
    new ApiResponse(200,
        //apires class data
    {user:loogedInUser,accessToken,refreshToken}
    ,"User loggedin successfully")
)
})

const logoutUser= asyncHandler(async(req,res)=>{
   await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset:{refreshToken:1}
        },{
            new:true
        }
    ) 
    const options={
        httpOnly:true,
        secure:true
    }
    return res.status(200).clearCookie("accessToken",options)
    .json(new ApiResponse(200,{},"User logged out successfully"))
})

const refreshAccessToken=asyncHandler(async(req,res)=>{
    const incomingRefreshToken=req.cookie.refreshToken || req.body.refreshToken

    if(incomingRefreshToken){
        throw new Apierror(401,"unauthorized request")
    }

    
    try {
        const decodedToken=jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
        const user= await User.findById(decodedToken?._id)
        if(!user){
            throw new Apierror(401,"invalid refresh token")
        }
        if(incomingRefreshToken!== user?.refreshToken){
            throw new Apierror(401,"refresh token is expired or used")
        }
        const options={
            httpOnly:true,
            secure:true
    
        }
        const {accessToken,newRefreshToken}=await generateAccessAndRefreshTokens(user._id)
        return res.cookie("accessToken",accessToken,options)
        .cookie("refreshToken",newRefreshTokenrefreshToken,options)
        .json(
            new ApiResponse(200,{accessToken,refreshToken:newRefreshToken},
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new Apierror(401,error?.message || "invalid refresh token")
    }
})
export {registerUser,loginUser,logoutUser,refreshAccessToken}