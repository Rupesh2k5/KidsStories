const fs = require('fs');

let lines = fs.readFileSync('server/controllers/ownerController.js', 'utf8').split('\n');

// 1. Add import at top
if (!lines[0].includes('Visitor')) {
    lines.unshift("import Visitor from '../models/visitor.js';");
}

// 2. Find dashboardData
let dashboardIndex = -1;
let totalPlatformIndex = -1;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('const dashboardData={')) dashboardIndex = i;
    // Find the totalPlatformUsers inside dashboardData (after dashboardIndex)
    if (dashboardIndex !== -1 && i > dashboardIndex && lines[i].includes('totalPlatformUsers')) {
        totalPlatformIndex = i;
        break;
    }
}

// 3. Inject logic before dashboardData
const logic = `
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

if (dashboardIndex !== -1) {
    // Only inject if not already there
    if (!lines[dashboardIndex - 1].includes('activeVisitors')) {
        lines.splice(dashboardIndex, 0, logic);
        // Adjust the totalPlatformIndex since we added 1 big string block (which counts as 1 element right now, wait split will make it multiple lines if we don't handle it)
    }
}

// Write it out, read it back
fs.writeFileSync('server/controllers/ownerController.js', lines.join('\n'));

// Now do the object injection
let code = fs.readFileSync('server/controllers/ownerController.js', 'utf8');
if (!code.includes('locations,')) {
    code = code.replace(
        /totalPlatformUsers\s*\}/, 
        'totalPlatformUsers,\n            locations,\n            activeVisitors\n        }'
    );
}

fs.writeFileSync('server/controllers/ownerController.js', code);
console.log('Perfect fix applied');
