const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');

const replacements = {
    'Ã¡': 'á',
    'Ã£': 'ã',
    'Ã¢': 'â',
    'Ã©': 'é',
    'Ãª': 'ê',
    'Ã­': 'í',
    'Ã³': 'ó',
    'Ãµ': 'õ',
    'Ã´': 'ô',
    'Ãº': 'ú',
    'Ã§': 'ç',
    'Ã ': 'À',
    'Ã\x81': 'Á',
    'Ã\x89': 'É',
    'Ã\x8A': 'Ê',
    'Ã\x8D': 'Í',
    'Ã\x93': 'Ó',
    'Ã\x9A': 'Ú',
    'Ã\x87': 'Ç',
    'â€¢': '•',
    'âš¡': '⚡',
    'â ©': '⏭',
    'ðŸ“…': '📅',
    'ðŸ ¦': '🏦',
    'âš\xa0ï¸ ': '⚠️ ',
    'ðŸ””': '🔔',
    'âœ“': '✓'
};

for (const [bad, good] of Object.entries(replacements)) {
    content = content.split(bad).join(good);
}

fs.writeFileSync('src/App.jsx', content, 'utf8');
console.log('Fixed encoding!');
