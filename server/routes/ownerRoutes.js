import express from 'express'
import { protect } from '../middleware/auth.js'
import { addCar, changeRoleToOwner, deleteCar, getDashboardData, getOwnerCars, toggleCarAvailability, updateUserImage, updateBookImage, updateBookPdf } from '../controllers/ownerController.js'
import upload from '../middleware/multer.js'
const ownerRouter =express.Router()

ownerRouter.post('/change-role',protect,changeRoleToOwner)
ownerRouter.post('/add-book', protect, upload.fields([{name: 'image', maxCount: 1}, {name: 'pdf', maxCount: 1}]), addCar)
ownerRouter.get('/books',protect,getOwnerCars)
ownerRouter.post('/toggle-book',protect,toggleCarAvailability)
ownerRouter.post('/delete-book',protect,deleteCar)
ownerRouter.get('/dashboard',protect,getDashboardData)
ownerRouter.post('/update-image',upload.single('image'),protect,updateUserImage)
ownerRouter.post('/update-book-image', upload.single('image'), protect, updateBookImage)
ownerRouter.post('/update-book-pdf', upload.single('pdf'), protect, updateBookPdf)

export default ownerRouter