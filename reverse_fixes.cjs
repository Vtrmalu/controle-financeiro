
const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

const badFixes = {
    '1': '1ª',
    's': 'só',
    'S': 'Só',
    'h': 'há',
    'H': 'Há',
    'at': 'até',
    'At': 'Até',
    'no': 'não',
    'No': 'Não',
    'so': 'são',
    'So': 'São',
    'ao': 'ação',
    'Ao': 'Ação',
    'j': 'já',
    'J': 'Já',
    'ms': 'mês',
    'Ms': 'Mês',
    'alm': 'além',
    'Alm': 'Além',
};

// We want to replace 'só' back to 's'
// But wait, there might have been overlapping replacements!
// Like 'so' -> 'são'. Then 'são' -> 'sóão' (because 's' -> 'só').
// Oh no! If 'so' became 'são', and then 's' became 'só', it is now 'sóão'!
// Let's check the order in the original script!
// The original script iterated Object.entries(fixes).
// Object.entries order is insertion order!
