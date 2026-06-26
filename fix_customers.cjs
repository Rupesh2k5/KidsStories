const fs = require('fs');
let code = fs.readFileSync('src/pages/Admin.jsx', 'utf8');

const regex = /\{\/\*\s*========== CUSTOMERS ==========\s*\*\/\}[\s\S]*?(?=\{\/\*\s*========== META ADS ==========\s*\*\/|\Z)/;

const fixedTab = `{/*  ========== CUSTOMERS ==========  */}
      {activeTab === 'customers' && (
<div className="page active">
        <div className="page-title">Customers</div>
        <div className="page-sub">Your registered buyers and their activity</div>
        <div className="stats-grid">
          <div className="stat-card"><div className="stat-label">Total customers</div><div className="stat-value">{dashboardData?.customers?.total || 0}</div></div>
          <div className="stat-card"><div className="stat-label">New this month</div><div className="stat-value">{dashboardData?.customers?.newThisMonth || 0}</div></div>
          <div className="stat-card"><div className="stat-label">Repeat buyers</div><div className="stat-value">{dashboardData?.customers?.repeatBuyers || 0}</div></div>
        </div>
        <div className="card" style={{ padding: '0' }}>
          <table className="table">
            <thead><tr><th>Name</th><th>Email</th><th>Orders</th><th>Total spent</th><th>Last order</th></tr></thead>
            <tbody>
              {dashboardData?.customers?.list && dashboardData.customers.list.length > 0 ? (
                dashboardData.customers.list.map((c, i) => (
                  <tr key={i}>
                    <td>{c.name || 'Guest'}</td>
                    <td>{c.email || 'N/A'}</td>
                    <td>{c.orders}</td>
                    <td>₹{c.totalSpent}</td>
                    <td>{new Date(c.lastOrder).toLocaleDateString()}</td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="5" style={{textAlign:'center'}}>No customers yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
)}
`;

code = code.replace(regex, fixedTab);
fs.writeFileSync('src/pages/Admin.jsx', code);
console.log('Fixed Customers tab correctly!');
