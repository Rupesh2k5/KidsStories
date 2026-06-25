import imageKit from "../configs/imagekit.js";
import user from "../models/user.js"
import Book from "../models/book.js"
import fs from 'fs'
import order from "../models/Orders.js";


export const changeRoleToOwner=async(req,res)=>{
    try{
        const{_id}=req.user;
        await user.findByIdAndUpdate(_id,{role:"owner"})
        res.json({success:true, message:"Now you can add your books!!"})
    }
    catch(error){
        console.log(error.message)
        res.json({success:false, message:error.message})
    }
}


export const addCar=async(req,res)=>{
    try{
        const {_id}=req.user
        let bookData =JSON.parse(req.body.bookData)
        
        // Handle Image
        const imageFile = req.files && req.files.image ? req.files.image[0] : null;
        if (imageFile) {
            const fileBuffer=fs.readFileSync(imageFile.path)
            const response=await imageKit.upload({
                file:fileBuffer,
                fileName:imageFile.originalname,
                folder:'/book'
            })
            var optimizedImageUrl=imageKit.url({
                path:response.filePath,
                transformation:[
                    {width:'1280'},
                    {quality:'auto'},
                    {format:'webp'}
                ]
            })
            bookData.image = optimizedImageUrl;
        }

        // Handle PDF
        const pdfFile = req.files && req.files.pdf ? req.files.pdf[0] : null;
        if (pdfFile) {
            const pdfBuffer = fs.readFileSync(pdfFile.path);
            const pdfResponse = await imageKit.upload({
                file: pdfBuffer,
                fileName: pdfFile.originalname,
                folder: '/book_pdfs',
                useUniqueFileName: true
            });
            bookData.pdfUrl = pdfResponse.url; // Use raw URL for PDFs
        }

        await Book.create({...bookData,owner:_id})

        res.json({success:true, message:"Book Added!!!"})
    }
    catch(error){
        console.log(error.message)
        res.json({success:false, message:error.message})
    }
}

export const getOwnerCars=async(req,res)=>{
    try{
        const {_id}=req.user
        const books = await Book.find({owner:_id}).lean()
        const orders = await order.find({owner:_id, status: { $in: ['pending', 'confirmed'] }})

        books.forEach(book => {
            book.orders = orders
                .filter(b => String(b.book) === String(book._id))
                .map(b => ({
                    pickupDate: b.pickupDate,
                    returnDate: b.returnDate,
                    status: b.status
                }))
        })

        res.json({success:true, books})
    }
    catch(error){
        console.log(error.message)
        res.json({success:false, message:error.message})
    }
}

export const toggleCarAvailability = async (req, res) => {
    try {

        const { _id } = req.user
        const { bookId } = req.body

        const book = await Book.findById(bookId)

        if (!book) {
            return res.json({
                success: false,
                message: "Book not found"
            })
        }

        if (book.owner.toString() !== _id.toString()) {
            return res.json({
                success: false,
                message: "Unauthorized"
            })
        }

        book.isAvailable = !book.isAvailable

        await book.save()

        res.json({
            success: true,
            message: "Availability Updated"
        })

    } catch (error) {

        console.log(error)

        res.json({
            success: false,
            message: error.message
        })
    }
}

export const deleteCar = async (req, res) => {
    try {

        const { _id } = req.user
        const { bookId } = req.body

        const book = await Book.findById(bookId)

        if (!book) {
            return res.json({
                success: false,
                message: "Book not found"
            })
        }

        if (book.owner.toString() !== _id.toString()) {
            return res.json({
                success: false,
                message: "Unauthorized"
            })
        }

        await Book.findByIdAndDelete(bookId)

        res.json({
            success: true,
            message: "Book Deleted Successfully"
        })

    } catch (error) {

        console.log(error)

        res.json({
            success: false,
            message: error.message
        })
    }
}

export const getDashboardData=async(req,res)=>{
    try{
        const {_id,role}=req.user
        
        if(role!=='owner'){
            return res.json({success:false, message:'Unauthorized'})
        }

        const books=await Book.find({owner:_id})

        const orders=await order.find({owner:_id}).populate('book').sort({createdAt:-1})
        const pendingOrders=await order.find({owner:_id, status:'pending'})
        const completedOrders=await order.find({owner:_id,status:'confirmed'})
        const monthlyRevenue=orders.slice().filter(book=>book.status==='confirmed').reduce((acc,book)=>acc + book.price,0)

        // Calculate weekend orders
        const weekendOrders = orders.filter(o => {
            const day = new Date(o.createdAt).getDay();
            return day === 0 || day === 6; // Sunday(0) or Saturday(6)
        });

        const dashboardData={
            totalCars:books.length,
            totalOrders:orders.length,
            pendingOrders:pendingOrders.length,
            completedOrders:completedOrders.length,
            recentOrders:orders.slice(0,4),
            monthlyRevenue,
            weekendOrders: weekendOrders.length
        }
        res.json({success:true, dashboardData})

    }
    catch(error){
        console.log(error.message)
        res.json({success:false, message:error.message})
    }
}


export const updateUserImage=async(req,res)=>{
    try{

        const {_id}=req.user
        
        const imageFile=req.file

        const fileBuffer=fs.readFileSync(imageFile.path)
        const response=await imageKit.upload({
            file:fileBuffer,
            fileName:imageFile.originalname,
            folder:'/user'
        })

        var optimizedImageUrl=imageKit.url({
            path:response.filePath,
            transformation:[
                {width:'400'},
                {quality:'auto'},
                {format:'webp'}
            ]
        })
        const image = optimizedImageUrl;

        await user.findByIdAndUpdate(_id,{image})
        res.json({success:true, message:'Image Updated'})

    }
    catch(err){
        console.log(err)
        res.json({success:false, message:err.message})
    }
}

export const updateBookImage = async(req, res) => {
    try {
        const { _id } = req.user;
        const { bookId } = req.body;
        const imageFile = req.file;

        const book = await Book.findById(bookId);
        if (!book || book.owner.toString() !== _id.toString()) {
            return res.json({ success: false, message: "Unauthorized or book not found" });
        }

        const fileBuffer = fs.readFileSync(imageFile.path);
        const response = await imageKit.upload({
            file: fileBuffer,
            fileName: imageFile.originalname,
            folder: '/book'
        });

        var optimizedImageUrl = imageKit.url({
            path: response.filePath,
            transformation: [
                {width: '1280'},
                {quality: 'auto'},
                {format: 'webp'}
            ]
        });

        book.image = optimizedImageUrl;
        await book.save();

        res.json({ success: true, message: 'Book Cover Updated!', image: optimizedImageUrl });
    } catch(err) {
        console.log(err);
        res.json({ success: false, message: err.message });
    }
}

export const updateBookPdf = async(req, res) => {
    try {
        const { _id } = req.user;
        const { bookId } = req.body;
        const pdfFile = req.file;

        const book = await Book.findById(bookId);
        if (!book || book.owner.toString() !== _id.toString()) {
            return res.json({ success: false, message: "Unauthorized or book not found" });
        }

        if (!pdfFile) {
            return res.json({ success: false, message: "No PDF provided" });
        }

        const fileBuffer = fs.readFileSync(pdfFile.path);
        const response = await imageKit.upload({
            file: fileBuffer,
            fileName: pdfFile.originalname,
            folder: '/book_pdfs',
            useUniqueFileName: true
        });

        book.pdfUrl = response.url;
        await book.save();

        res.json({ success: true, message: 'Book PDF Content Updated!' });
    } catch(err) {
        console.log(err);
        res.json({ success: false, message: err.message });
    }
}