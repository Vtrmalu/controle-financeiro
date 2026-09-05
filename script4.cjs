const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');

const startStr = '{/* CARD 1: Comprometimento do Orçamento Total */}';
const endStr = '<div className={`p-2.5 rounded-2xl border ${innerInputBg} space-y-1.5 text-[11px]`}>';

const startIdx = content.indexOf('{/* CARD 1: Comprometimento');
if (startIdx === -1) {
    console.log('NOT FOUND START');
    process.exit(1);
}
const endIdx = content.indexOf('<div className={`p-2.5 rounded-2xl border ${innerInputBg} space-y-1.5 text-[11px]`}>', startIdx);
if (endIdx === -1) {
    console.log('NOT FOUND END');
    process.exit(1);
}

const replacement = `{/* CARD 1: Comprometimento do Orçamento Total */}
            <div className={\`p-4 sm:p-5 rounded-3xl border \${cardBg} space-y-4 shadow-xl relative overflow-hidden\`}>
              <div className="flex justify-between items-start">
                <div>
                  <span className={\`text-[10px] font-extrabold uppercase tracking-widest \${subText} block\`}>Orçamento vs Gastos</span>
                  <h3 className="text-sm font-black uppercase text-blue-400">Comprometimento Total</h3>
                </div>
                <ModernIcon icon={Activity} color="blue" size="sm" />
              </div>

              <div className="flex flex-col items-center justify-center pt-2 pb-1">
                <div className="relative w-40 h-20 overflow-hidden flex flex-col items-center justify-end">
                  <svg className="absolute top-0 left-0 w-full h-[200%]" viewBox="0 0 100 100">
                    <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke={isDarkMode ? '#2d2f3a' : '#e2e8f0'} strokeWidth="12" strokeLinecap="round" />
                    <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke={overallBudgetCommitmentPct > 80 ? '#f43f5e' : overallBudgetCommitmentPct > 60 ? '#fbbf24' : '#3b82f6'} strokeWidth="12" strokeLinecap="round" 
                      strokeDasharray="125.66" strokeDashoffset={125.66 - (125.66 * Math.min(overallBudgetCommitmentPct, 100)) / 100} 
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute bottom-0 text-center flex flex-col items-center leading-none">
                    <span className={\`text-2xl font-black \${overallBudgetCommitmentPct > 80 ? 'text-rose-400' : overallBudgetCommitmentPct > 60 ? 'text-amber-400' : 'text-blue-400'}\`}>
                      {overallBudgetCommitmentPct}%
                    </span>
                    <span className={\`text-[9px] font-bold mt-1 px-2 py-0.5 rounded-full \${overallBudgetCommitmentPct > 80 ? 'text-rose-400 bg-rose-400/10' : overallBudgetCommitmentPct > 60 ? 'text-amber-400 bg-amber-400/10' : 'text-emerald-400 bg-emerald-400/10'}\`}>
                      {overallBudgetCommitmentPct > 80 ? '⚠️ Elevado' : overallBudgetCommitmentPct > 60 ? '⚠️ Moderado' : '✅ Excelente'}
                    </span>
                  </div>
                </div>
              </div>

              `;

const newContent = content.substring(0, startIdx) + replacement + content.substring(endIdx);
fs.writeFileSync('src/App.jsx', newContent, 'utf8');
console.log('SUCCESS');
