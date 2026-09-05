const fs = require('fs');

let content = fs.readFileSync('App.jsx', 'utf8').replace(/\r\n/g, '\n');

// 1. Injetar Estados
const stateAnchor = `  const [payBillInstallments, setPayBillInstallments] = useState('1');`;
const newStates = `  const [payBillInstallments, setPayBillInstallments] = useState('1');
  const [payBillError, setPayBillError] = useState('');
  
  const [transferSourceId, setTransferSourceId] = useState('');
  const [transferDestId, setTransferDestId] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferError, setTransferError] = useState('');`;
content = content.replace(stateAnchor, newStates);

// 2. Trava em handleConfirmPayBill
const confirmAnchor = `      const acc = accounts.find(a => a.id === payBillSelectedAccountId) || accounts[0];
      sourceName = acc ? acc.name : 'Conta';
      if (acc) {
        setAccounts(accounts.map(a => a.id === acc.id ? { ...a, balance: a.balance - finalAmount } : a));
      }`;
const confirmNew = `      const acc = accounts.find(a => a.id === payBillSelectedAccountId) || accounts[0];
      sourceName = acc ? acc.name : 'Conta';
      if (acc) {
        const accLiquidity = acc.balance + (acc.overdraftLimit || 0);
        if (accLiquidity < finalAmount) {
          setPayBillError('Saldo insuficiente nesta conta.');
          return;
        }
        setAccounts(accounts.map(a => a.id === acc.id ? { ...a, balance: a.balance - finalAmount } : a));
      }`;
content = content.replace(confirmAnchor, confirmNew);
// Ensure error is cleared at start
content = content.replace(
  `  const handleConfirmPayBill = () => {
    if (!billToPay) return;`,
  `  const handleConfirmPayBill = () => {
    setPayBillError('');
    if (!billToPay) return;`
);

// Add error UI in the Pay Bill Modal
content = content.replace(
  `              <div className="text-center space-y-1">
                <span className={\`text-xs uppercase tracking-widest font-black \${subText}\`}>Pagando Boleto</span>
                <h3 className="text-xl font-bold text-white truncate px-4">{billToPay.title}</h3>
              </div>`,
  `              <div className="text-center space-y-1">
                <span className={\`text-xs uppercase tracking-widest font-black \${subText}\`}>Pagando Boleto</span>
                <h3 className="text-xl font-bold text-white truncate px-4">{billToPay.title}</h3>
              </div>
              {payBillError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-center">
                  <p className="text-xs font-bold text-rose-400">{payBillError}</p>
                </div>
              )}`
);


// 3. handleExecuteTransfer
const transferHandlerAnchor = `  const handleLogin = async (e) => {`;
const transferHandlerNew = `  const handleExecuteTransfer = () => {
    setTransferError('');
    if (!transferSourceId || !transferDestId) return setTransferError('Selecione as contas.');
    if (transferSourceId === transferDestId) return setTransferError('As contas devem ser diferentes.');
    
    const numAmount = parseLocalizedNumber(transferAmount);
    if (!numAmount || numAmount <= 0) return setTransferError('Valor inválido.');

    const sourceAcc = accounts.find(a => a.id === transferSourceId);
    const destAcc = accounts.find(a => a.id === transferDestId);

    if (!sourceAcc || !destAcc) return setTransferError('Conta não encontrada.');

    const sourceLiquidity = sourceAcc.balance + (sourceAcc.overdraftLimit || 0);
    if (sourceLiquidity < numAmount) return setTransferError('Saldo insuficiente na conta de origem.');

    // Execute transfer
    setAccounts(accounts.map(a => {
      if (a.id === sourceAcc.id) return { ...a, balance: a.balance - numAmount };
      if (a.id === destAcc.id) return { ...a, balance: a.balance + numAmount };
      return a;
    }));

    // Add to history
    setTransactions(prev => [...prev, {
      id: \`t_\${Date.now()}\`,
      type: 'transfer',
      amount: numAmount,
      category: 'Transferência',
      title: \`De \${sourceAcc.name} para \${destAcc.name}\`,
      date: new Date().toISOString().split('T')[0],
      source: 'Transferência'
    }]);

    setActiveSheet(null);
    setTransferAmount('');
    setTransferSourceId('');
    setTransferDestId('');
  };
`;
content = content.replace(transferHandlerAnchor, transferHandlerNew + '\n  ' + transferHandlerAnchor);

