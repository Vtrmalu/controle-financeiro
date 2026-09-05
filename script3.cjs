const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');

const regex = /<div key={debt\.id} className=\{`p-3\.5 rounded-2xl border \$\{cardBg\} space-y-2 hover:border-rose-500\/40 transition-colors`\}>/;

const replacement = `<div key={debt.id} className={\`relative overflow-hidden p-4 rounded-2xl border \${isQuitado ? (isDarkMode ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200') : isEmAcordo ? (isDarkMode ? 'bg-amber-500/5 border-amber-500/20' : 'bg-amber-50 border-amber-200') : (isDarkMode ? 'bg-rose-500/5 border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.1)]' : 'bg-rose-50 border-rose-300 shadow-sm')} space-y-3 transition-all\`}>
                      {!isQuitado && !isEmAcordo && <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/10 rounded-bl-full pointer-events-none"></div>}`;

if (regex.test(content)) {
    content = content.replace(regex, replacement);
    fs.writeFileSync('src/App.jsx', content, 'utf8');
    console.log('SUCCESS');
} else {
    console.log('NOT FOUND');
}
