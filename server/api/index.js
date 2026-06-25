export default async function handler(req, res) {
    try {
        const dbModule = await import('../configs/db.js');
        const connectDB = dbModule.default;
        await connectDB();
        
        const module = await import('../server.js');
        const app = module.default;
        await app(req, res);
    } catch (error) {
        console.error("Vercel Invocation Error:", error);
        res.status(500).json({ 
            success: false, 
            message: "Server initialization failed", 
            error: error.message, 
            stack: error.stack 
        });
    }
}
