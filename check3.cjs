const fs = require('fs');
const content = fs.readFileSync('src/App.jsx', 'utf8');
const lines = content.split('\n');
lines.forEach((line, i) => {
    const badCharRegex = /[^\x20-\x7EáéíóúÁÉÍÓÚãõÃÕâêôÂÊÔçÇ\n\r\t💰📊⏰⏳📝🚨✅⚠️•]/;
    if (badCharRegex.test(line)) {
        console.log(`Line ${i+1}: ${line.trim()}`);
    }
});
