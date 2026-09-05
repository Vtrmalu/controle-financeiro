const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');

const startStr = '// Status label';
const endStr = 'onClick={(e) => handleOpenEditBill(bill, e)}';
const startIdx = content.indexOf(startStr);
const endIdx = content.indexOf(endStr, startIdx);

if (startIdx !== -1 && endIdx !== -1) {
    const newContent = content.substring(0, startIdx) + 
`// Status label
                  const today = new Date().toISOString().split('T')[0];
                  const isLate = bill.dueDate < today;
                  const diffTime = new Date(bill.dueDate) - new Date(today);
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  
                  let daysText = diffDays === 0 ? "Vence hoje" : diffDays === 1 ? "Vence amanhã" : diffDays < 0 ? \`Venceu há \${Math.abs(diffDays)} dia(s)\` : \`Vence em \${diffDays} dias\`;

                  const statusStyle = isSerasaAcordo ? { text: 'Acordo', cls: 'text-rose-400 bg-rose-500/10 border-rose-500/20', border: 'border-rose-500' }
                    : isLate ? { text: 'Atrasado', cls: 'text-red-400 bg-red-500/10 border-red-500/20', border: 'border-red-500' }
                    : diffDays === 0 ? { text: 'Vence Hoje', cls: 'text-amber-400 bg-amber-500/10 border-amber-500/20', border: 'border-amber-500 animate-pulse' }
                    : { text: 'Pendente', cls: 'text-slate-400 bg-slate-500/10 border-slate-500/20', border: 'border-transparent' };

                  return (
                    <div key={bill.id} className={\`border-l-4 \${statusStyle.border}\`}>
                      <div className="flex items-center px-4 py-3.5 gap-3">
                        {/* Category colored circle icon */}
                        <div
                          className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border"
                          style={{ background: \`\${billColor}20\`, borderColor: \`\${billColor}35\` }}
                        >
                          {isSerasaAcordo
                            ? <FileText className="w-5 h-5" style={{ color: billColor }} />
                            : <CreditCard className="w-5 h-5" style={{ color: billColor }} />}
                        </div>

                        {/* Bill info */}
                        <div className="flex-1 min-w-0">
                          <p className={\`text-sm font-bold truncate \${isDarkMode ? 'text-white' : 'text-slate-900'}\`}>
                            {bill.title}
                          </p>
                          <div className="flex items-center space-x-1.5 mt-0.5">
                            <span className={\`text-[10px] \${subText}\`}>
                              {bill.dueDate.split('-').reverse().join('/')}
                            </span>
                            <span className={\`text-[9px] font-bold px-1.5 py-0.5 rounded-md \${isLate ? 'text-rose-400 bg-rose-400/10' : diffDays <= 3 ? 'text-amber-400 bg-amber-400/10' : 'text-slate-400 bg-slate-400/10'}\`}>
                              {daysText}
                            </span>
                          </div>
                        </div>

                        {/* Amount */}
                        <div className="text-right shrink-0">
                          <p className={\`text-sm font-extrabold \${isDarkMode ? 'text-white' : 'text-slate-900'}\`}>
                            R$ {bill.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                          {/* Status badge */}
                          <span className={\`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border mt-0.5 \${statusStyle.cls}\`}>
                            <span>{statusStyle.text}</span>
                          </span>
                        </div>
                      </div>

                      {/* Inline actions row */}
                      <div className={\`flex items-center gap-2 px-4 pb-3 \${
                        !isLast ? \`border-b \${isDarkMode ? 'border-[#252732]' : 'border-slate-100'}\` : ''
                      }\`}>
                        <button
                          onClick={(e) => handlePayBillInline(bill.id, e)}
                          className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 active:scale-95 transition-all"
                        >
                          <Check className="w-3 h-3 stroke-[3]" />
                          <span>Pagar</span>
                        </button>
                        <span className={\`text-[10px] \${subText}\`}>•</span>
                        <button
                          ` + content.substring(endIdx);
    fs.writeFileSync('src/App.jsx', newContent, 'utf8');
    console.log('SUCCESS');
} else {
    console.log('NOT FOUND');
}
