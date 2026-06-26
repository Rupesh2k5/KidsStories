const fs = require('fs');

// 1. Add logVisit to userController.js
let userCtrl = fs.readFileSync('server/controllers/userController.js', 'utf8');
const logVisitCode = `
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
`;
if (!userCtrl.includes('logVisit')) {
    userCtrl += logVisitCode;
    fs.writeFileSync('server/controllers/userController.js', userCtrl);
}

// 2. Add route to userRoutes.js
let userRoutes = fs.readFileSync('server/routes/userRoutes.js', 'utf8');
if (!userRoutes.includes('logVisit')) {
    userRoutes = userRoutes.replace(
        "import { getCars, getUserData, loginUser, registerUser } from '../controllers/userController.js'",
        "import { getCars, getUserData, loginUser, registerUser, logVisit } from '../controllers/userController.js'"
    );
    userRoutes = userRoutes.replace(
        "export default userRouter",
        "userRouter.post('/log-visit', logVisit);\n\nexport default userRouter"
    );
    fs.writeFileSync('server/routes/userRoutes.js', userRoutes);
}

// 3. Update ownerController.js getDashboardData
let ownerCtrl = fs.readFileSync('server/controllers/ownerController.js', 'utf8');
if (!ownerCtrl.includes('Visitor from')) {
    ownerCtrl = "import Visitor from '../models/visitor.js';\n" + ownerCtrl;
}
if (!ownerCtrl.includes('const activeVisitors')) {
    const dashboardDataReplace = `
        // Real-time Live Visitors (last 15 minutes)
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
        const recentVisitors = await Visitor.find({ timestamp: { $gte: fifteenMinutesAgo } }).lean();
        
        const cityCounts = {};
        recentVisitors.forEach(v => {
            cityCounts[v.city] = (cityCounts[v.city] || 0) + 1;
        });
        const locations = Object.entries(cityCounts).map(([city, count]) => ({city, count})).sort((a,b) => b.count - a.count).slice(0, 5);
        
        const activeVisitors = recentVisitors.length;

        const dashboardData={`;
        
    ownerCtrl = ownerCtrl.replace('const dashboardData={', dashboardDataReplace);
    
    // add to dashboardData object
    ownerCtrl = ownerCtrl.replace(
        'totalPlatformUsers',
        'totalPlatformUsers,\n            locations,\n            activeVisitors'
    );
    
    fs.writeFileSync('server/controllers/ownerController.js', ownerCtrl);
}

console.log('Backend visitor logic added');
