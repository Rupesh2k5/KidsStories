import express from 'express'
import { getCars, getUserData, loginUser, registerUser, logVisit } from '../controllers/userController.js'
import { protect } from '../middleware/auth.js'
const userRouter =express.Router()

userRouter.post('/register',registerUser)
userRouter.post('/login',loginUser)
userRouter.get('/data',protect,getUserData)
userRouter.get('/books',getCars)

userRouter.post('/log-visit', logVisit);

export default userRouter