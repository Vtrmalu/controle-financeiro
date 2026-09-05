const fs = require('fs');
let content = fs.readFileSync('App.jsx', 'utf8').replace(/\r\n/g, '\n');

// 1. Expected Income
const oldExpectedIncome = `                    <select value={expIncCategory} onChange={(e) => setExpIncCategory(e.target.value)} className={\`w-full p-3 rounded-xl border \${innerInputBg} text-sm outline-none \${isDarkMode ? 'bg-[#1e2029] text-white' : 'bg-slate-100 text-slate-900'}\`}>
                      {['Salário', 'Vendas', 'Serviços', 'Investimentos', 'Aluguel', 'Outros'].map(cat => (
                        <option key={cat} value={cat} className={isDarkMode ? 'bg-[#16171d] text-white' : 'bg-white text-slate-900'}>{cat}</option>
                      ))}
                    </select>`;

const newExpectedIncome = `                    <select value={expIncCategory} onChange={(e) => setExpIncCategory(e.target.value)} className={\`w-full p-3 rounded-xl border \${innerInputBg} text-sm outline-none \${isDarkMode ? 'bg-[#1e2029] text-white' : 'bg-slate-100 text-slate-900'}\`}>
                      {dynamicCategories.map(c => <option key={c.id} value={c.name} className={isDarkMode ? 'bg-[#16171d] text-white' : 'bg-white text-slate-900'}>{c.name}</option>)}
                    </select>
                    <button type="button" onClick={() => { setActiveSheet('categories'); setIsCategoryFormOpen(true); }} className="text-[10px] text-emerald-500 font-bold mt-1.5 ml-1">+ Criar nova categoria</button>`;

if (content.includes("['Salário', 'Vendas'")) {
  content = content.replace(oldExpectedIncome, newExpectedIncome);
}

// 2. Serasa
const oldSerasa = `                    <select value={serasaCategory} onChange={(e) => setSerasaCategory(e.target.value)} className={\`w-full p-3 rounded-xl border \${innerInputBg} text-sm outline-none \${isDarkMode ? 'bg-[#1e2029] text-white' : 'bg-slate-100 text-slate-900'}\`}>
                      {['Cartão de Crédito', 'Telefonia', 'Energia / Água', 'Empréstimo', 'Financiamento', 'Outros'].map(cat => (
                        <option key={cat} value={cat} className={isDarkMode ? 'bg-[#16171d] text-white' : 'bg-white text-slate-900'}>{cat}</option>
                      ))}
                    </select>`;

const newSerasa = `                    <select value={serasaCategory} onChange={(e) => setSerasaCategory(e.target.value)} className={\`w-full p-3 rounded-xl border \${innerInputBg} text-sm outline-none \${isDarkMode ? 'bg-[#1e2029] text-white' : 'bg-slate-100 text-slate-900'}\`}>
                      {dynamicCategories.map(c => <option key={c.id} value={c.name} className={isDarkMode ? 'bg-[#16171d] text-white' : 'bg-white text-slate-900'}>{c.name}</option>)}
                    </select>
                    <button type="button" onClick={() => { setActiveSheet('categories'); setIsCategoryFormOpen(true); }} className="text-[10px] text-rose-500 font-bold mt-1.5 ml-1">+ Criar nova categoria</button>`;

if (content.includes("['Cartão de Crédito', 'Telefonia'")) {
  content = content.replace(oldSerasa, newSerasa);
}

// 3. Add Expense (add-keypad)
const oldKeypad = `                    <select value={calcCategory} onChange={(e) => setCalcCategory(e.target.value)} className={\`w-full p-3 rounded-xl border \${innerInputBg} text-sm outline-none \${isDarkMode ? 'bg-[#1e2029] text-white' : 'bg-slate-100 text-slate-900'}\`}>
                      {dynamicCategories.map(c => <option key={c.id} value={c.name} className={isDarkMode ? 'bg-[#16171d] text-white' : 'bg-white text-slate-900'}>{c.name}</option>)}
                    </select>
                  </div>`;

const newKeypad = `                    <select value={calcCategory} onChange={(e) => setCalcCategory(e.target.value)} className={\`w-full p-3 rounded-xl border \${innerInputBg} text-sm outline-none \${isDarkMode ? 'bg-[#1e2029] text-white' : 'bg-slate-100 text-slate-900'}\`}>
                      {dynamicCategories.map(c => <option key={c.id} value={c.name} className={isDarkMode ? 'bg-[#16171d] text-white' : 'bg-white text-slate-900'}>{c.name}</option>)}
                    </select>
                    <button type="button" onClick={() => { setActiveSheet('categories'); setIsCategoryFormOpen(true); }} className="text-[10px] text-blue-500 font-bold mt-1.5 ml-1">+ Criar nova categoria</button>
                  </div>`;

if (content.includes(oldKeypad)) {
  content = content.replace(oldKeypad, newKeypad);
}

// 4. Add Bill (add-bill)
const oldBill = `                    <select value={billCategory} onChange={(e) => setBillCategory(e.target.value)} className={\`w-full p-3 rounded-xl border \${innerInputBg} text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all\`}>
                      {dynamicCategories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>`;

const newBill = `                    <select value={billCategory} onChange={(e) => setBillCategory(e.target.value)} className={\`w-full p-3 rounded-xl border \${innerInputBg} text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all\`}>
                      {dynamicCategories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                    <button type="button" onClick={() => { setActiveSheet('categories'); setIsCategoryFormOpen(true); }} className="text-[10px] text-amber-500 font-bold mt-1.5 ml-1">+ Criar nova categoria</button>
                  </div>`;

if (content.includes(oldBill)) {
  content = content.replace(oldBill, newBill);
}

fs.writeFileSync('App.jsx', content);
console.log('Fixed categories dropdowns and added create buttons!');
