const fs = require('fs');
let css = fs.readFileSync('src/pages/AdminPanel.css', 'utf8');

const mediaQuery = `
/* ===== MOBILE RESPONSIVENESS ===== */
@media (max-width: 768px) {
  .shell {
    flex-direction: column;
    height: 100vh;
  }
  .sidebar {
    width: 100%;
    height: auto;
    border-right: none;
    border-bottom: 1px solid var(--border);
    flex-direction: row;
    padding: 5px 10px;
    align-items: center;
  }
  .sidebar .logo, .sidebar .btn-back {
    display: none; /* Hide logo and back button on mobile to save space for tabs */
  }
  .sidebar nav {
    display: flex;
    flex-direction: row;
    overflow-x: auto;
    padding: 0;
    width: 100%;
    -webkit-overflow-scrolling: touch;
  }
  .nav-section {
    display: none;
  }
  .nav-item {
    padding: 8px 15px;
    border-radius: 20px;
    margin: 0 5px;
    background: rgba(255,255,255,0.3);
    white-space: nowrap;
  }
  .nav-item.active {
    background: var(--surface-0);
    box-shadow: 0 2px 5px rgba(0,0,0,0.05);
  }
  .main-content {
    flex: 1;
    width: 100%;
    overflow-y: auto;
    overflow-x: hidden;
    padding-bottom: 50px;
  }
  .header {
    width: 100%;
  }
  .stats-grid {
    grid-template-columns: 1fr;
  }
  .dashboard-grid {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  .card {
    overflow-x: auto;
    margin-bottom: 15px;
  }
  .table {
    min-width: 600px; /* Ensure table doesn't squash, allows horizontal scroll in .card */
  }
  .form-grid {
    grid-template-columns: 1fr;
  }
}
`;

if (!css.includes('@media (max-width: 768px)')) {
  fs.writeFileSync('src/pages/AdminPanel.css', css + mediaQuery);
  console.log('Added responsive styles');
} else {
  console.log('Responsive styles already exist');
}
