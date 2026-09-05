const fs = require('fs');
let content = fs.readFileSync('App.jsx', 'utf8').replace(/\r\n/g, '\n');

const modalInjectionPoint = `        {/* Modal: Gerenciar Categorias */}`;
const transferModal = `        {/* Modal: Transfer */}
        {activeSheet === 'transfer' && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div className={\`w-full max-w-[480px] rounded-t-3xl sm:rounded-3xl border \${cardBg} p-6 space-y-5 animate-in slide-in-from-bottom sm:zoom-in-95 duration-300 shadow-2xl max-h-[90vh] overflow-y-auto scrollbar-none\`}>
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-extrabold text-blue-500 flex items-center space-x-2">
                  <ArrowRightLeft className="w-5 h-5" />
                  <span>Transferência entre Contas</span>
                </h3>
                <button onClick={() => setActiveSheet(null)} className={\`p-1.5 rounded-full transition-colors \${isDarkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-200 text-slate-600'}\`}>
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {transferError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-center">
                    <p className="text-xs font-bold text-rose-400">{transferError}</p>
                  </div>
                )}
                
                <div className="space-y-1">
                  <label className={\`text-[10px] font-bold uppercase tracking-wider \${subText} ml-1\`}>Conta de Origem (Sai dinheiro)</label>
                  <select
                    value={transferSourceId}
                    onChange={(e) => setTransferSourceId(e.target.value)}
                    className={\`w-full p-3.5 rounded-2xl text-sm font-bold bg-transparent border \${isDarkMode ? 'border-slate-700 focus:border-blue-500' : 'border-slate-300 focus:border-blue-500'} text-white focus:outline-none transition-all appearance-none cursor-pointer\`}
                  >
                    <option value="" disabled className="bg-slate-900 text-slate-500">Selecione uma conta</option>
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id} className="bg-slate-900 text-white">
                        {acc.name} (R$ {(acc.balance + (acc.overdraftLimit || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className={\`text-[10px] font-bold uppercase tracking-wider \${subText} ml-1\`}>Conta de Destino (Entra dinheiro)</label>
                  <select
                    value={transferDestId}
                    onChange={(e) => setTransferDestId(e.target.value)}
                    className={\`w-full p-3.5 rounded-2xl text-sm font-bold bg-transparent border \${isDarkMode ? 'border-slate-700 focus:border-blue-500' : 'border-slate-300 focus:border-blue-500'} text-white focus:outline-none transition-all appearance-none cursor-pointer\`}
                  >
                    <option value="" disabled className="bg-slate-900 text-slate-500">Selecione uma conta</option>
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id} className="bg-slate-900 text-white">
                        {acc.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className={\`text-[10px] font-bold uppercase tracking-wider \${subText} ml-1\`}>Valor da Transferência</label>
                  <div className="relative">
                    <span className={\`absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold \${subText}\`}>R$</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      required
                      value={transferAmount}
                      onChange={(e) => setTransferAmount(e.target.value)}
                      className={\`w-full pl-10 p-3.5 rounded-2xl text-base font-black bg-transparent border \${isDarkMode ? 'border-slate-700 focus:border-blue-500' : 'border-slate-300 focus:border-blue-500'} text-blue-400 focus:outline-none transition-all\`}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleExecuteTransfer}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl shadow-lg transition-all transform active:scale-95 mt-4"
                >
                  Realizar Transferência
                </button>
              </div>
            </div>
          </div>
        )}

`;

// Use simple replacement check to avoid injecting twice
if (!content.includes("{/* Modal: Transfer */}")) {
  content = content.replace(modalInjectionPoint, transferModal + modalInjectionPoint);
  fs.writeFileSync('App.jsx', content);
  console.log('Transfer Modal Injected!');
} else {
  console.log('Transfer Modal already exists.');
}