// 4. Update Bank Accounts Box header
const bankAccountsAnchor = `              {/* Bank Accounts Box */}
              <div className={\`p-4 rounded-2xl border \${innerInputBg} space-y-3\`}>
                <div className="flex justify-between items-center">
                  <span className={\`text-xs font-bold uppercase \${subText}\`}>Saldo em Contas</span>
                  <span className="text-sm font-black text-emerald-400">
                    R$ {totalBankBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>`;

const bankAccountsNew = `              {/* Bank Accounts Box */}
              <div className={\`p-4 rounded-2xl border \${innerInputBg} space-y-3\`}>
                <div className="flex justify-between items-center">
                  <span className={\`text-xs font-bold uppercase \${subText}\`}>Saldo em Contas</span>
                  <div className="flex items-center space-x-3">
                    <button 
                      onClick={() => {
                        setTransferError('');
                        setTransferAmount('');
                        if (accounts.length >= 2) {
                          setTransferSourceId(accounts[0].id);
                          setTransferDestId(accounts[1].id);
                        }
                        setActiveSheet('transfer');
                      }}
                      className="text-[10px] font-black uppercase text-blue-400 hover:text-blue-300 transition-colors bg-blue-500/10 px-2 py-1 rounded"
                    >
                      Transferir
                    </button>
                    <span className="text-sm font-black text-emerald-400">
                      R$ {totalBankBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>`;
content = content.replace(bankAccountsAnchor, bankAccountsNew);

// 5. Transfer Modal UI
const modalInjectionPoint = `        {/* Modal: Create Category */}`;
const transferModal = `        {/* Modal: Transfer */}
        <BottomSheet
          isOpen={activeSheet === 'transfer'}
          onClose={() => setActiveSheet(null)}
          title="Transferência entre Contas"
        >
          <div className="space-y-4 pb-6 px-4">
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
        </BottomSheet>

`;
content = content.replace(modalInjectionPoint, transferModal + modalInjectionPoint);

// 6. Update History rendering for 'transfer'
// Color:
content = content.replace(
  "tx.type === 'income' ? 'bg-emerald-500/20 text-emerald-400' : tx.type === 'bill_payment' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-rose-500/20 text-rose-400'",
  "tx.type === 'income' ? 'bg-emerald-500/20 text-emerald-400' : tx.type === 'bill_payment' ? 'bg-indigo-500/20 text-indigo-400' : tx.type === 'transfer' ? 'bg-blue-500/20 text-blue-400' : 'bg-rose-500/20 text-rose-400'"
);
// Text color:
content = content.replace(
  "tx.type === 'income' ? 'text-emerald-400' : tx.type === 'bill_payment' ? 'text-indigo-400' : 'text-rose-400'",
  "tx.type === 'income' ? 'text-emerald-400' : tx.type === 'bill_payment' ? 'text-indigo-400' : tx.type === 'transfer' ? 'text-blue-400' : 'text-rose-400'"
);
// Icon:
content = content.replace(
  "<ArrowUpRight className=\"w-5 h-5 stroke-[2.5]\" /> : tx.type === 'bill_payment' ? <CheckCircle2 className=\"w-5 h-5 stroke-[2.5]\" /> : <ArrowDownRight className=\"w-5 h-5 stroke-[2.5]\" />",
  "<ArrowUpRight className=\"w-5 h-5 stroke-[2.5]\" /> : tx.type === 'bill_payment' ? <CheckCircle2 className=\"w-5 h-5 stroke-[2.5]\" /> : tx.type === 'transfer' ? <ArrowRightLeft className=\"w-5 h-5 stroke-[2.5]\" /> : <ArrowDownRight className=\"w-5 h-5 stroke-[2.5]\" />"
);

// Missing import ArrowRightLeft
content = content.replace("ArrowUpRight,", "ArrowUpRight, ArrowRightLeft,");


fs.writeFileSync('App.jsx', content);
console.log('Refactoring complete!');
