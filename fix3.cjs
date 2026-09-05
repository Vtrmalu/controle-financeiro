const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');

content = content.replace(/                }\)\r?\n              \)}/g, '                  );\n                })\n              )}');

fs.writeFileSync('src/App.jsx', content, 'utf8');
console.log('Fixed syntax error!');
