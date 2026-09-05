const fs = require('fs');

let content = fs.readFileSync('App.jsx', 'utf8');

// 1. Add state variables
const stateAnchor = `  const [payBillUpdateFuture, setPayBillUpdateFuture] = useState(true);`;
const stateInjection = `  const [payBillUpdateFuture, setPayBillUpdateFuture] = useState(true);
  const [payBillSourceType, setPayBillSourceType] = useState('account');
  const [payBillSelectedAccountId, setPayBillSelectedAccountId] = useState('acc1');
  const [payBillSelectedCardId, setPayBillSelectedCardId] = useState('card1');
  const [payBillInstallments, setPayBillInstallments] = useState('1');`;
content = content.replace(stateAnchor, stateInjection);

// 2. Modify handlePayBillInline
const oldHandlePayBillInline = `  const handlePayBillInline = (billId, e) => {
    e?.stopPropagation();

    const bill = bills.find(b => b.id === billId);
    if (bill?.id.startsWith('b_card_') && bill.status !== 'paid') {
      const cardName = extractCardNameFromBillTitle(bill.title);
      
    }

    setBills(prev => prev.map(b => b.id === billId ? { ...b, status: 'paid' } : b));
    setSwipedBillId(null);
  };`;

const newHandlePayBillInline = `  const handlePayBillInline = (billId, e) => {
    e?.stopPropagation();
    const bill = bills.find(b => b.id === billId);
    if (!bill) return;

    setBillToPay(bill);
    setPayBillAmount(bill.amount.toString());
    setPayBillSourceType('account');
    if (accounts.length > 0) setPayBillSelectedAccountId(accounts[0].id);
    if (creditCards.length > 0) setPayBillSelectedCardId(creditCards[0].id);
    setActiveSheet('pay-bill');
    setSwipedBillId(null);
  };`;
content = content.replace(oldHandlePayBillInline, newHandlePayBillInline);

// 3. Insert handleConfirmPayBill
const handleConfirmAnchor = `  const handleConfirmSerasaAgreement = () => {`;
const newHandleConfirmPayBill = `  const handleConfirmPayBill = () => {
    if (!billToPay) return;
    const finalAmount = parseLocalizedNumber(payBillAmount);
    if (!finalAmount || finalAmount <= 0) return;

    let sourceName = 'Manual';

    if (payBillSourceType === 'account') {
      const acc = accounts.find(a => a.id === payBillSelectedAccountId) || accounts[0];
      sourceName = acc ? acc.name : 'Conta';
      if (acc) {
        setAccounts(accounts.map(a => a.id === acc.id ? { ...a, balance: a.balance - finalAmount } : a));
      }
    } else if (payBillSourceType === 'credit_card') {
      const card = creditCards.find(c => c.id === payBillSelectedCardId) || creditCards[0];
      sourceName = card ? card.name : 'Cartão de Crédito';
      const instCount = parseInt(payBillInstallments) || 1;
      
      if (card) {
        const nextUsedLimit = getCardUsedFromBills(card.name) + finalAmount;
        if (nextUsedLimit > (card.totalLimit || 0)) {
          alert('Limite do cartão insuficiente para pagar este boleto.');
          return;
        }

        const dueDates = calculateCardInstallmentDates(new Date().toISOString().split('T')[0], card.closingDay, card.dueDay, instCount, 0);
        const generatedBills = dueDates.map((dInfo, idx) => ({
          id: \`b_card_\${Date.now()}_\${idx}\`,
          title: \`Fatura: Pgto \${billToPay.title} (\${idx + 1}/\${instCount}) - \${card.name}\`,
          category: billToPay.category,
          dueDate: dInfo.dateStr,
          amount: finalAmount / instCount,
          status: 'pending',
          urgent: false
        }));

        setBills(prev => [...prev, ...generatedBills]);
      }
    }

    setTransactions(prev => [...prev, {
      id: \`t_\${Date.now()}\`,
      type: 'bill_payment',
      amount: finalAmount,
      category: billToPay.category,
      title: \`Pagamento: \${billToPay.title}\`,
      date: new Date().toISOString().split('T')[0],
      source: sourceName
    }]);

    setBills(prev => prev.map(b => {
      if (b.id === billToPay.id) {
        return { ...b, status: 'paid', amount: finalAmount };
      }
      return b;
    }));

    if (billToPay.groupId && payBillUpdateFuture) {
      setBills(prev => prev.map(b => {
        if (b.groupId === billToPay.groupId && b.status === 'pending' && b.id !== billToPay.id && b.dueDate >= billToPay.dueDate) {
          return { ...b, amount: finalAmount };
        }
        return b;
      }));
    }

    setBillToPay(null);
    setActiveSheet(null);
  };
`;
content = content.replace(handleConfirmAnchor, newHandleConfirmPayBill + '\\n' + handleConfirmAnchor);


