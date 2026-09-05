const fs = require('fs');

let content = fs.readFileSync('App.jsx', 'utf8').replace(/\r\n/g, '\n');

// 2. Modify handlePayBillInline
const oldHandlePayBillInlineRegex = /const handlePayBillInline = \(billId, e\) => \{[\s\S]*?setSwipedBillId\(null\);\n  \};/;

const newHandlePayBillInline = `const handlePayBillInline = (billId, e) => {
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

content = content.replace(oldHandlePayBillInlineRegex, newHandlePayBillInline);

// 4. Pay Bill Sheet UI Update
const oldPayBillModalRegex = /\{\/\* Modal: Pay Bill Confirmation \*\/\}\n\s*\{activeSheet === 'pay-bill'[\s\S]*?Confirmar e Pagar\n\s*<\/button>\n\s*<\/div>\n\s*<\/div>\n\s*<\/div>\n\s*<\/div>\n\s*\)\}/;

const newPayBillModal = `{/* Modal: Pay Bill Confirmation */}
        <BottomSheet
          isOpen={activeSheet === 'pay-bill'}
          onClose={() => {
            setActiveSheet(null);
            setBillToPay(null);
          }}
          title="Confirmar Pagamento"
        >
          {billToPay && (
            <div className="space-y-6 pb-6 px-4">
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
                      className="w-5 h-5 rounded cursor-pointer accent-emerald-500"
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
                      className={\`flex-1 py-2 text-xs font-bold rounded-xl transition-all \${payBillSourceType === 'account' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}\`}
                    >
                      Conta
                    </button>
                    <button
                      type="button"
                      onClick={() => setPayBillSourceType('credit_card')}
                      className={\`flex-1 py-2 text-xs font-bold rounded-xl transition-all \${payBillSourceType === 'credit_card' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}\`}
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
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-black py-4 rounded-2xl shadow-lg transition-all transform active:scale-95 mt-4"
              >
                Confirmar e Pagar
              </button>
            </div>
          )}
        </BottomSheet>`;

content = content.replace(oldPayBillModalRegex, newPayBillModal);

// 5. Update history rendering (since it didn't match before)
// Find tx.type === 'income' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
content = content.replace(
  /tx\.type === 'income' \? 'bg-emerald-500\/20 text-emerald-400' : 'bg-rose-500\/20 text-rose-400'/g,
  "tx.type === 'income' ? 'bg-emerald-500/20 text-emerald-400' : tx.type === 'bill_payment' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-rose-500/20 text-rose-400'"
);

// Find tx.type === 'income' ? <ArrowUpRight className="w-5 h-5 stroke-[2.5]" /> : <ArrowDownRight className="w-5 h-5 stroke-[2.5]" />
content = content.replace(
  /<ArrowUpRight className="w-5 h-5 stroke-\[2\.5\]" \/> : <ArrowDownRight className="w-5 h-5 stroke-\[2\.5\]" \/>/g,
  '<ArrowUpRight className="w-5 h-5 stroke-[2.5]" /> : tx.type === \'bill_payment\' ? <CheckCircle2 className="w-5 h-5 stroke-[2.5]" /> : <ArrowDownRight className="w-5 h-5 stroke-[2.5]" />'
);

// Find <p className="text-sm font-bold truncate max-w-[140px] text-white">\n                                {tx.title}\n                              <\/p>
content = content.replace(
  /<p className="text-sm font-bold truncate max-w-\[140px\] text-white">\s*\{tx\.title\}\s*<\/p>/g,
  `<p className="text-sm font-bold truncate max-w-[140px] text-white">\n                                {tx.type === 'bill_payment' && <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 mr-2 border border-indigo-500/30">Pgto</span>}\n                                {tx.title}\n                              </p>`
);

content = content.replace(
  /className=\{\`text-sm font-black \$\{tx\.type === 'income' \? 'text-emerald-400' : 'text-rose-400'\}\`\}/g,
  "className={`text-sm font-black ${tx.type === 'income' ? 'text-emerald-400' : tx.type === 'bill_payment' ? 'text-indigo-400' : 'text-rose-400'}`}"
);

fs.writeFileSync('App.jsx', content);
console.log('Fixed Refactoring!');
