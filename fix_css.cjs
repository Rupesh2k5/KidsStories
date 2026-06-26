const fs = require('fs');
let css = fs.readFileSync('src/pages/AdminPanel.css', 'utf8');

const oldMediaQuery = `@media (max-width: 768px) {
      .sidebar { width: 60px; }
      .sidebar .logo-text, .sidebar .logo-sub, .sidebar .nav-item span, .sidebar .nav-section { display: none; }
      .sidebar .nav-item i { font-size: 20px; width: auto; }
      .sidebar .badge { display: none; }
      .two-col, .three-col { grid-template-columns: 1fr; }
    }`;

const newMediaQuery = `@media (max-width: 768px) {
  .shell { flex-direction: column; height: 100vh; }
  .sidebar {
    width: 100%; height: auto; border-right: none; border-bottom: 1px solid var(--border);
    flex-direction: row; padding: 5px 10px; align-items: center;
  }
  .sidebar > .logo, .sidebar > .btn-back { display: none; }
  .sidebar nav { display: flex; flex-direction: row; overflow-x: auto; padding: 0; width: 100%; -webkit-overflow-scrolling: touch; }
  .sidebar nav::-webkit-scrollbar { display: none; }
  .nav-section { display: none; }
  .nav-item { padding: 8px 15px; border-radius: 20px; margin: 0 5px; background: rgba(255,255,255,0.3); white-space: nowrap; }
  .nav-item.active { background: var(--surface-0); box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
  .main-content { flex: 1; width: 100%; overflow-y: auto; overflow-x: hidden; padding-bottom: 50px; }
  .stats-grid, .dashboard-grid, .two-col, .three-col, .form-grid { grid-template-columns: 1fr; gap: 15px; }
  .card { overflow-x: auto; margin-bottom: 15px; }
  .table { min-width: 500px; }
}`;

css = css.replace(oldMediaQuery, newMediaQuery);
fs.writeFileSync('src/pages/AdminPanel.css', css);
console.log('Fixed CSS media query');
