import mongoose from "mongoose";
const visitorSchema = new mongoose.Schema({
    city: {type: String, required: true},
    timestamp: {type: Date, default: Date.now}
});
export default mongoose.model('visitor', visitorSchema);
