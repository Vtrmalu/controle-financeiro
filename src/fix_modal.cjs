const fs = require('fs');

let content = fs.readFileSync('App.jsx', 'utf8');

const bottomSheetStart = `<BottomSheet
          isOpen={activeSheet === 'pay-bill'}
          onClose={() => {
            setActiveSheet(null);
            setBillToPay(null);
          }}
          title="Confirmar Pagamento"
        >`;
const bottomSheetEnd = `</BottomSheet>`;

const newStart = `{activeSheet === 'pay-bill' && billToPay && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div className={\`w-full max-w-[480px] rounded-t-3xl sm:rounded-3xl border \${cardBg} p-5 space-y-4 animate-in slide-in-from-bottom sm:zoom-in-95 duration-300 shadow-2xl max-h-[90vh] overflow-y-auto scrollbar-none\`}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-extrabold flex items-center space-x-2 text-emerald-500">
                  <ModernIcon icon={CheckCircle2} color="emerald" size="sm" />
                  <span>Confirmar Pagamento</span>
                </h3>
                <button onClick={() => { setActiveSheet(null); setBillToPay(null); }} className={\`p-1.5 rounded-full transition-colors \${isDarkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-200 text-slate-600'}\`}>
                  <X className="w-5 h-5" />
                </button>
              </div>`;

const newEnd = `            </div>
          </div>
        )}`;

content = content.replace(bottomSheetStart, newStart);
content = content.replace(bottomSheetEnd, newEnd);

fs.writeFileSync('App.jsx', content);
console.log('Fixed BottomSheet!');
