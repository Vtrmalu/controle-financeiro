const fs = require('fs');

let appJsx = fs.readFileSync('App.jsx', 'utf8');

// 1. Fix totalPurchasingPowerPostBills
const oldPurchasingPower = `  const totalPurchasingPowerPostBills = totalPurchasingPowerRaw - nonCardPendingBillsTotal - currentMonthCardBillsTotal;`;
const newPurchasingPower = `  const totalPurchasingPowerPostBills = totalPurchasingPowerRaw - nonCardPendingBillsTotal;`;
appJsx = appJsx.replace(oldPurchasingPower, newPurchasingPower);

// 2. Fix the description text under Livre Líquido
const oldDesc = `Descontando R$ {pendingBillsTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em {pendingBills.length} boletos previstos`;
const newDesc = `Descontando R$ {nonCardPendingBillsTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em {nonCardPendingBills.length} boletos avulsos (faturas já abatem limite)`;
appJsx = appJsx.replace(oldDesc, newDesc);

// Also update the comment above totalPurchasingPowerPostBills to reflect reality
const oldComment = `// Para a Fatura do Mês: os limites dos cartões já reservam todas as parcelas (atuais e futuras) do limite do cartão.
  // Logo, para calcular o "Livre Líquido", descontamos das contas/receita APENAS os boletos normais e a fatura de cartão DO MÊS ATUAL.`;
const newComment = `// Para a Fatura do Mês: os limites dos cartões já reservam todas as parcelas do limite do cartão.
  // Pagar uma fatura reduz o saldo mas LIBERA limite no mesmo valor, então o poder de compra total (Saldo + Limites) NÃO MUDA.
  // Logo, para o "Livre Líquido", descontamos APENAS os boletos normais (não-cartão).`;
appJsx = appJsx.replace(oldComment, newComment);


fs.writeFileSync('App.jsx', appJsx, 'utf8');
console.log('Fixed livre liquido calculation!');
