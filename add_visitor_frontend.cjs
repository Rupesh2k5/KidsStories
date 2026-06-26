const fs = require('fs');

// 1. App.jsx - Fetch IP and log visit
let appJsx = fs.readFileSync('src/App.jsx', 'utf8');

const visitLogic = `
  // Track Live Visitor Location
  useEffect(() => {
    const trackVisit = async () => {
      try {
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        if(data.city) {
           await fetch(backendUrl + '/api/user/log-visit', {
             method: 'POST',
             headers: {'Content-Type': 'application/json'},
             body: JSON.stringify({ city: data.city })
           });
        }
      } catch (error) {
        // Alternative fallback: ask for location if IP API fails
        if(navigator.geolocation) {
           navigator.geolocation.getCurrentPosition(async (pos) => {
               // We would ideally reverse geocode lat/lng here, but for simplicity we log 'Unknown (Coords)'
               await fetch(backendUrl + '/api/user/log-visit', {
                 method: 'POST',
                 headers: {'Content-Type': 'application/json'},
                 body: JSON.stringify({ city: 'Near ' + pos.coords.latitude.toFixed(1) + ',' + pos.coords.longitude.toFixed(1) })
               });
           }, () => {});
        }
      }
    };
    // Only track once per session to avoid spamming the backend
    if(!sessionStorage.getItem('visited_store')) {
       trackVisit();
       sessionStorage.setItem('visited_store', 'true');
    }
  }, []);
`;

if (!appJsx.includes('trackVisit')) {
    // Insert inside the App component, right after useContext
    appJsx = appJsx.replace(
        "const App = () => {",
        "const App = () => {\n" + visitLogic
    );
    fs.writeFileSync('src/App.jsx', appJsx);
}

// 2. Admin.jsx - Display Locations dynamically
let adminJsx = fs.readFileSync('src/pages/Admin.jsx', 'utf8');

const dynamicLocations = `
            {dashboardData?.locations && dashboardData.locations.length > 0 ? dashboardData.locations.map((loc, i) => {
              const max = dashboardData.locations[0].count || 1;
              const width = Math.max((loc.count / max) * 100, 10);
              return (
                <div key={i} className="metric-row" style={{ padding: '8px 12px', borderBottom: 'none' }}>
                  <div style={{ fontSize: '13px', width: '120px' }}>{loc.city}</div>
                  <div style={{ flex: 1, height: '16px', background: '#ffebee', borderRadius: '8px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: \`\${width}%\`, background: 'var(--primary)', borderRadius: '8px', transition: 'width 0.5s ease' }}></div>
                  </div>
                  <div style={{ fontSize: '13px', width: '30px', textAlign: 'right', fontWeight: '500' }}>{loc.count}</div>
                </div>
              );
            }) : (
              <div style={{padding: '20px', textAlign: 'center', color: 'var(--text-muted)'}}>No visitors currently online</div>
            )}
`;

const regex = /<div className="metric-row" style=\{\{ padding: '8px 12px', borderBottom: 'none' \}\}>[\s\S]*?(?=<\/div>\s*<\/div>\s*<\/div>\s*\{\/\*  ========== STORE SETTINGS)/;

adminJsx = adminJsx.replace(regex, dynamicLocations);

// Also replace the hardcoded "Visitors right now" with the real activeVisitors count
adminJsx = adminJsx.replace(
  /<div className="stat-card"><div className="stat-label">Visitors right now<\/div><div className="stat-value">\{Math\.round\(\(dashboardData\?\.totalPlatformUsers \|\| 0\) \* 0\.1\) \|\| 1\}<\/div><\/div>/g,
  '<div className="stat-card"><div className="stat-label">Visitors right now</div><div className="stat-value">{dashboardData?.activeVisitors || 0}</div></div>'
);

fs.writeFileSync('src/pages/Admin.jsx', adminJsx);
console.log('Frontend visitor logic added');
