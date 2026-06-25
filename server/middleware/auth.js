import jwt from 'jsonwebtoken'
import User from '../models/user.js';


export const protect=async(req,res,next)=>{
    let token = req.headers.authorization;
    if(!token){
        return res.json({success:false,message:"Not Authorized"})
    }
    if (token.startsWith('Bearer ')) {
        token = token.split(' ')[1];
    }
    try{
        const userId=jwt.verify(token,process.env.JWT_SECRET)
        const currentUser = await User.findById(userId).select("-password");
        if (!currentUser) {
            return res.json({success:false, message:"Not Authorized - User not found in database"});
        }
        req.user = currentUser;
        next();
    } catch(error){
        return res.json({success:false, message:error.message})
    }
}