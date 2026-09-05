const fs = require('fs');
let content = fs.readFileSync('App.jsx', 'utf8').replace(/\r\n/g, '\n');

// 1. Add state for income target account
const stateAnchor = `  const [incomeDesc, setIncomeDesc] = useState('');`;
content = content.replace(stateAnchor, `  const [incomeTargetAccId, setIncomeTargetAccId] = useState('');\n  const [incomeDesc, setIncomeDesc] = useState('');`);

// 2. Add handleSaveIncome improvements
const handleSaveIncomeRegex = /const handleSaveIncome = \(\) => \{[\s\S]*?setActiveSheet\(null\);\n  \};/;
const newHandleSaveIncome = `const handleSaveIncome = () => {
    const num = parseLocalizedNumber(incomeAmount);
    if (!num || num <= 0) return;

    let targetAcc = accounts.find(a => a.id === incomeTargetAccId);
    if (!targetAcc && accounts.length > 0) targetAcc = accounts[0];

    if (targetAcc) {
      setAccounts(accounts.map(a => a.id === targetAcc.id ? { ...a, balance: a.balance + num } : a));
    }

    const newTx = {
      id: \`t_\${Date.now()}\`,
      title: incomeDesc.trim() || 'Nova Receita',
      category: 'Receita',
      date: new Date().toISOString().split('T')[0],
      dayGroup: 'Hoje',
      amount: num,
      type: 'income',
      status: 'completed',
      location: targetAcc ? targetAcc.name : 'Conta Bancária',
      sourceType: 'account',
      accountId: targetAcc ? targetAcc.id : null
    };

    setTransactions([newTx, ...transactions]);
    setIncomeDesc('');
    setIncomeAmount('');
    setIncomeTargetAccId('');
    setActiveSheet(null);
  };`;
content = content.replace(handleSaveIncomeRegex, newHandleSaveIncome);

// 3. Update the add-income modal UI
const addIncomeModalRegex = /\{\/\* Modal: Nova Receita \*\/\}\n\s*\{activeSheet === 'add-income'[\s\S]*?Adicionar Receita\n\s*<\/button>\n\s*<\/div>\n\s*<\/div>\n\s*<\/div>\n\s*\)\}/;

const newAddIncomeModal = `{/* Modal: Nova Receita */}
        {activeSheet === 'add-income' && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div className={\`w-full max-w-[480px] rounded-t-3xl sm:rounded-3xl border \${cardBg} p-6 space-y-5 animate-in slide-in-from-bottom sm:zoom-in-95 duration-300 shadow-2xl max-h-[90vh] overflow-y-auto scrollbar-none\`}>
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-extrabold text-emerald-500">Nova Receita Direta</h3>
                <button onClick={() => setActiveSheet(null)} className={\`p-1.5 rounded-full transition-colors \${isDarkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-200 text-slate-600'}\`}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="text-center pb-2">
                  <span className={\`text-xs \${subText} block mb-1\`}>Valor da Receita</span>
                  <input type="text" value={incomeAmount} onChange={(e) => setIncomeAmount(e.target.value)} className={\`w-full bg-transparent text-center text-4xl font-black text-emerald-400 outline-none border-b border-slate-700/50 pb-2 focus:border-emerald-500 transition-colors\`} placeholder="R$ 0,00" />
                </div>
                <div>
                  <label className={\`text-[10px] uppercase tracking-wider font-bold \${subText} block mb-1\`}>Descrição</label>
                  <input type="text" value={incomeDesc} onChange={(e) => setIncomeDesc(e.target.value)} placeholder="Ex: Salário, Pix recebido..." className={\`w-full p-3 rounded-xl border \${innerInputBg} text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all\`} />
                </div>
                <div>
                  <label className={\`text-[10px] uppercase tracking-wider font-bold \${subText} block mb-1\`}>Conta de Destino</label>
                  <select
                    value={incomeTargetAccId}
                    onChange={(e) => setIncomeTargetAccId(e.target.value)}
                    className={\`w-full p-3 rounded-xl border \${innerInputBg} text-sm font-bold outline-none \${isDarkMode ? 'bg-[#1e2029] text-white' : 'bg-slate-100 text-slate-900'}\`}
                  >
                    <option value="" disabled>Selecione onde o dinheiro entrou</option>
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
                <button onClick={handleSaveIncome} className="w-full py-3.5 rounded-2xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-500 active:scale-95 transition-all shadow-lg shadow-emerald-500/25 mt-2">
                  Adicionar Receita
                </button>
              </div>
            </div>
          </div>
        )}`;

content = content.replace(addIncomeModalRegex, newAddIncomeModal);

// Also set the default account when opening 'add-income'
content = content.replace(
  `{ id: 'add-income', label: 'Receita Direta'`,
  `{ id: 'add-income', onClick: () => { if(accounts.length > 0) setIncomeTargetAccId(accounts[0].id); setActiveSheet('add-income'); }, label: 'Receita Direta'`
);
// And in the quick menu mapping:
content = content.replace(
  `onClick={() => closeQuickMenuWithAnim(() => setActiveSheet(item.id))}`,
  `onClick={() => closeQuickMenuWithAnim(() => { if (item.onClick) item.onClick(); else setActiveSheet(item.id); })}`
);


fs.writeFileSync('App.jsx', content);
console.log('Fixed Add Income!');
