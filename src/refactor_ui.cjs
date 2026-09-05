const fs = require('fs');

let content = fs.readFileSync('App.jsx', 'utf8');

// 1. Add Income form UI
const oldIncomeRecToggle = `                  <div>
                    <span className="text-xs font-bold block">Entrada Recorrente Mensal</span>
                    <span className={\`text-[10px] \${subText}\`}>Marque para receitas fixas como Salrio ou Aluguel</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={expIncIsRecurring}
                    onChange={(e) => setExpIncIsRecurring(e.target.checked)}
                    className="w-5 h-5 rounded cursor-pointer accent-emerald-500"
                  />`;
                  
const newIncomeRecToggle = `                  <div>
                    <span className="text-xs font-bold block">Meses de Duração (Recorrência)</span>
                    <span className={\`text-[10px] \${subText}\`}>1 = Mês único. Ex: 12 para um ano de salário.</span>
                  </div>
                  <input
                    type="number"
                    min="1"
                    max="360"
                    value={expIncRecurrenceCount}
                    onChange={(e) => setExpIncRecurrenceCount(parseInt(e.target.value) || 1)}
                    className={\`w-20 text-right p-2 rounded-xl text-sm font-bold bg-transparent border \${inputBorder} \${inputFocus} \${subText} \${textFocus} focus:outline-none transition-all\`}
                  />`;

content = content.replace(oldIncomeRecToggle, newIncomeRecToggle);

// 2. Add Bill form UI recurrence
// Find where to insert it in Add Bill. There is "addBillIsCreditCard" section. If it's NOT credit card, we should show recurrence count.
// Let's insert it after dueDate.
const oldBillDueDate = `                <div className="space-y-1">
                  <label className={\`text-[10px] font-bold uppercase tracking-wider \${subText} ml-1\`}>Vencimento</label>
                  <input
                    type="date"
                    required
                    value={billDueDate}
                    onChange={(e) => setBillDueDate(e.target.value)}
                    className={\`w-full p-3.5 rounded-2xl text-sm font-semibold bg-transparent border \${inputBorder} \${inputFocus} \${subText} \${textFocus} focus:outline-none transition-all\`}
                  />
                </div>`;

const newBillDueDate = `                <div className="space-y-1">
                  <label className={\`text-[10px] font-bold uppercase tracking-wider \${subText} ml-1\`}>Vencimento</label>
                  <input
                    type="date"
                    required
                    value={billDueDate}
                    onChange={(e) => setBillDueDate(e.target.value)}
                    className={\`w-full p-3.5 rounded-2xl text-sm font-semibold bg-transparent border \${inputBorder} \${inputFocus} \${subText} \${textFocus} focus:outline-none transition-all\`}
                  />
                </div>

                {!addBillIsCreditCard && (
                  <div className={\`p-3 rounded-2xl border \${innerInputBg} flex items-center justify-between mt-4\`}>
                    <div>
                      <span className="text-xs font-bold block">Meses de Duração (Conta Fixa)</span>
                      <span className={\`text-[10px] \${subText}\`}>1 = Mês único. Ex: 12 para um ano.</span>
                    </div>
                    <input
                      type="number"
                      min="1"
                      max="360"
                      value={billRecurrenceCount}
                      onChange={(e) => setBillRecurrenceCount(parseInt(e.target.value) || 1)}
                      className={\`w-20 text-right p-2 rounded-xl text-sm font-bold bg-transparent border \${inputBorder} \${inputFocus} \${subText} \${textFocus} focus:outline-none transition-all\`}
                    />
                  </div>
                )}`;
content = content.replace(oldBillDueDate, newBillDueDate);


// 3. Modals UI
// We need to add the confirm-income sheet. We can put it right before the pay-bill sheet.
const payBillSheetAnchor = `        {/* Pay Bill Sheet */}`;
const confirmIncomeSheet = `        {/* Confirm Income Sheet */}
        <BottomSheet
          isOpen={activeSheet === 'confirm-income'}
          onClose={() => {
            setActiveSheet(null);
            setConfirmIncItem(null);
          }}
          title="Confirmar Recebimento"
        >
          {confirmIncItem && (
            <div className="space-y-6 pb-6">
              <div className="text-center space-y-1">
                <span className={\`text-xs uppercase tracking-widest font-black \${subText}\`}>Confirmar Valor</span>
                <h3 className="text-xl font-bold text-white truncate px-4">{confirmIncItem.title}</h3>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className={\`text-[10px] font-bold uppercase tracking-wider \${subText} ml-1\`}>Valor Recebido</label>
                  <div className="relative">
                    <span className={\`absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold \${subText}\`}>R$</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      required
                      value={confirmIncAmount}
                      onChange={(e) => setConfirmIncAmount(e.target.value)}
                      className={\`w-full pl-10 p-3.5 rounded-2xl text-base font-black bg-transparent border \${inputBorder} \${inputFocus} text-emerald-400 focus:outline-none transition-all\`}
                    />
                  </div>
                </div>

                {confirmIncItem.groupId && (
                  <label className={\`flex items-center space-x-3 p-3 rounded-2xl border \${innerInputBg} cursor-pointer\`}>
                    <input
                      type="checkbox"
                      checked={confirmIncUpdateFuture}
                      onChange={(e) => setConfirmIncUpdateFuture(e.target.checked)}
                      className="w-5 h-5 rounded cursor-pointer accent-emerald-500"
                    />
                    <div>
                      <span className="text-xs font-bold block">Atualizar meses futuros</span>
                      <span className={\`text-[10px] \${subText}\`}>Aplicar este novo valor para todas as próximas receitas desta recorrência.</span>
                    </div>
                  </label>
                )}
              </div>

              <button
                type="button"
                onClick={confirmReceiveIncome}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-2xl shadow-lg transition-all transform active:scale-95"
              >
                Confirmar Recebimento
              </button>
            </div>
          )}
        </BottomSheet>
`;

content = content.replace(payBillSheetAnchor, confirmIncomeSheet + '\\n' + payBillSheetAnchor);

// Add update future to Pay Bill sheet
const oldPayBillContent = `              <div className="space-y-4">
                <div className="space-y-1">
                  <label className={\`text-[10px] font-bold uppercase tracking-wider \${subText} ml-1\`}>Valor Pago</label>`;

const newPayBillContent = `              <div className="space-y-4">
                {payingBillItem.groupId && (
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
                  <label className={\`text-[10px] font-bold uppercase tracking-wider \${subText} ml-1\`}>Valor Pago</label>`;

content = content.replace(oldPayBillContent, newPayBillContent);


// Remove the "Recorrente (Dia 05)" tag logic from Income List since isRecurring is gone
const oldTag = `{item.isRecurring && (
                              <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 shrink-0">
                                Recorrente (Dia {item.recurrenceDay || '05'})
                              </span>
                            )}`;
const newTag = `{item.groupId && (
                              <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 shrink-0">
                                Recorrente
                              </span>
                            )}`;
content = content.replace(oldTag, newTag);

// Same for bills if we want, but bills didn't have the tag before.

fs.writeFileSync('App.jsx', content);
console.log('UI injected');
