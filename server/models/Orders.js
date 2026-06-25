import mongoose from "mongoose"
const {ObjectId} =mongoose.Schema.Types

const orderSchema=new mongoose.Schema({
    book:{type:ObjectId, ref:'book', required:true},
    user:{type:ObjectId, ref:"user",required:true},
    owner: {type:ObjectId, ref:'user', required:true},
    pickupDate: {type:Date, required:true},
    returnDate:{type:Date, required:true},
    status:{type: String, enum:["pending","confirmed","cancelled"],default:"pending"},
    price:{type:Number, required:true},
    advancePaid:{type:Number, default:0},
    balanceAmount:{type:Number, default:0}
},{timestamps:true})


const order=mongoose.model('order',orderSchema)

export default order