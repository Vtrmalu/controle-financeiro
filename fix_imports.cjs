const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');

content = content.replace(
  /} from 'lucide-react';/,
  ', ArrowDownCircle, ShoppingBag } from \'lucide-react\';'
);

fs.writeFileSync('src/App.jsx', content, 'utf8');
console.log('Fixed imports!');
