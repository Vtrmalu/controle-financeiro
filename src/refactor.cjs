const fs = require('fs');

let content = fs.readFileSync('App.jsx', 'utf8');

// 1. States
content = content.replace('const [expIncIsRecurring, setExpIncIsRecurring] = useState(false);', 
`const [expIncRecurrenceCount, setExpIncRecurrenceCount] = useState(1);
  const [billRecurrenceCount, setBillRecurrenceCount] = useState(1);
  const [confirmIncItem, setConfirmIncItem] = useState(null);
  const [confirmIncAmount, setConfirmIncAmount] = useState('');
  const [confirmIncUpdateFuture, setConfirmIncUpdateFuture] = useState(true);
  const [payBillUpdateFuture, setPayBillUpdateFuture] = useState(true);`);

content = content.replace('setExpIncIsRecurring(item.isRecurring || false);', 'setExpIncRecurrenceCount(1);');
content = content.replace('setExpIncIsRecurring(false);', 'setExpIncRecurrenceCount(1);');

// 3. handleSaveIncome
const oldHandleSaveInc = `  const handleSaveIncome = (e) => {
    e.preventDefault();
    if (!expIncTitle || !expIncAmount || !expIncDate) return;

    const newIncome = {
      id: editingExpIncId || \`ei_\${Date.now()}\`,
      title: expIncTitle.trim(),
      amount: parseFloat(expIncAmount.replace(/[R$\\s.]/g, '').replace(',', '.')),
      category: expIncCategory || 'Outros',
      expectedDate: expIncDate || new Date().toISOString().split('T')[0],
      isRecurring: expIncIsRecurring,
      recurrenceDay: expIncDate ? parseInt(expIncDate.split('-')[2]) : 5,
      notes: expIncNotes.trim()
    };

    if (editingExpIncId) {
      setExpectedIncomes(expectedIncomes.map(item => item.id === editingExpIncId ? { ...item, ...newIncome } : item));
    } else {
      setExpectedIncomes([...expectedIncomes, { ...newIncome, status: 'pending' }]);
    }
    closeExpIncForm();
  };`;

const newHandleSaveInc = `  const handleSaveIncome = (e) => {
    e.preventDefault();
    if (!expIncTitle || !expIncAmount || !expIncDate) return;

    const baseAmount = parseFloat(expIncAmount.replace(/[R$\\s.]/g, '').replace(',', '.'));
    const baseDate = expIncDate || new Date().toISOString().split('T')[0];
    
    if (editingExpIncId) {
      setExpectedIncomes(expectedIncomes.map(item => item.id === editingExpIncId ? {
        ...item,
        title: expIncTitle.trim(),
        amount: baseAmount,
        category: expIncCategory || 'Outros',
        expectedDate: baseDate,
        notes: expIncNotes.trim()
      } : item));
    } else {
      const groupId = expIncRecurrenceCount > 1 ? \`rec_inc_\${Date.now()}\` : null;
      const newIncomes = [];
      for (let i = 0; i < expIncRecurrenceCount; i++) {
        const dateObj = new Date(baseDate + 'T12:00:00Z');
        const d = dateObj.getUTCDate();
        dateObj.setUTCMonth(dateObj.getUTCMonth() + i);
        if (dateObj.getUTCDate() !== d) dateObj.setUTCDate(0);
        newIncomes.push({
          id: \`ei_\${Date.now()}_\${i}\`,
          groupId,
          title: expIncRecurrenceCount > 1 ? \`\${expIncTitle.trim()} (\${i+1}/\${expIncRecurrenceCount})\` : expIncTitle.trim(),
          amount: baseAmount,
          category: expIncCategory || 'Outros',
          expectedDate: dateObj.toISOString().split('T')[0],
          notes: expIncNotes.trim(),
          status: 'pending'
        });
      }
      setExpectedIncomes([...expectedIncomes, ...newIncomes]);
    }
    closeExpIncForm();
  };`;
content = content.replace(oldHandleSaveInc, newHandleSaveInc);

// 4. handleSaveBill
const oldHandleSaveBill = `      const newBill = {
        id: \`b_\${Date.now()}\`,
        title: billTitle.trim(),
        amount: parseFloat(billAmount.replace(/[R$\\s.]/g, '').replace(',', '.')),
        category: billCategory || 'Outros',
        dueDate: billDueDate || new Date().toISOString().split('T')[0],
        status: 'pending'
      };
      setBills([...bills, newBill]);`;

const newHandleSaveBill = `      const baseAmount = parseFloat(billAmount.replace(/[R$\\s.]/g, '').replace(',', '.'));
      const baseDate = billDueDate || new Date().toISOString().split('T')[0];
      const groupId = billRecurrenceCount > 1 ? \`rec_bill_\${Date.now()}\` : null;
      const newBills = [];
      for (let i = 0; i < billRecurrenceCount; i++) {
        const dateObj = new Date(baseDate + 'T12:00:00Z');
        const d = dateObj.getUTCDate();
        dateObj.setUTCMonth(dateObj.getUTCMonth() + i);
        if (dateObj.getUTCDate() !== d) dateObj.setUTCDate(0);
        newBills.push({
          id: \`b_\${Date.now()}_\${i}\`,
          groupId,
          title: billRecurrenceCount > 1 ? \`\${billTitle.trim()} (\${i+1}/\${billRecurrenceCount})\` : billTitle.trim(),
          amount: baseAmount,
          category: billCategory || 'Outros',
          dueDate: dateObj.toISOString().split('T')[0],
          status: 'pending'
        });
      }
      setBills([...bills, ...newBills]);`;
