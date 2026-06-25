import mongoose from "mongoose"
const {ObjectId} =mongoose.Schema.Types

const bookSchema=new mongoose.Schema({
    owner:{type:ObjectId, ref:'User'},
    brand:{type:String, required:true}, // Using brand as Title
    model:{type:String, required:true}, // Using model as Type (Single/Bundle)
    image:{type:String, required:true},
    pdfUrl:{type:String, required:false}, // Cloud link to the actual PDF book
    description:{type:String, required: true},
    pricePerDay:{type:Number, required: true}, // Price of book
    isAvailable:{type:Boolean,default:true},
    // Optional legacy car fields just in case they are used elsewhere to prevent crashes
    year:{type:Number, required:false},
    category:{type:String, required:false},
    seating_capacity:{type:Number, required:false},
    fuel_type:{type:String, required:false},
    transmission:{type:String, required:false},
    location:{type: String, required: false},
    pricingModel: { type: String, enum: ['perDay', 'perLiter'], default: 'perDay' },
},{timestamps:true})

const book=mongoose.model('book',bookSchema)

export default book