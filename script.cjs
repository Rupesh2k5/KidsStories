const fs = require('fs');

let adminJsx = fs.readFileSync('src/pages/Admin.jsx', 'utf8');
const adminHtml = fs.readFileSync('Admin_Panel.html', 'utf8');

// Extract the missing tabs HTML
const match = adminHtml.match(/<!-- ========== CUSTOMERS ========== -->([\s\S]*?)<!-- ========== SETTINGS ========== -->[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/);
if (!match) { console.error('Could not find missing tabs in HTML'); process.exit(1); }

let rawHtml = '<!-- ========== CUSTOMERS ========== -->' + match[1];

// We need to also extract the Settings page properly
const settingsMatch = adminHtml.match(/<!-- ========== SETTINGS ========== -->([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/);
if (settingsMatch) {
    let settingsHtml = settingsMatch[1];
    // Settings has two closing divs we don't want (the shell and main content closing divs)
    settingsHtml = settingsHtml.replace(/<\/div>\s*<\/div>\s*$/, '');
    rawHtml += '<!-- ========== SETTINGS ========== -->' + settingsHtml;
}


// Clean up the HTML to be JSX compliant
let jsxStr = rawHtml
  .replace(/class=/g, 'className=')
  .replace(/for=/g, 'htmlFor=')
  .replace(/<!--([\s\S]*?)-->/g, '{/* $1 */}')
  .replace(/<input([^>]*?[^\/])>/g, '<input$1 />')
  .replace(/<img([^>]*?[^\/])>/g, '<img$1 />')
  .replace(/onclick=\"([^\"]*)\"/gi, (m, p1) => {
    if (p1.includes('alert')) return 'onClick={() => alert(\'Demo feature\')}';
    if (p1.includes('classList.toggle')) return 'onClick={(e) => e.currentTarget.classList.toggle(\'on\')}';
    if (p1.includes('sendPrompt')) return 'onClick={() => alert(\'AI Prompt Feature (Demo)\')}';
    if (p1.includes('switchTab')) {
        const tab = p1.match(/'([^']+)'/)[1];
        return 'onClick={() => setAnalyticsTab(\'' + tab + '\')}';
    }
    return 'onClick={() => {}}';
  })
  .replace(/style=\"([^\"]*)\"/g, (m, p1) => {
    const styles = p1.split(';').filter(Boolean);
    const obj = styles.map(s => {
        const parts = s.split(':');
        if (parts.length < 2) return '';
        const key = parts[0].trim().replace(/-([a-z])/g, (g) => g[1].toUpperCase());
        const val = parts.slice(1).join(':').trim();
        return key + ': \'' + val + '\'';
    }).filter(Boolean).join(', ');
    return 'style={{ ' + obj + ' }}';
  });

// Now we need to split it by pages so we can wrap them in activeTab conditionals
let pages = ['customers', 'meta-ads', 'email-mktg', 'seo', 'analytics', 'liveview', 'discounts', 'settings'];

pages.forEach(p => {
    const pageId = 'id=\"page-' + p + '\"';
    const pageClassRegex = new RegExp('<div className=\"page\" ' + pageId + '>');
    jsxStr = jsxStr.replace(pageClassRegex, '{activeTab === \'' + p + '\' && (\n<div className=\"page active\">');
});

// For every activeTab wrapper we just opened, we need to close it.
// The easiest way is to find the closing div of each page.
// Since each page is a direct child, we can just replace the closing </div> before the next {/* ========== ... */}
jsxStr = jsxStr.replace(/<\/div>\s*(?=\{\/\* ==========)/g, '</div>\n)}\n\n');
// Close the last one
jsxStr = jsxStr.replace(/<\/div>\s*$/, '</div>\n)}\n');

// Also need to add analyticsTab state to Admin.jsx
if (!adminJsx.includes('analyticsTab')) {
    adminJsx = adminJsx.replace('const [activeTab, setActiveTab] = useState(\'home\');', 'const [activeTab, setActiveTab] = useState(\'home\');\n  const [analyticsTab, setAnalyticsTab] = useState(\'overview\');');
}

// In analytics page, we need to map the display:none to the new state
jsxStr = jsxStr.replace(/id=\"analytics-overview\"/, 'style={{ display: analyticsTab === \'overview\' ? \'block\' : \'none\' }} id=\"analytics-overview\"');
jsxStr = jsxStr.replace(/id=\"analytics-traffic\" style={{ display: 'none' }}/, 'style={{ display: analyticsTab === \'traffic\' ? \'block\' : \'none\' }} id=\"analytics-traffic\"');
jsxStr = jsxStr.replace(/id=\"analytics-conversion\" style={{ display: 'none' }}/, 'style={{ display: analyticsTab === \'conversion\' ? \'block\' : \'none\' }} id=\"analytics-conversion\"');
jsxStr = jsxStr.replace(/className=\"tab active\" id=\"tab-overview\"/g, 'className={`tab ${analyticsTab === \'overview\' ? \'active\' : \'\'}`}');
jsxStr = jsxStr.replace(/className=\"tab\" id=\"tab-traffic\"/g, 'className={`tab ${analyticsTab === \'traffic\' ? \'active\' : \'\'}`}');
jsxStr = jsxStr.replace(/className=\"tab\" id=\"tab-conversion\"/g, 'className={`tab ${analyticsTab === \'conversion\' ? \'active\' : \'\'}`}');

// Replace the placeholder in Admin.jsx
const placeholderRegex = /\{\/\* STATIC PLACEHOLDER PAGES \*\/\}[\s\S]*?(?=\s*<\/div>\s*<\/div>\s*<\/div>\s*\);\s*\};)/;
adminJsx = adminJsx.replace(placeholderRegex, '{/* STATIC PLACEHOLDER PAGES REPLACED */}\n' + jsxStr);

fs.writeFileSync('src/pages/Admin.jsx', adminJsx);
console.log('Successfully injected missing tabs!');
