const calculateCardInstallmentDates = (purchaseDateStr, closingDay, dueDay, count, startOffset = 0) => {
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
      dates.push(`${finalYear}-${finalMonthStr}-${finalDayStr}`);
    }
    return dates;
  };

console.log("Purchase: 2026-08-13, close: 10, due: 20");
console.log(calculateCardInstallmentDates("2026-08-13", 10, 20, 1));
console.log("Purchase: 2026-08-13, close: 25, due: 20");
console.log(calculateCardInstallmentDates("2026-08-13", 25, 20, 1));
