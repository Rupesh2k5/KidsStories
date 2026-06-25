import express from 'express'
import 'dotenv/config'
import cors from 'cors'
import connectDB from './configs/db.js'
import userRouter from './routes/userRoutes.js'
import ownerRouter from './routes/ownerRoutes.js'
import orderRouter from './routes/orderRoutes.js'
import reviewRouter from './routes/reviewRoutes.js'
//Intialize Express
const app=express()

//connect MongoDB
connectDB()

// Middleware
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'token']
}))
app.use(express.json())  


app.get('/',(req,res)=>res.send("Server is Runinng..."))
app.use('/api/user',userRouter)
app.use('/api/owner',ownerRouter)
app.use('/api/order',orderRouter)
app.use('/api/review',reviewRouter)


const PORT = process.env.PORT || 3000;
if (!process.env.VERCEL) {
    app.listen(PORT, () => console.log(`Server is Running on ${PORT}`));
}

export default app;