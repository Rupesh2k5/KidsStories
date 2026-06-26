import User from "../models/user.js"
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import book from "../models/book.js";
const generateToken=(userId)=>{
    const payload=userId;
    return jwt.sign(payload,process.env.JWT_SECRET)
}

export const registerUser=async(req,res)=>{
    try{
        const {name,email,password,role}=req.body
        if(!name || !email ||!password || password.length<7){
            return res.json({success:false, message:'Fill all the fields'})
        }

        const userExists=await User.findOne({email})

        if(userExists){
            return res.json({success:false, message:'User Already Exists'})
        }

        const hashedPassword=await bcrypt.hash(password,10)
        const user=await User.create({name,email,password:hashedPassword, role: role || 'user'})
        const token=generateToken(user._id.toString())
        res.json({success:true, token})

    }
    catch(error){
        console.log(error.message)
        res.json({success:false, message:error.message})
    }
}
export const loginUser=async(req,res)=>{
    try{
        const {name,email,password}=req.body
        const ExistingUser = await User.findOne({ email })
        const token = generateToken(
            ExistingUser._id.toString()
        )
       if (!ExistingUser) {
            return res.json({
                success: false,
                message: "User not found"
            })
        }
       const isMatch=await bcrypt.compare(password,ExistingUser.password)
       if(!isMatch){
        return res.json({success:false, message:'Invalid Credentials'})
       }
       res.json({success:true, token})
    }
    catch(error){
        console.log(error.message)
        res.json({success:false, message:error.message})
    }
}

export const getUserData = async (req, res) => {
    try {
        const user = req.user
        res.json({
            success: true,
            user
        })
    } 
    catch (error) {
        console.log(error.message)
        res.json({
            success: false,
            message: error.message
        })
    }
}


export const getCars = async (req, res) => {
    try {
        const books = await book.aggregate([
            { $match: { isAvailable: true } },
            {
                $lookup: {
                    from: "reviews",
                    localField: "_id",
                    foreignField: "book",
                    as: "reviewsList"
                }
            },
            {
                $addFields: {
                    averageRating: { $avg: "$reviewsList.rating" },
                    reviewCount: { $size: "$reviewsList" }
                }
            },
            {
                $project: {
                    reviewsList: 0
                }
            }
        ])
        
        // MongoDB aggregate doesn't return Mongoose documents, and it drops the 'id' getter if we rely on it, 
        // but frontend usually uses `_id` anyway. Just to be safe, if we need it to behave like find():
        res.json({ success: true, books })
    } catch (error) {
        console.log(error.message)
        res.json({ success: false, message: error.message })
    }
}
import Visitor from '../models/visitor.js';
export const logVisit = async(req, res) => {
    try {
        const { city } = req.body;
        if(city) {
            await Visitor.create({ city });
        }
        res.json({success: true});
    } catch(err) {
        res.json({success: false, message: err.message});
    }
}
