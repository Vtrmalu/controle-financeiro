const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');

const replacements = {
    'Ã‡': 'Ç',
    'Ãƒ': 'Ã',
    'Ã•': 'Õ',
    'ÃŠ': 'Ê',
    'Ãš': 'Ú',
    'Ã“': 'Ó',
    'âš–ï¸ ': '⚖️ ',
    'ðŸ’°': '💰',
    'ðŸ“Š': '📊',
    'ðŸ’³': '💳',
    'ðŸš¨': '🚨',
    'â ³': '⏳',
    'âš\xa0ï¸ ': '⚠️ ',
    'ðŸ ¦': '🏦',
    '1Âª': '1ª',
    'â€”': '—',
    'Ãª': 'ê'
};

for (const [bad, good] of Object.entries(replacements)) {
    content = content.split(bad).join(good);
}

fs.writeFileSync('src/App.jsx', content, 'utf8');
console.log('Fixed encoding part 2!');
