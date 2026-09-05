const fs = require('fs');
const content = fs.readFileSync('src/App.jsx', 'utf8');
const lines = content.split('\n');
let count = 0;
lines.forEach((line, i) => {
    if (line.includes('\ufffd')) {
        console.log(`Line ${i+1}: ${line.trim()}`);
        count++;
    }
});
console.log('Total corrupted lines:', count);
