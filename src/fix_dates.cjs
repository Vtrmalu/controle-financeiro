const fs = require('fs');

let appJsx = fs.readFileSync('App.jsx', 'utf8');

// 1. Fix calculateCardInstallmentDates
const oldCalcDates = /const calculateCardInstallmentDates = \([\s\S]*?return dates;\n  \};\n/;
const newCalcDates = `const calculateCardInstallmentDates = (purchaseDateStr, closingDay, dueDay, count, startOffset = 0) => {
    const dates = [];
    const parts = (purchaseDateStr || new Date().toISOString().split('T')[0]).split('-').map(Number);
    const pYear = parts[0];
    const pMonth = parts[1]; // 1-indexed
    const pDay = parts[2];

    const cDay = parseInt(closingDay) || 20;
    const dDay = parseInt(dueDay) || 28;

    let monthOffset = (pDay >= cDay ? 1 : 0) + startOffset;

    for (let i = 0; i < count; i++) {
      const billingMonthIndex = (pMonth - 1) + monthOffset + i;
      // If dueDay < closingDay, the actual due date falls in the month AFTER the billing cycle month
      const dueMonthOffset = dDay < cDay ? 1 : 0;
      const targetMonthIndex = billingMonthIndex + dueMonthOffset;
      
      const yearAdd = Math.floor(targetMonthIndex / 12);
      const finalYear = pYear + yearAdd;
      const finalMonthIndex = targetMonthIndex % 12;
      
      const finalMonthStr = String(finalMonthIndex + 1).padStart(2, '0');
      const finalDayStr = String(dDay).padStart(2, '0');
      dates.push(\`\${finalYear}-\${finalMonthStr}-\${finalDayStr}\`);
    }
    return dates;
  };\n`;

appJsx = appJsx.replace(oldCalcDates, newCalcDates);

// 2. Fix futureCardBills and currentMonthCardBills logic
const oldBillsLogic = `  // Separate credit card bills: current month vs future installments (both from bills - single source of truth)
  const currentMonthCardBills = pendingBills.filter(b => b.id.startsWith('b_card_'));
  const currentMonthCardBillsTotal = currentMonthCardBills.reduce((acc, curr) => acc + curr.amount, 0);
  const futureCardBills = allPendingCardBills.filter(b => !isDateInSelectedPeriod(b.dueDate));
  const futureCardBillsTotal = futureCardBills.reduce((acc, curr) => acc + curr.amount, 0);`;

const newBillsLogic = `  const isDateStrictlyFuture = (dateStr) => {
    if (!dateStr) return false;
    if (dateFilterMode === 'month') {
      const [y, m] = dateStr.split('-').map(Number);
      if (y > selectedYear) return true;
      if (y === selectedYear && (m - 1) > selectedMonthIndex) return true;
      return false;
    } else {
      return dateStr > rangeEndDate;
    }
  };

  // Separate credit card bills: current month vs future installments
  // past unpaid bills will now correctly bundle into the current month's fatura instead of being treated as future.
  const currentMonthCardBills = allPendingCardBills.filter(b => !isDateStrictlyFuture(b.dueDate));
  const currentMonthCardBillsTotal = currentMonthCardBills.reduce((acc, curr) => acc + curr.amount, 0);
  const futureCardBills = allPendingCardBills.filter(b => isDateStrictlyFuture(b.dueDate));
  const futureCardBillsTotal = futureCardBills.reduce((acc, curr) => acc + curr.amount, 0);`;

appJsx = appJsx.replace(oldBillsLogic, newBillsLogic);

fs.writeFileSync('App.jsx', appJsx, 'utf8');
console.log('Fix dates script completed successfully!');
