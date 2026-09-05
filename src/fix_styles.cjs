const fs = require('fs');
let content = fs.readFileSync('App.jsx', 'utf8');

const replacement = "${isDarkMode ? 'border-slate-700 focus:border-emerald-500' : 'border-slate-300 focus:border-emerald-500'}";

content = content.replace(/\$\{inputBorder\} \$\{inputFocus\}/g, replacement);

fs.writeFileSync('App.jsx', content);
console.log('Fixed styling vars!');