// 4. Pay Bill Sheet UI Update
const oldPayBillModalStart = `        {/* Modal: Pay Bill Confirmation */}
        {activeSheet === 'pay-bill' && billToPay && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div className={\`w-full max-w-[480px] rounded-t-3xl sm:rounded-3xl border \${cardBg} p-5 space-y-4 animate-in slide-in-from-bottom sm:zoom-in-95 duration-300 shadow-2xl\`}>
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-extrabold flex items-center space-x-2 text-emerald-500">
                  <ModernIcon icon={CheckCircle2} color="emerald" size="sm" />
                  <span>Confirmar Pagamento</span>
                </h3>
                <button onClick={() => { setActiveSheet(null); setBillToPay(null); }} className={\`p-2 rounded-full hover:\${themeBg} transition-colors\`}>
                  <X className="w-5 h-5 opacity-60" />
                </button>
              </div>
              <div className="pt-2">
                <p className="text-sm opacity-80 mb-4">Confirme o valor pago para o boleto <strong>{billToPay.title}</strong>.</p>
                <div className="space-y-4">
                  <div>
                    <label className={\`text-[10px] uppercase tracking-wider font-bold \${subText} block mb-1\`}>Valor Final Pago (R$)</label>
                    <input type="text" inputMode="decimal" value={payBillAmount} onChange={(e) => setPayBillAmount(e.target.value)} className={\`w-full bg-transparent border-b-2 \${isDarkMode ? 'border-slate-800 focus:border-emerald-500 text-white' : 'border-slate-200 focus:border-emerald-500 text-slate-900'} py-2 text-2xl font-bold text-center focus:outline-none transition-colors\`} />
                  </div>
                  <button onClick={handleConfirmPayBill} className="w-full py-4 rounded-2xl bg-emerald-500 text-white font-extrabold shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all">
                    Confirmar e Pagar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}`;

const newPayBillModal = `        {/* Modal: Pay Bill Confirmation */}
        <BottomSheet
          isOpen={activeSheet === 'pay-bill'}
          onClose={() => {
            setActiveSheet(null);
            setBillToPay(null);
          }}
          title="Confirmar Pagamento"
        >
          {billToPay && (
            <div className="space-y-6 pb-6">
              <div className="text-center space-y-1">
                <span className={\`text-xs uppercase tracking-widest font-black \${subText}\`}>Pagando Boleto</span>
                <h3 className="text-xl font-bold text-white truncate px-4">{billToPay.title}</h3>
              </div>

              <div className="space-y-4">
                {billToPay.groupId && (
                  <label className={\`flex items-center space-x-3 p-3 rounded-2xl border \${innerInputBg} cursor-pointer mb-2\`}>
                    <input
                      type="checkbox"
                      checked={payBillUpdateFuture}
                      onChange={(e) => setPayBillUpdateFuture(e.target.checked)}
                      className="w-5 h-5 rounded cursor-pointer accent-amber-500"
                    />
                    <div>
                      <span className="text-xs font-bold block">Atualizar meses futuros</span>
                      <span className={\`text-[10px] \${subText}\`}>Aplicar este novo valor para os próximos boletos desta recorrência.</span>
                    </div>
                  </label>
                )}
                
                <div className="space-y-1">
                  <label className={\`text-[10px] font-bold uppercase tracking-wider \${subText} ml-1\`}>Valor Pago</label>
                  <div className="relative">
                    <span className={\`absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold \${subText}\`}>R$</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      required
                      value={payBillAmount}
                      onChange={(e) => setPayBillAmount(e.target.value)}
                      className={\`w-full pl-10 p-3.5 rounded-2xl text-base font-black bg-transparent border \${inputBorder} \${inputFocus} text-emerald-400 focus:outline-none transition-all\`}
                    />
                  </div>
                </div>

                <div className="space-y-1 mt-4">
                  <label className={\`text-[10px] font-bold uppercase tracking-wider \${subText} ml-1\`}>Fonte do Pagamento</label>
                  <div className="flex bg-slate-800/50 p-1 rounded-2xl border border-slate-700">
                    <button
                      type="button"
                      onClick={() => setPayBillSourceType('account')}
                      className={\`flex-1 py-2 text-xs font-bold rounded-xl transition-all \${payBillSourceType === 'account' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}\`}
                    >
                      Conta
                    </button>
                    <button
                      type="button"
                      onClick={() => setPayBillSourceType('credit_card')}
                      className={\`flex-1 py-2 text-xs font-bold rounded-xl transition-all \${payBillSourceType === 'credit_card' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}\`}
                    >
                      Cartão
                    </button>
                  </div>
                </div>

                {payBillSourceType === 'account' && (
                  <div className="space-y-1 mt-3">
                    <label className={\`text-[10px] font-bold uppercase tracking-wider \${subText} ml-1\`}>Conta de Saída</label>
                    <select
                      value={payBillSelectedAccountId}
                      onChange={(e) => setPayBillSelectedAccountId(e.target.value)}
                      className={\`w-full p-3.5 rounded-2xl text-sm font-bold bg-transparent border \${inputBorder} \${inputFocus} text-white focus:outline-none transition-all appearance-none cursor-pointer\`}
                    >
                      {accounts.map(acc => (
                        <option key={acc.id} value={acc.id} className="bg-slate-900 text-white">
                          {acc.name} (R$ {acc.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {payBillSourceType === 'credit_card' && (
                  <>
                    <div className="space-y-1 mt-3">
                      <label className={\`text-[10px] font-bold uppercase tracking-wider \${subText} ml-1\`}>Cartão Utilizado</label>
                      <select
                        value={payBillSelectedCardId}
                        onChange={(e) => setPayBillSelectedCardId(e.target.value)}
                        className={\`w-full p-3.5 rounded-2xl text-sm font-bold bg-transparent border \${inputBorder} \${inputFocus} text-white focus:outline-none transition-all appearance-none cursor-pointer\`}
                      >
                        {creditCards.map(c => {
                          const limitLivre = c.totalLimit - getCardUsedFromBills(c.name);
                          return (
                            <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                              {c.name} (Livre: R$ {limitLivre.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
                            </option>
                          );
                        })}
                      </select>
                    </div>
                    <div className="space-y-1 mt-3">
                      <label className={\`text-[10px] font-bold uppercase tracking-wider \${subText} ml-1\`}>Parcelas</label>
                      <select
                        value={payBillInstallments}
                        onChange={(e) => setPayBillInstallments(e.target.value)}
                        className={\`w-full p-3.5 rounded-2xl text-sm font-bold bg-transparent border \${inputBorder} \${inputFocus} text-white focus:outline-none transition-all appearance-none cursor-pointer\`}
                      >
                        {[...Array(12)].map((_, i) => (
                          <option key={i+1} value={i+1} className="bg-slate-900 text-white">{i+1}x</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

              </div>

              <button
                type="button"
                onClick={handleConfirmPayBill}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-2xl shadow-lg transition-all transform active:scale-95 mt-4"
              >
                Confirmar e Pagar
              </button>
            </div>
          )}
        </BottomSheet>`;

