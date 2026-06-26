const fs = require('fs');

let code = fs.readFileSync('server/controllers/ownerController.js', 'utf8');

// 1. Add import Visitor
if (!code.includes('import Visitor from')) {
    code = "import Visitor from '../models/visitor.js';\n" + code;
}

// 2. Add locations logic before dashboardData declaration
const logicToInsert = `
        // Real-time Live Visitors (last 15 minutes)
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
        const recentVisitors = await Visitor.find({ timestamp: { $gte: fifteenMinutesAgo } }).lean();
        
        const cityCounts = {};
        recentVisitors.forEach(v => {
            cityCounts[v.city] = (cityCounts[v.city] || 0) + 1;
        });
        const locations = Object.entries(cityCounts).map(([city, count]) => ({city, count})).sort((a,b) => b.count - a.count).slice(0, 5);
        
        const activeVisitors = recentVisitors.length;
`;

if (!code.includes('recentVisitors.length')) {
    code = code.replace('const dashboardData={', logicToInsert + '\n        const dashboardData={');
}

// 3. Add to dashboardData object exactly
if (!code.includes('locations,')) {
    code = code.replace(
        'revenueChart,\n            totalPlatformUsers\n        }',
        'revenueChart,\n            totalPlatformUsers,\n            locations,\n            activeVisitors\n        }'
    );
}

fs.writeFileSync('server/controllers/ownerController.js', code);
console.log('Successfully injected visitor tracking clean');
