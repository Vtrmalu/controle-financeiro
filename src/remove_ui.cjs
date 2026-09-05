const fs = require('fs');

let appJsx = fs.readFileSync('App.jsx', 'utf8');

// Remove the toggle UI block
const uiBlockRegex = /<div className="flex bg-slate-200\/50 dark:bg-\[\#252732\] p-1 rounded-xl">[\s\S]*?<\/div>/;
appJsx = appJsx.replace(uiBlockRegex, '');

// Also forcefully set startOffset to 0 in the logic
const logicRegex = /const startOffset = calcCardTargetPeriod === 'next_invoice' \? 1 : 0;/;
appJsx = appJsx.replace(logicRegex, 'const startOffset = 0; // Forced to 0 for automatic calculation');

fs.writeFileSync('App.jsx', appJsx, 'utf8');
console.log('Removed Next Invoice toggle successfully!');