content = content.replace(oldPayBillModalStart, newPayBillModal);

// 5. Update history rendering
const oldTxRender = `                    return (
                      <div key={tx.id} className={\`p-4 rounded-2xl border \${innerInputBg} hover:bg-white/5 transition-all\`}>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-3">
                            <div className={\`w-10 h-10 rounded-2xl flex items-center justify-center shadow-inner \${
                              tx.type === 'income' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                            }\`}>`;

const newTxRender = `                    return (
                      <div key={tx.id} className={\`p-4 rounded-2xl border \${innerInputBg} hover:bg-white/5 transition-all\`}>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-3">
                            <div className={\`w-10 h-10 rounded-2xl flex items-center justify-center shadow-inner \${
                              tx.type === 'income' ? 'bg-emerald-500/20 text-emerald-400' :
                              tx.type === 'bill_payment' ? 'bg-indigo-500/20 text-indigo-400' :
                              'bg-rose-500/20 text-rose-400'
                            }\`}>`;

content = content.replace(oldTxRender, newTxRender);

const oldTxIcon = `                              {tx.type === 'income' ? <ArrowUpRight className="w-5 h-5 stroke-[2.5]" /> : <ArrowDownRight className="w-5 h-5 stroke-[2.5]" />}`;
const newTxIcon = `                              {tx.type === 'income' ? <ArrowUpRight className="w-5 h-5 stroke-[2.5]" /> :
                               tx.type === 'bill_payment' ? <CheckCircle2 className="w-5 h-5 stroke-[2.5]" /> :
                               <ArrowDownRight className="w-5 h-5 stroke-[2.5]" />}`;

content = content.replace(oldTxIcon, newTxIcon);

const oldTxTitle = `                              <p className="text-sm font-bold truncate max-w-[140px] text-white">
                                {tx.title}
                              </p>`;
const newTxTitle = `                              <p className="text-sm font-bold truncate max-w-[140px] text-white">
                                {tx.type === 'bill_payment' && <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 mr-2 border border-indigo-500/30">Pgto</span>}
                                {tx.title}
                              </p>`;
content = content.replace(oldTxTitle, newTxTitle);

const oldTxAmount = `                          <div className="text-right">
                            <p className={\`text-sm font-black \${tx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}\`}>
                              {tx.type === 'income' ? '+' : '-'} R$ {tx.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const newTxAmount = `                          <div className="text-right">
                            <p className={\`text-sm font-black \${
                              tx.type === 'income' ? 'text-emerald-400' :
                              tx.type === 'bill_payment' ? 'text-indigo-400' :
                              'text-rose-400'
                            }\`}>
                              {tx.type === 'income' ? '+' : '-'} R$ {tx.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

content = content.replace(oldTxAmount, newTxAmount);

fs.writeFileSync('App.jsx', content);
console.log('Done refactoring!');
