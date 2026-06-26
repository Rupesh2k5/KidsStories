const fs = require('fs');
let code = fs.readFileSync('src/pages/Admin.jsx', 'utf8');

// 1. Customers Tab - Top Stats
code = code.replace(
  /<div className="stat-card"><div className="stat-label">Total customers<\/div><div className="stat-value">284<\/div><\/div>/,
  '<div className="stat-card"><div className="stat-label">Total customers</div><div className="stat-value">{dashboardData?.customers?.total || 0}</div></div>'
);
code = code.replace(
  /<div className="stat-card"><div className="stat-label">New this month<\/div><div className="stat-value">38<\/div><div className="stat-delta delta-up">\+22%<\/div><\/div>/,
  '<div className="stat-card"><div className="stat-label">New this month</div><div className="stat-value">{dashboardData?.customers?.newThisMonth || 0}</div></div>'
);
code = code.replace(
  /<div className="stat-card"><div className="stat-label">Repeat buyers<\/div><div className="stat-value">96<\/div><div className="stat-delta">34%<\/div><\/div>/,
  '<div className="stat-card"><div className="stat-label">Repeat buyers</div><div className="stat-value">{dashboardData?.customers?.repeatBuyers || 0}</div></div>'
);

// 2. Customers Tab - Table
const originalTableBody = `            <tbody>
              <tr><td>Priya S.</td><td>priya@gmail.com</td><td>4</td><td>₹796</td><td>Today</td></tr>
              <tr><td>Arjun M.</td><td>arjun@gmail.com</td><td>2</td><td>₹549</td><td>Today</td></tr>
              <tr><td>Neha R.</td><td>neha@gmail.com</td><td>1</td><td>₹199</td><td>Yesterday</td></tr>
              <tr><td>Vikram K.</td><td>vikram@gmail.com</td><td>3</td><td>₹598</td><td>2 days ago</td></tr>
            </tbody>`;

const newTableBody = `            <tbody>
              {dashboardData?.customers?.list && dashboardData.customers.list.length > 0 ? (
                dashboardData.customers.list.map((c, i) => (
                  <tr key={i}>
                    <td>{c.name}</td>
                    <td>{c.email}</td>
                    <td>{c.orders}</td>
                    <td>₹{c.totalSpent}</td>
                    <td>{new Date(c.lastOrder).toLocaleDateString()}</td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="5" style={{textAlign:'center'}}>No customers yet</td></tr>
              )}
            </tbody>`;
code = code.replace(originalTableBody, newTableBody);

// 3. Live View - Customer Behavior Funnel
code = code.replace(
  /<div className="page-title">Live view<\/div>[\s\S]*?<div className="page-sub">Real-time snapshot of your store<\/div>[\s\S]*?<div className="stat-value">7<\/div>/,
  '<div className="page-title">Live view</div>\n        <div className="page-sub">Real-time snapshot of your store</div>\n        <div className="stats-grid">\n          <div className="stat-card"><div className="stat-label">Total Users</div><div className="stat-value">{dashboardData?.totalPlatformUsers || 0}</div></div>'
);

// 3b. Customer Behavior (Demo) -> Customer Behavior (Live)
code = code.replace('Customer behavior (Demo)', 'Customer behavior (Live)');
code = code.replace('Active carts', 'Registered Users');
code = code.replace('Checking out', 'Pending Orders');
code = code.replace('Purchased', 'Completed Orders');

code = code.replace(/<div className="funnel-val">3<\/div>/, '<div className="funnel-val">{dashboardData?.totalPlatformUsers || 0}</div>');
code = code.replace(/<div className="funnel-val">1<\/div>/, '<div className="funnel-val">{dashboardData?.pendingOrders || 0}</div>');
code = code.replace(/<div className="funnel-val">20<\/div>/, '<div className="funnel-val">{dashboardData?.completedOrders || 0}</div>');

// Adjust widths to make them proportional to max
code = code.replace(/<div className="funnel-bar" style={{ width: '80%', background: 'var\(--secondary\)' }}><\/div>/, `<div className="funnel-bar" style={{ width: '100%', background: 'var(--secondary)' }}></div>`);
code = code.replace(/<div className="funnel-bar" style={{ width: '40%', background: 'var\(--warning\)' }}><\/div>/, `<div className="funnel-bar" style={{ width: \`\${Math.min((dashboardData?.pendingOrders || 0) / (dashboardData?.totalPlatformUsers || 1) * 100, 100)}%\`, background: 'var(--warning)' }}></div>`);
code = code.replace(/<div className="funnel-bar" style={{ width: '100%', background: 'var\(--primary\)' }}><\/div>/, `<div className="funnel-bar" style={{ width: \`\${Math.min((dashboardData?.completedOrders || 0) / (dashboardData?.totalPlatformUsers || 1) * 100, 100)}%\`, background: 'var(--primary)' }}></div>`);


// 4. Analytics Tab - Revenue Chart
// Replace the hardcoded chart-bars with a map
const oldChart = `<div className="chart-bars">
                    <div className="chart-bar" style={{ height: '30%' }}></div>
                    <div className="chart-bar" style={{ height: '50%' }}></div>
                    <div className="chart-bar" style={{ height: '40%' }}></div>
                    <div className="chart-bar" style={{ height: '80%' }}></div>
                    <div className="chart-bar" style={{ height: '60%' }}></div>
                    <div className="chart-bar" style={{ height: '90%' }}></div>
                    <div className="chart-bar" style={{ height: '100%' }}></div>
                  </div>`;

const newChart = `<div className="chart-bars">
                    {dashboardData?.revenueChart ? dashboardData.revenueChart.map((val, i) => {
                       const max = Math.max(...dashboardData.revenueChart, 1);
                       const height = Math.max((val / max) * 100, 5); // min 5% height so it shows
                       return <div key={i} className="chart-bar" style={{ height: \`\${height}%\` }} title={\`₹\${val}\`}></div>;
                    }) : (
                      <div style={{width:'100%', textAlign:'center', marginTop:'50px'}}>Loading...</div>
                    )}
                  </div>`;
code = code.replace(oldChart, newChart);

fs.writeFileSync('src/pages/Admin.jsx', code);
console.log('Admin.jsx updated with real data mapping');
