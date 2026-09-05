
const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

code = code.replace(/<span className=\	ext-3xl\>\?\?<\/span>/g, '<RefreshCw className=\w-8 h-8 text-blue-500\ />');
let countXl = 0;
code = code.replace(/<span className=\	ext-xl\>\?\?<\/span>/g, () => {
    countXl++;
    if (countXl === 1) return '<Wallet className=\w-6 h-6 text-emerald-500\ />';
    return '<ShieldCheck className=\w-6 h-6 text-blue-500\ />';
});

code = code.replace(/title: \\?\? Boleto Atrasado:/g, 'title: \⚠️ Boleto Atrasado:');
code = code.replace(/title: \\?\? Fechamento da Fatura:/g, 'title: \📅 Fechamento da Fatura:');
code = code.replace(/title: \\?\? Vencimento do Cart.o:/g, 'title: \🚨 Vencimento do Cartão:');
code = code.replace(/title: \\?\? Entrada Prevista Hoje:/g, 'title: \💰 Entrada Prevista Hoje:');
code = code.replace(/title: \\?\? Alerta de Saldo Preditivo Negativo!\/g, 'title: \🚨 Alerta de Saldo Preditivo Negativo!\');
code = code.replace(/title: '\?\? Teste de Notifica.o Real'/g, 'title: \\'🔔 Teste de Notificação Real\\'');

code = code.replace(/<span className=\	ext-purple-400 font-bold\>\?\? Cart.es de Cr.dito:<\/span>/g, '<span className=\	ext-purple-400 font-bold flex items-center gap-1\><CreditCard className=\w-3 h-3\ /> Cartões de Crédito:</span>');
code = code.replace(/\? '\?\? Elevado' : overallBudgetCommitmentPct > 60 \? '\?\? Moderado' : '\? Excelente'/g, '? \\'🔴 Elevado\\' : overallBudgetCommitmentPct > 60 ? \\'🟡 Moderado\\' : \\'🟢 Excelente\\'');
code = code.replace(/<span className=\	ext-white\/70 text-\[10px\]\>\?\?<\/span>/g, '<CreditCard className=\w-3 h-3 text-white/70\ />');
code = code.replace(/>\?\? Fatura Atual</g, '>💳 Fatura Atual<');

fs.writeFileSync('src/App.jsx', code, 'utf8');
console.log('Fixed icons');