content = content.replace(oldHandleSaveBill, newHandleSaveBill);


// 5. filteredExpectedIncomes
const oldFilteredInc = `  const filteredExpectedIncomes = expectedIncomes
    .filter(ei => isDateInSelectedPeriod(ei.expectedDate) || ei.isRecurring)
    .map(ei => {
      if (ei.isRecurring) {
        const isRecReceived = ei.receivedPeriods && ei.receivedPeriods.includes(currentPeriodKey);
        const currentMonthDate = dateFilterMode === 'month'
          ? \`\${selectedYear}-\${String(selectedMonthIndex + 1).padStart(2, '0')}-\${String(ei.recurrenceDay || 5).padStart(2, '0')}\`
          : ei.expectedDate;
        
        return {
          ...ei,
          expectedDate: currentMonthDate,
          status: isRecReceived ? 'received' : 'pending'
        };
      }
      return ei;
    });`;
const newFilteredInc = `  const filteredExpectedIncomes = expectedIncomes.filter(ei => isDateInSelectedPeriod(ei.expectedDate));`;
content = content.replace(oldFilteredInc, newFilteredInc);


// 6. handleReceiveIncome
const oldHandleReceiveInc = `  const handleReceiveIncome = (item) => {
    setReceivingIncomeItem(item);
    // Open a small confirm modal or just process directly
    // Let's just process it directly to simplify flow, similar to how it was done,
    // but ensure we update the main expectedIncomes array.
    
    if (!receivingIncomeItem) return;

    if (receivingIncomeItem.isRecurring) {
      // For recurring income, add currentPeriodKey to receivedPeriods array
      setExpectedIncomes(expectedIncomes.map(ei => {
        if (ei.id === receivingIncomeItem.id) {
          const rp = ei.receivedPeriods || [];
          if (!rp.includes(currentPeriodKey)) {
            return { ...ei, receivedPeriods: [...rp, currentPeriodKey] };
          }
        }
        return ei;
      }));
    } else {
      setExpectedIncomes(expectedIncomes.map(ei => 
        ei.id === receivingIncomeItem.id ? { ...ei, status: 'received' } : ei
      ));
    }
    
    setReceivingIncomeItem(null);
  };`;

const newHandleReceiveInc = `  const handleReceiveIncome = (item) => {
    setConfirmIncItem(item);
    setConfirmIncAmount(item.amount.toString());
    setConfirmIncUpdateFuture(true);
    setActiveSheet('confirm-income');
  };

  const confirmReceiveIncome = () => {
    if (!confirmIncItem) return;
    const newAmt = parseFloat(confirmIncAmount.toString().replace(/[R$\\s.]/g, '').replace(',', '.'));
    
    const updatedIncomes = expectedIncomes.map(ei => {
      if (ei.id === confirmIncItem.id) {
        return { ...ei, amount: newAmt, status: 'received' };
      }
      if (confirmIncUpdateFuture && ei.groupId && ei.groupId === confirmIncItem.groupId && ei.expectedDate > confirmIncItem.expectedDate) {
        return { ...ei, amount: newAmt };
      }
      return ei;
    });
    setExpectedIncomes(updatedIncomes);
    setActiveSheet(null);
  };`;

content = content.replace(oldHandleReceiveInc, newHandleReceiveInc);


// 7. handleConfirmPayment Future Update
const oldConfirmPay = `    const newBills = bills.map(b => {
      if (b.id === payingBillItem.id) {
        return {
          ...b,
          status: 'paid',
          amount: parseFloat(paymentAmount),
          paymentSourceType,
          paymentAccountId: paymentSourceType === 'account' ? selectedAccountId : null,
          paymentCardId: paymentSourceType === 'credit_card' ? selectedCardId : null
        };
      }
      return b;
    });`;
const newConfirmPay = `    const pAmt = parseFloat(paymentAmount.toString().replace(/[R$\\s.]/g, '').replace(',', '.'));
    const newBills = bills.map(b => {
      if (b.id === payingBillItem.id) {
        return {
          ...b,
          status: 'paid',
          amount: pAmt,
          paymentSourceType,
          paymentAccountId: paymentSourceType === 'account' ? selectedAccountId : null,
          paymentCardId: paymentSourceType === 'credit_card' ? selectedCardId : null
        };
      }
      if (payBillUpdateFuture && b.groupId && b.groupId === payingBillItem.groupId && b.dueDate > payingBillItem.dueDate && b.status === 'pending') {
        return { ...b, amount: pAmt };
      }
      return b;
    });`;
content = content.replace(oldConfirmPay, newConfirmPay);

// Remove the inline setReceivingIncomeItem since we replaced handleReceiveIncome
content = content.replace(/setReceivingIncomeItem\\(item\\)/g, 'handleReceiveIncome(item)');

fs.writeFileSync('App.jsx', content);
console.log('Done refactoring scripts!');
