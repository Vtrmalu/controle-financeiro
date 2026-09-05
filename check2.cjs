const fs = require('fs');
const content = fs.readFileSync('src/App.jsx', 'utf8');
const lines = content.split('\n');
lines.forEach((line, i) => {
    if (line.includes('sltimos') || line.includes('Lanamentos') || line.includes('Dvida') || line.includes('Oramento') || line.includes('MǦs')) {
        console.log(`Line ${i+1}: ${line.trim()}`);
    }
});
