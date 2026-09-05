const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');

const regex = /filteredTransactions\.map\(\(tx, txIdx\) => \([\s\S]*?<Tag className="w-5 h-5 text-blue-400" \/>}/m;

const replacement = `filteredTransactions.map((tx, txIdx) => {
                  const catData = categories.find(c => c.name === tx.category);
                  const txColor = tx.type === 'income' ? '#34d399' : (catData?.color ?? '#60a5fa');
                  return (
                  <div
                    key={tx.id}
                    className={\`flex items-center px-4 py-3.5 gap-3 \${
                      txIdx < filteredTransactions.length - 1
                        ? \`border-b \${isDarkMode ? 'border-[#252732]' : 'border-slate-100'}\`
                        : ''
                    }\`}
                  >
                    <div 
                      className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border"
                      style={{ background: \`\${txColor}20\`, borderColor: \`\${txColor}35\` }}
                    >
                      {tx.type === 'income'
                        ? <DollarSign className="w-5 h-5" style={{ color: txColor }} />
                        : <Tag className="w-5 h-5" style={{ color: txColor }} />}`;

if (regex.test(content)) {
    content = content.replace(regex, replacement);
    // Also we need to close the map function with `})` instead of `))` at the end.
    // Let's find the end of the map.
    const endMapRegex = /\) \/\* End of filteredTransactions map \*\//; // We don't have that.
    // Let's find where the map ends. It ends at `                  </div>\n                ))\n              )}`
    content = content.replace(/                \)\)\n              \)}/, '                }))\n              )}');
    fs.writeFileSync('src/App.jsx', content, 'utf8');
    console.log('SUCCESS');
} else {
    console.log('NOT FOUND');
}
