import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Sun, Moon, Plus, Calendar, DollarSign, Tag, 
  ArrowUpRight, ArrowRightLeft, ArrowDownRight, PieChart, ChevronRight, ChevronLeft,
  Check, X, Bell, Zap, Home, Utensils, Car, Film, Layers,
  Edit3, Trash2, Filter, Clock, TrendingUp, TrendingDown, BarChart2, AlertCircle,
  Sparkles, Wallet, ShieldCheck, Activity, CreditCard, ArrowRight, RefreshCw,
  ShieldAlert, CheckCircle2, Percent, AlertTriangle, FileText, LogOut, Mail, Lock
, ArrowDownCircle, ShoppingBag, Upload } from 'lucide-react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, storage } from './services/firebase';
import { 
  subscribeToCollection, 
  saveDocument, 
  removeDocument 
} from './services/firestoreSync';
import { LocalNotifications } from '@capacitor/local-notifications';

const ModernIcon = ({ icon: IconComponent, color = 'blue', size = 'md', className = '', glow = false }) => {
  const sizeClasses = {
    sm: 'w-7 h-7 rounded-lg text-xs',
    md: 'w-9 h-9 rounded-xl text-sm',
    lg: 'w-11 h-11 rounded-2xl text-base',
    xl: 'w-13 h-13 rounded-2.5xl text-lg'
  };

  const colorStyles = {
    blue: 'bg-blue-500/15 text-blue-400 border-blue-500/25 shadow-blue-500/10',
    emerald: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25 shadow-emerald-500/10',
    amber: 'bg-amber-500/15 text-amber-400 border-amber-500/25 shadow-amber-500/10',
    rose: 'bg-rose-500/15 text-rose-400 border-rose-500/25 shadow-rose-500/10',
    purple: 'bg-purple-500/15 text-purple-400 border-purple-500/25 shadow-purple-500/10',
    cyan: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/25 shadow-cyan-500/10',
    indigo: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/25 shadow-indigo-500/10',
    slate: 'bg-slate-800/80 text-slate-300 border-slate-700/60 shadow-slate-900/20'
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
    xl: 'w-6 h-6'
  };

  const selectedColor = colorStyles[color] || colorStyles.blue;
  const selectedSize = sizeClasses[size] || sizeClasses.md;
  const selectedIconSize = iconSizes[size] || iconSizes.md;

  return (
    <div className={`relative flex items-center justify-center shrink-0 border backdrop-blur-md transition-all duration-300 shadow-sm ${selectedSize} ${selectedColor} ${glow ? 'ring-2 ring-current/20' : ''} ${className}`}>
      <IconComponent className={`${selectedIconSize} stroke-[2.2] transform transition-transform group-hover:scale-110`} />
    </div>
  );
};

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateInfo, setUpdateInfo] = useState(null);
  const [viewingAttachment, setViewingAttachment] = useState(null);
  const APP_VERSION = '1.0.2';

  useEffect(() => {
    // Check for Updates on App Start
    const checkForUpdates = async () => {
      try {
        const response = await fetch('https://controle-financeiro-4b59c.web.app/version.json?t=' + new Date().getTime());
        if (response.ok) {
          const data = await response.json();
          if (data.version > APP_VERSION) {
            setUpdateInfo(data);
            setShowUpdateModal(true);
          }
        }
      } catch (error) {
        console.error('Failed to check for updates', error);
      }
    };
    setTimeout(checkForUpdates, 3000);
  }, []);

  // Scroll Observer Refs & Keys for Re-triggering Chart Animations on Scroll
  const mainScrollRef = useRef(null);
  const categoryChartRef = useRef(null);
  const lineChartRef = useRef(null);

  const [catAnimKey, setCatAnimKey] = useState(0);
  const [lineAnimKey, setLineAnimKey] = useState(0);

  useEffect(() => {
    let observer;
    const timer = setTimeout(() => {
      const observerOptions = {
        root: null,
        threshold: 0.1
      };

      observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.target === categoryChartRef.current) {
            if (entry.isIntersecting) {
              setCatAnimKey((prev) => prev + 1);
            }
          } else if (entry.target === lineChartRef.current) {
            if (entry.isIntersecting) {
              setLineAnimKey((prev) => prev + 1);
            }
          }
        });
      }, observerOptions);

      if (categoryChartRef.current) observer.observe(categoryChartRef.current);
      if (lineChartRef.current) observer.observe(lineChartRef.current);
    }, 100);

    return () => {
      clearTimeout(timer);
      if (observer) observer.disconnect();
    };
  }, []);

  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const [isMenuClosing, setIsMenuClosing] = useState(false);

  // Active Bottom Sheets / Modals
  const [activeSheet, setActiveSheet] = useState(null); // null | 'add-keypad' | 'add-bill' | 'add-income' | 'add-serasa' | 'categories' | 'notifications' | 'edit-bill' | 'month-picker'

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril',
    'Maio', 'Junho', 'Julho', 'Agosto',
    'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const todayDate = new Date();
  const currentYearNum = todayDate.getFullYear();
  const currentMonthNum = todayDate.getMonth();

  // Calendar View Month/Year State
  const [calViewMonth, setCalViewMonth] = useState(currentMonthNum);
  const [calViewYear, setCalViewYear] = useState(currentYearNum);

  // Period Mode Selection State ('month' | 'range')
  const [dateFilterMode, setDateFilterMode] = useState('month');
  const [selectedYear, setSelectedYear] = useState(currentYearNum);
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(currentMonthNum);
  const [rangeStartDate, setRangeStartDate] = useState(() => {
    const d = new Date(currentYearNum, currentMonthNum, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [rangeEndDate, setRangeEndDate] = useState(() => {
    const d = new Date(currentYearNum, currentMonthNum + 1, 0);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });

  // Firebase Authentication State
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Migration: Auto-purge old mock dummy data from user's browser localStorage cache
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.localStorage.getItem('bazil_clean_v3')) {
      const keysToClean = ['transactions', 'bills', 'notifications', 'accounts', 'creditCards', 'expectedIncomes', 'serasaDebts'];
      keysToClean.forEach(k => window.localStorage.removeItem(k));
      window.localStorage.setItem('bazil_clean_v3', 'true');
      window.location.reload();
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleExecuteTransfer = () => {
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
      id: `t_${Date.now()}`,
      type: 'transfer',
      amount: numAmount,
      category: 'Transferência',
      title: `De ${sourceAcc.name} para ${destAcc.name}`,
      date: new Date().toISOString().split('T')[0],
      source: 'Transferência'
    }]);

    setActiveSheet(null);
    setTransferAmount('');
    setTransferSourceId('');
    setTransferDestId('');
  };

    const handleLogin = async (e) => {
    e?.preventDefault();
    if (!authEmail.trim() || !authPassword) return;
    setAuthError('');
    setAuthLoading(true);
    try {
      await signInWithEmailAndPassword(auth, authEmail.trim(), authPassword);
      setAuthLoading(false);
    } catch (err) {
      setAuthLoading(false);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setAuthError('E-mail ou senha incorretos.');
      } else if (err.code === 'auth/invalid-email') {
        setAuthError('Endereço de e-mail inválido.');
      } else {
        setAuthError('Erro ao entrar. Verifique os dados e tente novamente.');
      }
    }
  };

  const handleRegister = async (e) => {
    e?.preventDefault();
    if (!authEmail.trim() || !authPassword) return;
    setAuthError('');
    setAuthLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, authEmail.trim(), authPassword);
      setAuthLoading(false);
    } catch (err) {
      setAuthLoading(false);
      if (err.code === 'auth/email-already-in-use') {
        setAuthError('Este e-mail já está cadastrado.');
      } else if (err.code === 'auth/weak-password') {
        setAuthError('A senha deve ter pelo menos 6 caracteres.');
      } else {
        setAuthError('Erro ao criar conta. Tente novamente.');
      }
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  const [rangeSelecting, setRangeSelecting] = useState('start');

  // Selected Bill State for Swiping & Editing
  const [selectedBill, setSelectedBill] = useState(null);
  const [editBillFile, setEditBillFile] = useState(null);
  const [editBillUploading, setEditBillUploading] = useState(false);
  const [billToPay, setBillToPay] = useState(null);
  const [payBillAmount, setPayBillAmount] = useState('');
  const [swipedBillId, setSwipedBillId] = useState(null);
  const [showAllBillsInline, setShowAllBillsInline] = useState(false);
  const [billSearchQuery, setBillSearchQuery] = useState('');
  const [billStatusFilter, setBillStatusFilter] = useState('all'); // 'all' | 'pending' | 'paid' | 'serasa'
  const [billPeriodMode, setBillPeriodMode] = useState('current'); // 'current' | 'all_time'
  const [serasaSearchQuery, setSerasaSearchQuery] = useState('');
  const [serasaFilterStatus, setSerasaFilterStatus] = useState('all'); // 'all' | 'negativado' | 'em_acordo' | 'quitado'

  // Active Category & Multi-Stage Transition State
  const [activeCategory, setActiveCategory] = useState(null);
  const [pendingCategory, setPendingCategory] = useState(null);
  const [animStage, setAnimStage] = useState('idle'); // 'idle' | 'recoiling' | 'active' | 'returning'

  // Line Chart Comparison State
  const [compChartPeriod, setCompChartPeriod] = useState('6M');
  const [hoveredPointIndex, setHoveredPointIndex] = useState(null);

  // Keypad Calculator Input State
  const [calcValue, setCalcValue] = useState('0');
  const [calcCategory, setCalcCategory] = useState('Alimentação');
  const [calcLocation, setCalcLocation] = useState('');
  const [calcDate, setCalcDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [calcValidationError, setCalcValidationError] = useState('');

  // Bill Scheduling Form State
  const [billName, setBillName] = useState('');
  const [billAmount, setBillAmount] = useState('');
  const [billDueDate, setBillDueDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [billCategory, setBillCategory] = useState('Moradia');
  const [billFile, setBillFile] = useState(null);
  const [billUploading, setBillUploading] = useState(false);

  // Income Form State
  const [incomeTargetAccId, setIncomeTargetAccId] = useState('');
  const [incomeDesc, setIncomeDesc] = useState('');
  const [incomeAmount, setIncomeAmount] = useState('');
  const [incomeTotal, setIncomeTotal] = useState(5800.00);

  const [categories, setCategoriesState] = useLocalStorage('categories', [
    { id: '1', name: 'Moradia', color: '#3b82f6', icon: Home, baseAllocated: 0 },
    { id: '2', name: 'Alimentação', color: '#10b981', icon: Utensils, baseAllocated: 0 },
    { id: '3', name: 'Transporte', color: '#f59e0b', icon: Car, baseAllocated: 0 },
    { id: '4', name: 'Lazer', color: '#ec4899', icon: Film, baseAllocated: 0 },
    { id: '6', name: 'Previstos', color: '#14b8a6', icon: Calendar, baseAllocated: 0 },
    { id: '7', name: 'Dívidas Serasa', color: '#f97316', icon: ShieldAlert, baseAllocated: 0 },
    { id: '5', name: 'Outros', color: '#8b5cf6', icon: Layers, baseAllocated: 0 },
  ]);

  const colorPalette = [
    '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', 
    '#ef4444', '#06b6d4', '#14b8a6', '#f97316', '#64748b'
  ];

  // Category CRUD Form State
  const [isCategoryFormOpen, setIsCategoryFormOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [catFormName, setCatFormName] = useState('');
  const [catFormColor, setCatFormColor] = useState('#3b82f6');
  const [catFormAllocated, setCatFormAllocated] = useState('');
  const [confirmDeleteCatId, setConfirmDeleteCatId] = useState(null);

  const [transactions, setTransactionsState] = useLocalStorage('transactions', []);
  const [bills, setBillsState] = useLocalStorage('bills', []);
  const [notifications, setNotifications] = useLocalStorage('notifications', []);
  const [accounts, setAccountsState] = useLocalStorage('accounts', [
    { id: 'acc1', name: 'Conta Principal', type: 'conta_corrente', balance: 0.00, color: '#3b82f6' }
  ]);
  const [creditCards, setCreditCardsState] = useLocalStorage('creditCards', []);
  const [serasaDebts, setSerasaDebtsState] = useLocalStorage('serasaDebts', []);
  const [expectedIncomes, setExpectedIncomesState] = useLocalStorage('expectedIncomes', []);

  useEffect(() => {
    if (activeSheet !== 'add-keypad') return;

    setCalcValue('0');
    setCalcCategory('Alimentação');
    setCalcLocation('');
    setCalcDate(new Date().toISOString().split('T')[0]);
    setCalcValidationError('');
    setCalcInstallments(1);
    setCalcCardTargetPeriod('current_invoice');
    setPaymentSourceType('account');
    if (accounts.length > 0) setSelectedAccountId(accounts[0].id);
    if (creditCards.length > 0) setSelectedCardId(creditCards[0].id);
  }, [activeSheet, accounts, creditCards]);

  // Real-time Firestore DB listeners for multi-device family synchronization
  useEffect(() => {
    if (!user) return;
    const unsubCat = subscribeToCollection('categories', (items) => {
      if (items.length > 0) setCategoriesState(items);
    });
    const unsubTx = subscribeToCollection('transactions', (items) => setTransactionsState(items));
    const unsubBills = subscribeToCollection('bills', (items) => setBillsState(items));
    const unsubAcc = subscribeToCollection('accounts', (items) => {
      if (items.length > 0) setAccountsState(items);
    });
    const unsubCards = subscribeToCollection('creditCards', (items) => setCreditCardsState(items));
    const unsubIncomes = subscribeToCollection('expectedIncomes', (items) => setExpectedIncomesState(items));
    const unsubSerasa = subscribeToCollection('serasaDebts', (items) => setSerasaDebtsState(items));

    return () => {
      unsubCat();
      unsubTx();
      unsubBills();
      unsubAcc();
      unsubCards();
      unsubIncomes();
      unsubSerasa();
    };
  }, [user]);

  // Sync Wrappers for Real-time Firestore Writes & Local State (WITH AUTOMATIC DELETION REMOVAL)
  const setCategories = (val) => {
    const nextVal = typeof val === 'function' ? val(categories) : val;
    const removedIds = categories.filter(prev => !nextVal.some(next => next.id === prev.id)).map(c => c.id);
    removedIds.forEach(id => removeDocument('categories', id));
    setCategoriesState(nextVal);
    nextVal.forEach(item => saveDocument('categories', item.id, item));
  };

  const setTransactions = (val) => {
    const nextVal = typeof val === 'function' ? val(transactions) : val;
    const normalizedNextVal = Array.isArray(nextVal) ? nextVal.map(normalizeMoneyRecord) : nextVal;
    const removedIds = transactions.filter(prev => !normalizedNextVal.some(next => next.id === prev.id)).map(t => t.id);
    removedIds.forEach(id => removeDocument('transactions', id));
    setTransactionsState(normalizedNextVal);
    normalizedNextVal.forEach(item => saveDocument('transactions', item.id, normalizeMoneyRecord(item)));
  };

  const setBills = (val) => {
    const nextVal = typeof val === 'function' ? val(bills) : val;
    const normalizedNextVal = Array.isArray(nextVal) ? nextVal.map(normalizeMoneyRecord) : nextVal;
    const removedIds = bills.filter(prev => !normalizedNextVal.some(next => next.id === prev.id)).map(b => b.id);
    removedIds.forEach(id => removeDocument('bills', id));
    setBillsState(normalizedNextVal);
    normalizedNextVal.forEach(item => saveDocument('bills', item.id, normalizeMoneyRecord(item)));
  };

  const setAccounts = (val) => {
    const nextVal = typeof val === 'function' ? val(accounts) : val;
    const normalizedNextVal = Array.isArray(nextVal) ? nextVal.map(normalizeMoneyRecord) : nextVal;
    const removedIds = accounts.filter(prev => !normalizedNextVal.some(next => next.id === prev.id)).map(a => a.id);
    removedIds.forEach(id => removeDocument('accounts', id));
    setAccountsState(normalizedNextVal);
    normalizedNextVal.forEach(item => saveDocument('accounts', item.id, normalizeMoneyRecord(item)));
  };

  const setCreditCards = (val) => {
    const nextVal = typeof val === 'function' ? val(creditCards) : val;
    const normalizedNextVal = Array.isArray(nextVal) ? nextVal.map(normalizeMoneyRecord) : nextVal;
    const removedIds = creditCards.filter(prev => !normalizedNextVal.some(next => next.id === prev.id)).map(c => c.id);
    removedIds.forEach(id => removeDocument('creditCards', id));
    setCreditCardsState(normalizedNextVal);
    normalizedNextVal.forEach(item => saveDocument('creditCards', item.id, normalizeMoneyRecord(item)));
  };

  const setExpectedIncomes = (val) => {
    const nextVal = typeof val === 'function' ? val(expectedIncomes) : val;
    const normalizedNextVal = Array.isArray(nextVal) ? nextVal.map(normalizeMoneyRecord) : nextVal;
    const removedIds = expectedIncomes.filter(prev => !normalizedNextVal.some(next => next.id === prev.id)).map(e => e.id);
    removedIds.forEach(id => removeDocument('expectedIncomes', id));
    setExpectedIncomesState(normalizedNextVal);
    normalizedNextVal.forEach(item => saveDocument('expectedIncomes', item.id, normalizeMoneyRecord(item)));
  };

  const setSerasaDebts = (val) => {
    const nextVal = typeof val === 'function' ? val(serasaDebts) : val;
    const normalizedNextVal = Array.isArray(nextVal) ? nextVal.map(normalizeMoneyRecord) : nextVal;
    const removedIds = serasaDebts.filter(prev => !normalizedNextVal.some(next => next.id === prev.id)).map(d => d.id);
    removedIds.forEach(id => removeDocument('serasaDebts', id));
    setSerasaDebtsState(normalizedNextVal);
    normalizedNextVal.forEach(item => saveDocument('serasaDebts', item.id, normalizeMoneyRecord(item)));
  };

  // Payment Source & Installments Selection for Expenses
  const [paymentSourceType, setPaymentSourceType] = useState('account'); // 'account' | 'credit_card'
  const [selectedAccountId, setSelectedAccountId] = useState('acc1');
  const [selectedCardId, setSelectedCardId] = useState('card1');
  const [calcInstallments, setCalcInstallments] = useState(1);
  const [calcCardTargetPeriod, setCalcCardTargetPeriod] = useState('current_invoice'); // 'current_invoice' | 'next_invoice'

  // Account / Credit Card Management Form State
  const [accountsTab, setAccountsTab] = useState('accounts'); // 'accounts' | 'cards'
  const [isAccFormOpen, setIsAccFormOpen] = useState(false);
  const [editingAccId, setEditingAccId] = useState(null);
  const [accName, setAccName] = useState('');
  const [accType, setAccType] = useState('conta_corrente');
  const [accBalance, setAccBalance] = useState('');
  const [accOverdraft, setAccOverdraft] = useState('');
  const [accColor, setAccColor] = useState('#3b82f6');

  const [isCardFormOpen, setIsCardFormOpen] = useState(false);
  const [editingCardId, setEditingCardId] = useState(null);
  const [cardName, setCardName] = useState('');
  const [cardTotalLimit, setCardTotalLimit] = useState('');
  const [cardClosingDay, setCardClosingDay] = useState('20');
  const [cardDueDay, setCardDueDay] = useState('28');
  const [cardColor, setCardColor] = useState('#8b5cf6');

  // Serasa State & Agreement Negotiation State
  const [serasaCreditor, setSerasaCreditor] = useState('');
  const [serasaOriginalAmount, setSerasaOriginalAmount] = useState('');
  const [serasaCategory, setSerasaCategory] = useState('Cartão de Crédito');
  const [serasaDueDate, setSerasaDueDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Negotiation Modal State
  const [negotiatingDebt, setNegotiatingDebt] = useState(null);
  const [agreementOfferAmount, setAgreementOfferAmount] = useState('');
  const [agreementInstallments, setAgreementInstallments] = useState('1');
  const [agreementDueDate, setAgreementDueDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [agreementPaymentMethod, setAgreementPaymentMethod] = useState('Boleto');

  // Expected Income Form State
  const [editingExpIncomeId, setEditingExpIncomeId] = useState(null);
  const [expIncTitle, setExpIncTitle] = useState('');
  const [expIncAmount, setExpIncAmount] = useState('');
  const [expIncCategory, setExpIncCategory] = useState('Vendas');
  const [expIncDate, setExpIncDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [expIncIsRecurring, setExpIncIsRecurring] = useState(false);
  const [expIncRecurrenceCount, setExpIncRecurrenceCount] = useState(1);
  const [billRecurrenceCount, setBillRecurrenceCount] = useState(1);
  const [confirmIncItem, setConfirmIncItem] = useState(null);
  const [confirmIncAmount, setConfirmIncAmount] = useState('');
  const [confirmIncUpdateFuture, setConfirmIncUpdateFuture] = useState(true);
  const [payBillUpdateFuture, setPayBillUpdateFuture] = useState(true);
  const [payBillSourceType, setPayBillSourceType] = useState('account');
  const [payBillSelectedAccountId, setPayBillSelectedAccountId] = useState('acc1');
  const [payBillSelectedCardId, setPayBillSelectedCardId] = useState('card1');
  const [payBillInstallments, setPayBillInstallments] = useState('1');
  const [payBillError, setPayBillError] = useState('');
  
  const [transferSourceId, setTransferSourceId] = useState('');
  const [transferDestId, setTransferDestId] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferError, setTransferError] = useState('');
  const [expIncNotes, setExpIncNotes] = useState('');
  const [expIncSearchQuery, setExpIncSearchQuery] = useState('');
  const [expIncFilterStatus, setExpIncFilterStatus] = useState('all'); // 'all' | 'pending' | 'received' | 'recurring'


  // Auto-add missing categories if they don't exist in local storage yet
  useEffect(() => {
    setCategories(prev => {
      let updated = [...prev];
      let changed = false;
      if (!updated.find(c => c.name === 'Previstos')) {
        updated.push({ id: 'cat_prev', name: 'Previstos', color: '#14b8a6', icon: Calendar, baseAllocated: 0 });
        changed = true;
      }
      if (!updated.find(c => c.name === 'Dívidas Serasa')) {
        updated.push({ id: 'cat_serasa', name: 'Dívidas Serasa', color: '#f97316', icon: ShieldAlert, baseAllocated: 0 });
        changed = true;
      }
      return changed ? updated : prev;
    });
  }, []);

  // Confirm Deposit Modal State
  const [receivingIncomeItem, setReceivingIncomeItem] = useState(null);
  const [receiveTargetAccountId, setReceiveTargetAccountId] = useState('acc1');

  // Notifications System State
  const [readNotifIds, setReadNotifIds] = useLocalStorage('readNotifIds', []);
  const [pushedNotifIds, setPushedNotifIds] = useLocalStorage('pushedNotifIds', []);
  const [notifFilterTab, setNotifFilterTab] = useState('all'); // 'all' | 'unread' | 'bills' | 'cards' | 'incomes' | 'health' | 'serasa'

  // Serasa Calculations
  const activeSerasaDebts = serasaDebts.filter(d => d.status !== 'quitado');
  const totalSerasaOriginal = activeSerasaDebts.reduce((sum, d) => sum + d.originalAmount, 0);
  const totalSerasaOffers = activeSerasaDebts.reduce((sum, d) => sum + d.offerAmount, 0);
  const totalSerasaSavings = totalSerasaOriginal - totalSerasaOffers;
  const totalScoreBoostPotential = activeSerasaDebts.reduce((sum, d) => sum + d.scoreBoost, 0);

  // Accounts & Credit Card Totals
  const totalBankBalance = accounts.reduce((acc, a) => acc + a.balance, 0);
  const totalOverdraftLimit = accounts.reduce((acc, a) => acc + (a.overdraftLimit || 0), 0);
  const totalCreditLimit = creditCards.reduce((acc, c) => acc + c.totalLimit, 0);
  // Compute credit used dynamically from ALL pending b_card_ bills (source of truth • auto-reflects edits/deletions)
  const allPendingCardBills = bills.filter(b => b.status === 'pending' && b.id.startsWith('b_card_'));
  const totalCreditUsed = allPendingCardBills.reduce((acc, b) => acc + b.amount, 0);
  const totalCreditAvailable = Math.max(0, totalCreditLimit - totalCreditUsed);
  const creditLimitPercent = Math.min(100, Math.round((totalCreditUsed / (totalCreditLimit || 1)) * 100));

  // Helper: safely parse localized money input (`276,68` and `276.68`) without truncation
  const parseLocalizedNumber = (value) => {
    if (value === null || value === undefined || value === '') return 0;
    const s = String(value).trim().replace(/\s+/g, '');
    if (!s) return 0;

    const normalized = s.includes(',') && s.includes('.')
      ? s.replace(/\./g, '').replace(',', '.')
      : s.replace(',', '.');

    const parsed = Number.parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const normalizeMoneyRecord = (item) => {
    if (!item || typeof item !== 'object') return item;

    const normalized = { ...item };
    const moneyFields = [
      'amount',
      'balance',
      'overdraftLimit',
      'totalLimit',
      'usedLimit',
      'originalAmount',
      'offerAmount',
      'monthlyInstallment',
      'monthlyVal',
      'baseAllocated'
    ];

    moneyFields.forEach(field => {
      if (normalized[field] !== undefined && normalized[field] !== null) {
        normalized[field] = parseLocalizedNumber(normalized[field]);
      }
    });

    return normalized;
  };

  // Helper: compute used limit for a specific card from bills (for per-card display)
  const getCardUsedFromBills = (cardName) =>
    allPendingCardBills
      .filter(b => b.title.includes(`[Fatura ${cardName}]`))
      .reduce((acc, b) => acc + b.amount, 0);

  const extractCardNameFromBillTitle = (title) => {
    const titleMatch = title?.match(/^\[Fatura (.+?)\]/);
    return titleMatch ? titleMatch[1] : null;
  };

  const adjustCardUsedLimit = (cardName, delta) => {
    if (!cardName) return;
    setCreditCards(prev => prev.map(c =>
      c.name === cardName ? { ...c, usedLimit: Math.max(0, c.usedLimit + delta) } : c
    ));
  };

  // Helper: Calculate Credit Card Installment Due Dates based on closingDay and dueDay
  const calculateCardInstallmentDates = (purchaseDateStr, closingDay, dueDay, count, startOffset = 0) => {
    const dates = [];
    const parts = (purchaseDateStr || new Date().toISOString().split('T')[0]).split('-').map(Number);
    const pYear = parts[0];
    const pMonth = parts[1]; // 1-indexed
    const pDay = parts[2];

    const cDay = parseInt(closingDay) || 20;
    const dDay = parseInt(dueDay) || 28;

    // If purchase day > closing day, invoice closes next month
    let monthOffset = (pDay > cDay ? 1 : 0) + startOffset;

    for (let i = 0; i < count; i++) {
      const targetMonthIndex = (pMonth - 1) + monthOffset + i;
      const yearAdd = Math.floor(targetMonthIndex / 12);
      const finalYear = pYear + yearAdd;
      const finalMonthIndex = targetMonthIndex % 12;
      const finalMonthStr = String(finalMonthIndex + 1).padStart(2, '0');
      const finalDayStr = String(dDay).padStart(2, '0');
      dates.push(`${finalYear}-${finalMonthStr}-${finalDayStr}`);
    }
    return dates;
  };

  // Helper: Automatically generate installment bills when an agreement is initiated
  const generateInstallmentBillsForDebt = (debt) => {
    const installmentsCount = debt.plannedInstallments || 1;
    const monthlyVal = debt.monthlyInstallment || (debt.offerAmount / installmentsCount);
    const methodTag = debt.paymentMethod === 'Cartão' ? 'Cartão' : 'Boleto';

    const generatedBills = [];
    const baseDateParts = (debt.dueDate || '2026-08-10').split('-').map(Number);
    let startYear = baseDateParts[0];
    let startMonth = baseDateParts[1] - 1; // 0-indexed
    let startDay = baseDateParts[2];

    for (let i = 1; i <= installmentsCount; i++) {
      const currentMonthIndex = (startMonth + (i - 1)) % 12;
      const yearOffset = Math.floor((startMonth + (i - 1)) / 12);
      const currentYear = startYear + yearOffset;
      const monthFormatted = String(currentMonthIndex + 1).padStart(2, '0');
      const dayFormatted = String(startDay).padStart(2, '0');
      const dueDateStr = `${currentYear}-${monthFormatted}-${dayFormatted}`;

      generatedBills.push({
        id: `b_serasa_${debt.id}_${i}`,
        title: `Acordo ${debt.creditor} (${i}/${installmentsCount}) [${methodTag}]`,
        category: 'Outros',
        dueDate: dueDateStr,
        amount: monthlyVal,
        status: 'pending',
        urgent: i === 1
      });
    }

    return generatedBills;
  };

  const handleSaveSerasaDebt = () => {
    if (!serasaCreditor.trim() || !serasaOriginalAmount) return;

    const orig = parseLocalizedNumber(serasaOriginalAmount);

    const newDebt = {
      id: `sd_${Date.now()}`,
      creditor: serasaCreditor.trim(),
      originalAmount: orig,
      offerAmount: orig,
      discountPercent: 0,
      status: 'negativado', // Cadastra como Dívida Ativa
      dueDate: serasaDueDate || new Date().toISOString().split('T')[0],
      category: serasaCategory || 'Outros',
      scoreBoost: Math.min(100, Math.round(orig / 80)),
      plannedInstallments: 1,
      monthlyInstallment: orig,
      paymentMethod: 'Boleto'
    };

    setSerasaDebts([newDebt, ...serasaDebts]);
    setSerasaCreditor('');
    setSerasaOriginalAmount('');
    setActiveSheet(null);
  };

  const handleOpenNegotiateModal = (debt) => {
    setNegotiatingDebt(debt);
    setAgreementOfferAmount(debt.offerAmount ? debt.offerAmount.toString() : debt.originalAmount.toString());
    setAgreementInstallments(debt.plannedInstallments ? debt.plannedInstallments.toString() : '1');
    setAgreementDueDate(debt.dueDate || new Date().toISOString().split('T')[0]);
    setAgreementPaymentMethod(debt.paymentMethod || 'Boleto');
    setActiveSheet('negotiate-serasa');
  };

  const handleConfirmPayBill = () => {
    setPayBillError('');
    if (!billToPay) return;
    const finalAmount = parseLocalizedNumber(payBillAmount);
    if (!finalAmount || finalAmount <= 0) return;

    let sourceName = 'Manual';

    if (payBillSourceType === 'account') {
      const acc = accounts.find(a => a.id === payBillSelectedAccountId) || accounts[0];
      sourceName = acc ? acc.name : 'Conta';
      if (acc) {
        const accLiquidity = acc.balance + (acc.overdraftLimit || 0);
        if (accLiquidity < finalAmount) {
          setPayBillError('Saldo insuficiente nesta conta.');
          return;
        }
        setAccounts(accounts.map(a => a.id === acc.id ? { ...a, balance: a.balance - finalAmount } : a));
      }
    } else if (payBillSourceType === 'credit_card') {
      const card = creditCards.find(c => c.id === payBillSelectedCardId) || creditCards[0];
      sourceName = card ? card.name : 'Fonte de Crédito (Cartão/Outros)';
      const instCount = parseInt(payBillInstallments) || 1;
      
      if (card) {
        const nextUsedLimit = getCardUsedFromBills(card.name) + finalAmount;
        if (nextUsedLimit > (card.totalLimit || 0)) {
          alert('Limite do cartão insuficiente para pagar este boleto.');
          return;
        }

        const dueDates = calculateCardInstallmentDates(new Date().toISOString().split('T')[0], card.closingDay, card.dueDay, instCount, 0);
        const generatedBills = dueDates.map((dInfo, idx) => ({
          id: `b_card_${Date.now()}_${idx}`,
          title: `Fatura: Pgto ${billToPay.title} (${idx + 1}/${instCount}) - ${card.name}`,
          category: billToPay.category,
          dueDate: dInfo,
          amount: finalAmount / instCount,
          status: 'pending',
          urgent: false,
          createdBy: user?.displayName || user?.email?.split('@')[0] || 'Desconhecido',
          owner: user?.displayName || user?.email?.split('@')[0] || 'Desconhecido'
        }));

        setBills(prev => [...prev, ...generatedBills]);
      }
    }

    setTransactions(prev => [...prev, {
      id: `t_${Date.now()}`,
      type: 'expense',
      amount: finalAmount,
      category: billToPay.category,
      title: `Pagamento: ${billToPay.title}`,
      date: new Date().toISOString().split('T')[0],
      source: sourceName,
      sourceType: payBillSourceType,
      createdBy: user?.displayName || user?.email?.split('@')[0] || 'Desconhecido',
      owner: user?.displayName || user?.email?.split('@')[0] || 'Desconhecido'
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

  const handleConfirmSerasaAgreement = () => {
    if (!negotiatingDebt) return;
    const offer = parseLocalizedNumber(agreementOfferAmount) || negotiatingDebt.originalAmount;
    const instCount = parseInt(agreementInstallments) || 1;
    const orig = negotiatingDebt.originalAmount;
    const discPct = orig > 0 ? Math.max(0, Math.round(((orig - offer) / orig) * 100)) : 0;
    const monthlyVal = offer / instCount;

    const updatedDebt = {
      ...negotiatingDebt,
      offerAmount: offer,
      discountPercent: discPct,
      plannedInstallments: instCount,
      monthlyInstallment: monthlyVal,
      paymentMethod: agreementPaymentMethod,
      dueDate: agreementDueDate,
      status: 'em_acordo'
    };

    setSerasaDebts(serasaDebts.map(d => d.id === negotiatingDebt.id ? updatedDebt : d));
    
    // Automatically generate installment bills in Agenda de Boletos
    const generatedBills = generateInstallmentBillsForDebt(updatedDebt);
    setBills(prev => [...prev, ...generatedBills]);

    setNegotiatingDebt(null);
    setActiveSheet(null);
  };

  const handleToggleSerasaStatus = (id, newStatus) => {
    const debtToUpdate = serasaDebts.find(d => d.id === id);
    if (debtToUpdate && newStatus === 'em_acordo') {
      generateInstallmentBillsForDebt(debtToUpdate);
    }
    setSerasaDebts(serasaDebts.map(d => d.id === id ? { ...d, status: newStatus } : d));
  };

  // Handlers for Expected Incomes
  const handleOpenEditExpectedIncome = (item) => {
    setEditingExpIncomeId(item.id);
    setExpIncTitle(item.title || '');
    setExpIncAmount(item.amount ? item.amount.toString() : '');
    setExpIncCategory(item.category || 'Outros');
    setExpIncDate(item.expectedDate || new Date().toISOString().split('T')[0]);
    setExpIncIsRecurring(!!item.isRecurring);
    setExpIncRecurrenceCount(1);
    setExpIncNotes(item.notes || '');
    setActiveSheet('add-expected-income');
  };

  const handleSaveExpectedIncome = () => {
    if (!expIncTitle.trim() || !expIncAmount) return;
    const numAmount = parseLocalizedNumber(expIncAmount);

    if (editingExpIncomeId) {
      setExpectedIncomes(expectedIncomes.map(ei => ei.id === editingExpIncomeId ? {
        ...ei,
        title: expIncTitle.trim(),
        amount: numAmount,
        category: expIncCategory || 'Outros',
        expectedDate: expIncDate || new Date().toISOString().split('T')[0],
        isRecurring: expIncIsRecurring,
        recurrenceDay: expIncDate ? parseInt(expIncDate.split('-')[2]) : 5,
        notes: expIncNotes.trim()
      } : ei));
    } else {
      const newExpIncome = {
        id: `ei_${Date.now()}`,
        title: expIncTitle.trim(),
        amount: numAmount,
        category: expIncCategory || 'Outros',
        expectedDate: expIncDate || new Date().toISOString().split('T')[0],
        isRecurring: expIncIsRecurring,
        recurrenceDay: expIncDate ? parseInt(expIncDate.split('-')[2]) : 5,
        targetAccountId: null,
        status: 'pending',
        notes: expIncNotes.trim(),
        createdBy: user?.displayName || user?.email?.split('@')[0] || 'Desconhecido',
        owner: user?.displayName || user?.email?.split('@')[0] || 'Desconhecido'
      };
      setExpectedIncomes([newExpIncome, ...expectedIncomes]);
    }

    setExpIncTitle('');
    setExpIncAmount('');
    setExpIncNotes('');
    setEditingExpIncomeId(null);
    setActiveSheet(null);
  };

  const handleOpenReceiveModal = (item) => {
    setReceivingIncomeItem(item);
    setReceiveTargetAccountId(accounts[0]?.id || 'acc1');
    setActiveSheet('confirm-receive-income');
  };

  const currentPeriodKey = dateFilterMode === 'month' 
    ? `${selectedYear}-${String(selectedMonthIndex + 1).padStart(2, '0')}`
    : `${rangeStartDate.slice(0,7)}`;

  const handleExecuteReceiveIncome = () => {
    if (!receivingIncomeItem) return;

    if (receivingIncomeItem.isRecurring) {
      // For recurring income, add currentPeriodKey to receivedPeriods array
      setExpectedIncomes(expectedIncomes.map(ei => {
        if (ei.id === receivingIncomeItem.id) {
          const currentRecs = ei.receivedPeriods || [];
          if (!currentRecs.includes(currentPeriodKey)) {
            return {
              ...ei,
              receivedPeriods: [...currentRecs, currentPeriodKey]
            };
          }
        }
        return ei;
      }));
    } else {
      // For one-time income, mark status as 'received'
      setExpectedIncomes(expectedIncomes.map(ei => ei.id === receivingIncomeItem.id ? { ...ei, status: 'received', targetAccountId: receiveTargetAccountId } : ei));
    }

    // 2. Credit Bank Account
    const acc = accounts.find(a => a.id === receiveTargetAccountId) || accounts[0];
    if (acc) {
      setAccounts(accounts.map(a => a.id === acc.id ? { ...a, balance: a.balance + receivingIncomeItem.amount } : a));
    }

    // 3. Create completed Income transaction
    const newTx = {
      id: `t_inc_${Date.now()}`,
      title: receivingIncomeItem.title,
      category: receivingIncomeItem.category,
      date: receivingIncomeItem.isRecurring 
        ? `${selectedYear}-${String(selectedMonthIndex + 1).padStart(2, '0')}-${String(receivingIncomeItem.recurrenceDay || 5).padStart(2, '0')}`
        : (receivingIncomeItem.expectedDate || new Date().toISOString().split('T')[0]),
      dayGroup: 'Receita Confirmada',
      amount: receivingIncomeItem.amount,
      type: 'income',
      status: 'completed',
      location: acc ? acc.name : 'Conta Bancária',
      sourceType: 'account',
      createdBy: user?.displayName || user?.email?.split('@')[0] || 'Desconhecido',
      owner: receivingIncomeItem.owner || user?.displayName || user?.email?.split('@')[0] || 'Desconhecido'
    };

    setTransactions([newTx, ...transactions]);
    setReceivingIncomeItem(null);
    setActiveSheet(null);
  };

  const handleDeleteExpectedIncome = (expIncomeId) => {
    setExpectedIncomes(expectedIncomes.filter(ei => ei.id !== expIncomeId));
    removeDocument('expectedIncomes', expIncomeId);
  };

  const handleDeleteTransactionInline = (txId, e) => {
    if (e) e.stopPropagation();
    const tx = transactions.find(t => t.id === txId);
    if (!tx) return;

    if (tx.type === 'expense') {
      if (tx.sourceType === 'account') {
        setAccounts(accounts.map(a => a.name === tx.location || a.id === tx.accountId ? { ...a, balance: a.balance + tx.amount } : a));
      } else if (tx.sourceType === 'credit_card') {
        const card = creditCards.find(c => c.id === tx.cardId || c.name === tx.location);
        if (card) {
          setCreditCards(creditCards.map(c => c.id === card.id ? { ...c, usedLimit: Math.max(0, c.usedLimit - tx.amount) } : c));
        }
      }
    } else if (tx.type === 'income') {
      if (tx.sourceType === 'account') {
        setAccounts(accounts.map(a => a.name === tx.location || a.id === tx.accountId ? { ...a, balance: a.balance - tx.amount } : a));
      }
    }

    setTransactions(transactions.filter(t => t.id !== txId));
    removeDocument('transactions', txId);
  };

  const getComparisonData = () => {
    const months = [];
    const count = compChartPeriod === '3M' ? 3 : (compChartPeriod === '12M' ? 12 : 6);
    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(selectedYear, selectedMonthIndex - i, 1);
      const y = d.getFullYear();
      const m = d.getMonth();
      const monthKey = `${y}-${String(m + 1).padStart(2, '0')}`;
      const label = monthNames[m].slice(0, 3);

      const mTx = transactions.filter(t => t.date && t.date.startsWith(monthKey));
      const income = mTx.filter(t => t.type === 'income').reduce((acc, t) => acc + (t.amount || 0), 0);
      const expense = mTx.filter(t => t.type === 'expense').reduce((acc, t) => acc + (t.amount || 0), 0);

      months.push({ label, income, expense });
    }
    return months;
  };

  const comparisonData = getComparisonData();
  const totalPeriodIncome = comparisonData.reduce((acc, d) => acc + d.income, 0);
  const totalPeriodExpense = comparisonData.reduce((acc, d) => acc + d.expense, 0);
  const netMargin = totalPeriodIncome - totalPeriodExpense;

  const isDateInSelectedPeriod = (dateStr) => {
    if (!dateStr) return false;
    if (dateFilterMode === 'month') {
      const [y, m] = dateStr.split('-').map(Number);
      return y === selectedYear && (m - 1) === selectedMonthIndex;
    } else {
      return dateStr >= rangeStartDate && dateStr <= rangeEndDate;
    }
  };

  const filteredTransactions = transactions.filter(t => isDateInSelectedPeriod(t.date));
  const filteredBills = bills.filter(b => isDateInSelectedPeriod(b.dueDate));

  const baseBillsForModal = billPeriodMode === 'current' ? filteredBills : bills;
  const modalFilteredBills = baseBillsForModal.filter(b => {
    const billTitle = String(b.title || '').toLowerCase();
    const billCategory = String(b.category || '').toLowerCase();
    const matchesSearch = billTitle.includes(String(billSearchQuery || '').toLowerCase()) ||
                          billCategory.includes(String(billSearchQuery || '').toLowerCase());
    const isSerasa = b.id.startsWith('b_serasa_');
    if (!matchesSearch) return false;
    if (billStatusFilter === 'pending') return b.status === 'pending';
    if (billStatusFilter === 'paid') return b.status === 'paid';
    if (billStatusFilter === 'serasa') return isSerasa;
    return true;
  });

  const dynamicCategories = categories.map(cat => {
    const catExpenseTotal = filteredTransactions
      .filter(t => t.type === 'expense' && t.category === cat.name)
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    const catBillTotal = filteredBills
      .filter(b => b.status === 'pending' && b.category === cat.name && !b.id.startsWith('b_card_'))
      .reduce((sum, b) => sum + (b.amount || 0), 0);
    
    const computedAllocated = catExpenseTotal + catBillTotal;
    return {
      ...cat,
      allocated: computedAllocated,
      catExpenseTotal,
      catBillTotal
    };
  });

  const totalCategoryExpenses = dynamicCategories.reduce((acc, cat) => acc + cat.allocated, 0);

  const paidExpensesTotal = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const pendingBills = filteredBills.filter(b => b.status === 'pending');
  const pendingBillsTotal = pendingBills.reduce((acc, curr) => acc + curr.amount, 0);
  const nextPendingBillOutsideSelectedPeriod = bills
    .filter(b => b.status === 'pending' && !isDateInSelectedPeriod(b.dueDate))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];

  const isDateStrictlyFuture = (dateStr) => {
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
  const futureCardBillsTotal = futureCardBills.reduce((acc, curr) => acc + curr.amount, 0);

  // Non-card pending bills for current month
  const nonCardPendingBills = pendingBills.filter(b => !b.id.startsWith('b_card_'));
  const nonCardPendingBillsTotal = nonCardPendingBills.reduce((acc, curr) => acc + curr.amount, 0);

  const filteredExpectedIncomes = expectedIncomes
    .filter(ei => isDateInSelectedPeriod(ei.expectedDate) || ei.isRecurring)
    .map(ei => {
      if (ei.isRecurring) {
        const isRecReceived = ei.receivedPeriods && ei.receivedPeriods.includes(currentPeriodKey);
        const currentMonthDate = dateFilterMode === 'month'
          ? `${selectedYear}-${String(selectedMonthIndex + 1).padStart(2, '0')}-${String(ei.recurrenceDay || 5).padStart(2, '0')}`
          : ei.expectedDate;

        return {
          ...ei,
          status: isRecReceived ? 'received' : 'pending',
          expectedDate: currentMonthDate
        };
      }
      return ei;
    });
  const pendingExpectedIncomeTotal = filteredExpectedIncomes
    .filter(ei => ei.status === 'pending')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const completedIncomesTotal = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((acc, curr) => acc + curr.amount, 0);

  // Marco Zero: Saldo Livre baseado no Saldo Atual (Liquidez real) + Receitas Futuras - Contas Pendentes do Mês
  const totalBankLiquidityBase = accounts.reduce((acc, a) => acc + a.balance, 0);
  const freeBalance = totalBankLiquidityBase + pendingExpectedIncomeTotal - pendingBillsTotal;
  
  const filteredIncomeTotal = completedIncomesTotal + pendingExpectedIncomeTotal;
  const totalCommittedMonth = paidExpensesTotal + pendingBillsTotal;
  const committedPercentage = Math.min(Math.round((pendingBillsTotal / (totalBankLiquidityBase + pendingExpectedIncomeTotal || 1)) * 100), 100);

  // 1. Liquidez Total & Poder de Compra (Saldo em Contas + Cheque Especial + Limite Livre dos Cartões)
  const totalBankLiquidity = accounts.reduce((acc, a) => acc + (a.balance + (a.overdraftLimit || 0)), 0);
  const totalPurchasingPowerRaw = totalBankLiquidity + totalCreditAvailable;
  
  // 2. Meta de Quitação de Compromissos Ativos (EXCLUI Serasa Negativado sem acordo)
  const activeSerasaAgreementsTotal = serasaDebts.filter(d => d.status === 'em_acordo').reduce((sum, d) => sum + (d.offerAmount || 0), 0);
  const totalActiveDebtsGoal = nonCardPendingBillsTotal + totalCreditUsed + activeSerasaAgreementsTotal;

  // 3. Comprometimento do Orçamento Total (Gastos Realizados + Boletos Pendentes + Acordos vs Receitas Totais)
  const totalPlannedBudgetIncome = filteredIncomeTotal;
  const totalPlannedExpensesAndCommitments = paidExpensesTotal + nonCardPendingBillsTotal + activeSerasaAgreementsTotal;
  const overallBudgetCommitmentPct = totalPlannedBudgetIncome > 0 
    ? Math.min(100, Math.round((totalPlannedExpensesAndCommitments / totalPlannedBudgetIncome) * 100)) 
    : (totalPlannedExpensesAndCommitments > 0 ? 100 : 0);

  // Dynamic Comprehensive Notification Engine
  const computedNotifications = useMemo(() => {
    const list = [];
    const todayStr = new Date().toISOString().split('T')[0];
    const todayObj = new Date();
    const todayDayNum = todayObj.getDate();

    const in3DaysObj = new Date();
    in3DaysObj.setDate(todayObj.getDate() + 3);
    const in3DaysStr = in3DaysObj.toISOString().split('T')[0];

    // 1. Pending Bills Evaluations
    bills.filter(b => b.status === 'pending').forEach(b => {
      if (b.dueDate === todayStr) {
        list.push({
          id: `n_today_${b.id}`,
          title: `⚠️ Boleto Vencendo Hoje: ${b.title}`,
          desc: `R$ ${b.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} vence hoje (${b.dueDate.split('-').reverse().join('/')}). Pague para evitar juros!`,
          time: 'Vence Hoje',
          type: 'alert',
          category: 'bills',
          actionLabel: 'Pagar Agora',
          actionType: 'pay_bill',
          targetBillId: b.id
        });
      } else if (b.dueDate > todayStr && b.dueDate <= in3DaysStr) {
        list.push({
          id: `n_near_${b.id}`,
          title: `⏳ Boleto Próximo (3 dias): ${b.title}`,
          desc: `Vencimento em ${b.dueDate.split('-').reverse().join('/')} (R$ ${b.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}).`,
          time: 'Em 3 dias',
          type: 'warning',
          category: 'bills',
          actionLabel: 'Pagar Antecipado',
          actionType: 'pay_bill',
          targetBillId: b.id
        });
      } else if (b.dueDate < todayStr) {
        list.push({
          id: `n_late_${b.id}`,
          title: `⚠️ Boleto Atrasado: ${b.title}`,
          desc: `Venceu em ${b.dueDate.split('-').reverse().join('/')} (R$ ${b.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}). Quite urgente!`,
          time: 'Vencido',
          type: 'alert',
          category: 'bills',
          actionLabel: 'Quitar Atrasado',
          actionType: 'pay_bill',
          targetBillId: b.id
        });
      }
    });

    // 2. Credit Cards Evaluations
    creditCards.forEach(c => {
      if (c.closingDay === todayDayNum) {
        list.push({
          id: `n_card_close_${c.id}_${todayStr.slice(0,7)}`,
          title: `📅 Fechamento da Fatura: ${c.name}`,
          desc: `Fatura fechou hoje (dia ${c.closingDay})! Novas compras no cartão entrarão no mês seguinte.`,
          time: 'Melhor Dia',
          type: 'info',
          category: 'cards',
          actionLabel: 'Ver Cartão',
          actionType: 'view_card'
        });
      }
      if (c.dueDay === todayDayNum) {
        list.push({
          id: `n_card_due_${c.id}_${todayStr.slice(0,7)}`,
          title: `🚨 Vencimento do Cartão: ${c.name}`,
          desc: `Sua fatura vence hoje (dia ${c.dueDay}). Mantenha seu crédito em dia!`,
          time: 'Vence Hoje',
          type: 'warning',
          category: 'cards',
          actionLabel: 'Ver Fatura',
          actionType: 'view_card'
        });
      }
      const dynamicUsedLimit = getCardUsedFromBills(c.name);
      const usagePct = dynamicUsedLimit / (c.totalLimit || 1);
      if (usagePct >= 0.8) {
        list.push({
          id: `n_card_limit_${c.id}`,
          title: `⚠️ Limite Comprometido: ${c.name}`,
          desc: `Você utilizou ${(usagePct * 100).toFixed(0)}% do limite (R$ ${dynamicUsedLimit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} de R$ ${c.totalLimit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}).`,
          time: 'Atenção',
          type: 'warning',
          category: 'cards',
          actionLabel: 'Gerenciar Cartões',
          actionType: 'view_card'
        });
      }
    });

    // 3. Expected Incomes Evaluations
    filteredExpectedIncomes.filter(ei => ei.status === 'pending').forEach(ei => {
      if (ei.expectedDate <= todayStr || ei.isRecurring) {
        list.push({
          id: `n_inc_due_${ei.id}`,
          title: `💰 Entrada Prevista Hoje: ${ei.title}`,
          desc: `Valor previsto de R$ ${ei.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} programado. Clique para confirmar o depósito!`,
          time: 'Entrada Programada',
          type: 'success',
          category: 'incomes',
          actionLabel: 'Receber Agora',
          actionType: 'confirm_income',
          targetIncomeItem: ei
        });
      }
    });

    // 4. Financial Health & Predictive Balance Evaluations
    if (freeBalance < 0) {
      list.push({
        id: `n_negative_balance_${todayStr.slice(0,7)}`,
        title: `🚨 Alerta de Saldo Preditivo Negativo!`,
        desc: `Seus boletos e obrigações superam o saldo em R$ ${Math.abs(freeBalance).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`,
        time: 'Crítico',
        type: 'alert',
        category: 'health',
        actionLabel: 'Ver Fluxo',
        actionType: 'view_flow'
      });
    } else if (committedPercentage > 85) {
      list.push({
        id: `n_high_committed_${todayStr.slice(0,7)}`,
        title: `⚠️ Comprometimento Elevado (${committedPercentage}%)`,
        desc: `Você já comprometeu ${committedPercentage}% da receita total prevista para o período.`,
        time: 'Atenção',
        type: 'warning',
        category: 'health',
        actionLabel: 'Ver Boletos',
        actionType: 'view_flow'
      });
    }

    // 5. Serasa Debts Evaluations
    serasaDebts.filter(d => d.status === 'negativado').forEach(d => {
      list.push({
        id: `n_serasa_neg_${d.id}`,
        title: `⚖️ Dívida Ativa Registrada: ${d.creditor}`,
        desc: `Dívida de R$ ${d.originalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} negativada no Serasa. Gere um acordo para limpar o nome!`,
        time: 'Serasa',
        type: 'alert',
        category: 'serasa',
        actionLabel: 'Gerar Acordo',
        actionType: 'view_serasa',
        targetDebt: d
      });
    });

    return list.map(item => ({
      ...item,
      read: readNotifIds.includes(item.id)
    }));
  }, [bills, creditCards, filteredExpectedIncomes, freeBalance, committedPercentage, serasaDebts, readNotifIds]);

  const unreadNotifCount = computedNotifications.filter(n => !n.read).length;

  useEffect(() => {
    const pushNewNotifications = async () => {
      const newNotifs = computedNotifications.filter(n => !n.read && !pushedNotifIds.includes(n.id));
      if (newNotifs.length === 0) return;

      try {
        const perm = await LocalNotifications.requestPermissions();
        if (perm.display === 'granted') {
          const notificationsToSchedule = newNotifs.map((n, index) => ({
            title: n.title,
            body: n.desc,
            id: Math.abs(n.id.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a }, 0)),
            schedule: { at: new Date(Date.now() + 1000 + (index * 500)) } // Escalonado pra não encavalar
          }));
          
          await LocalNotifications.schedule({ notifications: notificationsToSchedule });
          setPushedNotifIds(prev => [...prev, ...newNotifs.map(n => n.id)]);
        }
      } catch (e) {
        console.warn('LocalNotifications não suportado neste ambiente (Web).', e);
      }
    };
    pushNewNotifications();
  }, [computedNotifications, pushedNotifIds]);

  const handleMarkNotifAsRead = (id) => {
    if (!readNotifIds.includes(id)) {
      setReadNotifIds([...readNotifIds, id]);
    }
  };

  const handleMarkAllNotifsAsRead = () => {
    const allIds = computedNotifications.map(n => n.id);
    setReadNotifIds(Array.from(new Set([...readNotifIds, ...allIds])));
  };

  const handleNotifAction = (notif) => {
    handleMarkNotifAsRead(notif.id);
    if (notif.actionType === 'pay_bill' && notif.targetBillId) {
      handlePayBillInline(notif.targetBillId);
      setActiveSheet(null);
    } else if (notif.actionType === 'confirm_income' && notif.targetIncomeItem) {
      handleOpenReceiveModal(notif.targetIncomeItem);
    } else if (notif.actionType === 'view_card') {
      setActiveSheet('accounts-management');
    } else if (notif.actionType === 'view_serasa') {
      if (notif.targetDebt) {
        handleOpenNegotiateModal(notif.targetDebt);
      } else {
        setActiveSheet('add-serasa');
      }
    } else if (notif.actionType === 'view_flow') {
      setActiveSheet(null);
    }
  };

  const totalAllocatedAll = dynamicCategories.reduce((s, c) => s + c.allocated, 0) || 1;

  const handleOpenCreateCategory = () => {
    setEditingCategoryId(null);
    setCatFormName('');
    setCatFormColor('#06b6d4');
    setCatFormAllocated('500');
    setIsCategoryFormOpen(true);
  };

  const handleOpenEditCategory = (cat, e) => {
    e?.stopPropagation();
    setEditingCategoryId(cat.id);
    setCatFormName(cat.name);
    setCatFormColor(cat.color);
    setCatFormAllocated(cat.baseAllocated.toString());
    setIsCategoryFormOpen(true);
  };

  const handleSaveCategory = () => {
    if (!catFormName.trim()) return;

    if (editingCategoryId) {
      const oldCat = categories.find(c => c.id === editingCategoryId);
      const oldName = oldCat?.name;
      const newName = catFormName.trim();

      setCategories(categories.map(c => 
        c.id === editingCategoryId ? {
          ...c,
          name: newName,
          color: catFormColor,
          baseAllocated: parseFloat(catFormAllocated) || 0
        } : c
      ));

      if (oldName && oldName !== newName) {
        setTransactions(transactions.map(t => t.category === oldName ? { ...t, category: newName } : t));
        setBills(bills.map(b => b.category === oldName ? { ...b, category: newName } : b));
      }
    } else {
      const newCategory = {
        id: `cat_${Date.now()}`,
        name: catFormName.trim(),
        color: catFormColor,
        icon: Layers,
        baseAllocated: parseFloat(catFormAllocated) || 0
      };
      setCategories([...categories, newCategory]);
    }

    setIsCategoryFormOpen(false);
    setEditingCategoryId(null);
  };

  const handleConfirmDeleteCategory = (catId, e) => {
    e?.stopPropagation();
    if (categories.length <= 1) return;
    setConfirmDeleteCatId(catId);
  };

  const handleExecuteDeleteCategory = () => {
    if (!confirmDeleteCatId) return;

    const catToDelete = categories.find(c => c.id === confirmDeleteCatId);
    if (!catToDelete) return;

    const fallbackCat = categories.find(c => c.id !== confirmDeleteCatId) || { name: 'Outros' };

    setTransactions(transactions.map(t => t.category === catToDelete.name ? { ...t, category: fallbackCat.name } : t));
    setBills(bills.map(b => b.category === catToDelete.name ? { ...b, category: fallbackCat.name } : b));

    setCategories(categories.filter(c => c.id !== confirmDeleteCatId));
    setConfirmDeleteCatId(null);

    if (activeCategory?.id === confirmDeleteCatId) {
      handleResetCategory();
    }
  };

  const handleSelectCategory = (cat) => {
    if (activeCategory?.id === cat.id) {
      handleResetCategory();
      return;
    }
    if (animStage === 'recoiling') return;

    setPendingCategory(cat);
    setAnimStage('recoiling');

    setTimeout(() => {
      setActiveCategory(cat);
      setAnimStage('active');
    }, 350);
  };

  const handleResetCategory = () => {
    if (animStage === 'returning' || animStage === 'recoiling') return;

    setAnimStage('returning');
    setActiveCategory(null);

    setTimeout(() => {
      setAnimStage('idle');
      setPendingCategory(null);
    }, 700);
  };

  const handleToggleSwipe = (id) => {
    setSwipedBillId(prev => prev === id ? null : id);
  };

  const handlePayBillInline = (billId, e) => {
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
  };

  const handleDeleteBillInline = (billId, e) => {
    e?.stopPropagation();
    setBills(prev => prev.filter(b => b.id !== billId));
    setSwipedBillId(null);
  };

  const handleOpenEditBill = (bill, e) => {
    e?.stopPropagation();
    setSelectedBill({ ...bill });
    setEditBillFile(null);
    setEditBillUploading(false);
    setActiveSheet('edit-bill');
    setSwipedBillId(null);
  };

  const handleSaveEditedBill = async () => {
    if (!selectedBill || !selectedBill.title.trim() || !selectedBill.amount) return;

    let fileUrl = selectedBill.fileUrl || null;

    if (editBillFile) {
      setEditBillUploading(true);
      try {
        const formData = new FormData();
        formData.append('file', editBillFile);
        formData.append('upload_preset', 'boletos_upload');
        const res = await fetch('https://api.cloudinary.com/v1_1/qbnj1r8p/auto/upload', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        if (data.secure_url) {
          fileUrl = data.secure_url;
        } else {
          console.error('Erro Cloudinary:', data);
          alert('Erro ao enviar o anexo para o Cloudinary. O boleto será salvo sem atualizar o anexo.');
        }
      } catch (err) {
        console.error('Erro ao fazer upload do boleto:', err);
        alert('Erro ao fazer upload do arquivo. O boleto será salvo sem atualizar o anexo.');
      } finally {
        setEditBillUploading(false);
      }
    }

    const updatedBill = {
      ...selectedBill,
      fileUrl: fileUrl
    };

    // If it's a card bill and amount changed, adjust card usedLimit by the difference
    if (updatedBill.id.startsWith('b_card_')) {
      const originalBill = bills.find(b => b.id === updatedBill.id);
      if (originalBill && originalBill.amount !== updatedBill.amount) {
        const diff = updatedBill.amount - originalBill.amount; // positive = increase, negative = decrease
        const cardName = extractCardNameFromBillTitle(updatedBill.title);
        if (cardName) {
          adjustCardUsedLimit(cardName, diff);
        }
      }
    }

    setBills(bills.map(b => b.id === updatedBill.id ? updatedBill : b));
    setActiveSheet(null);
    setSelectedBill(null);
    setEditBillFile(null);
  };

  const closeQuickMenuWithAnim = (onComplete) => {
    if (isMenuClosing) return;
    setIsMenuClosing(true);
    setTimeout(() => {
      setShowQuickMenu(false);
      setIsMenuClosing(false);
      if (onComplete) onComplete();
    }, 280);
  };

  const toggleQuickMenu = () => {
    if (showQuickMenu) {
      closeQuickMenuWithAnim();
    } else {
      setIsMenuClosing(false);
      setShowQuickMenu(true);
    }
  };

  const handleKeypadPress = (val) => {
    if (val === 'DEL') {
      setCalcValue(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
      return;
    }
    if (val === 'C') {
      setCalcValue('0');
      return;
    }
    if (calcValue === '0' && val !== '.') {
      setCalcValue(val);
    } else {
      if (val === '.' && calcValue.includes('.')) return;
      setCalcValue(prev => prev + val);
    }
  };

  const handleSaveKeypadExpense = () => {
    const num = parseLocalizedNumber(calcValue);
    if (!num || num <= 0) return;

    let sourceName = 'Manual';
    let card = null;

    if (paymentSourceType === 'account') {
      const acc = accounts.find(a => a.id === selectedAccountId) || accounts[0];
      sourceName = acc ? acc.name : 'Conta';
      if (acc) {
        setAccounts(accounts.map(a => a.id === acc.id ? { ...a, balance: a.balance - num } : a));
      }
    } else if (paymentSourceType === 'credit_card') {
      card = creditCards.find(c => c.id === selectedCardId) || creditCards[0];
      sourceName = card ? card.name : 'Fonte de Crédito (Cartão/Outros)';
      const instCount = parseInt(calcInstallments) || 1;
      const instAmount = num / instCount;

      if (card) {
        const nextUsedLimit = getCardUsedFromBills(card.name) + num;
        if (nextUsedLimit > (card.totalLimit || 0)) {
          setCalcValidationError('Limite do cartão insuficiente para gerar esse boleto.');
          return;
        }

        setCalcValidationError('');
        // Increase used limit
        setCreditCards(creditCards.map(c => c.id === card.id ? { ...c, /* usedLimit is dynamic */ } : c));

        // Generate installment bills in Agenda
        const startOffset = 0; // Forced to 0 for automatic calculation
        const dueDates = calculateCardInstallmentDates(calcDate, card.closingDay, card.dueDay, instCount, startOffset);
        const generatedBills = dueDates.map((dueDateStr, idx) => ({
          id: `b_card_${Date.now()}_${idx + 1}`,
          title: `[Fatura ${card.name}] ${calcLocation.trim() || calcCategory} (${idx + 1}/${instCount})`,
          category: calcCategory,
          dueDate: dueDateStr,
          amount: instAmount,
          status: 'pending',
          urgent: idx === 0,
          createdBy: user?.displayName || user?.email?.split('@')[0] || 'Desconhecido',
          owner: user?.displayName || user?.email?.split('@')[0] || 'Desconhecido'
        }));

        setBills(prev => [...prev, ...generatedBills]);
      }
    }

    const newTx = {
      id: `t_${Date.now()}`,
      title: calcLocation.trim() || `Gasto em ${calcCategory}`,
      category: calcCategory,
      date: calcDate,
      dayGroup: 'Lançamento Manual',
      amount: num,
      type: 'expense',
      status: 'completed',
      location: paymentSourceType === 'credit_card' ? (card?.name || sourceName) : sourceName,
      sourceType: paymentSourceType,
      cardId: paymentSourceType === 'credit_card' ? card?.id : null,
      installments: paymentSourceType === 'credit_card' ? parseInt(calcInstallments) : 1,
      createdBy: user?.displayName || user?.email?.split('@')[0] || 'Desconhecido',
      owner: user?.displayName || user?.email?.split('@')[0] || 'Desconhecido'
    };

    setTransactions([newTx, ...transactions]);
    setCalcValue('0');
    setCalcLocation('');
    setCalcValidationError('');
    setActiveSheet(null);
  };

  const handleSaveBill = async () => {
    if (!billName.trim() || !billAmount) return;
    setBillUploading(true);
    let fileUrl = null;

    if (billFile) {
      try {
        const formData = new FormData();
        formData.append('file', billFile);
        formData.append('upload_preset', 'boletos_upload');
        const res = await fetch('https://api.cloudinary.com/v1_1/qbnj1r8p/auto/upload', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        if (data.secure_url) {
          fileUrl = data.secure_url;
        } else {
          console.error('Erro Cloudinary:', data);
          alert('Erro ao enviar o anexo para o Cloudinary. O boleto será salvo sem anexo.');
        }
      } catch (err) {
        console.error('Erro ao fazer upload do boleto:', err);
        alert('Erro ao fazer upload do arquivo. O boleto será salvo sem anexo.');
      }
    }

    const newBill = {
      id: `b_${Date.now()}`,
      title: billName,
      category: billCategory,
      dueDate: billDueDate,
      amount: parseLocalizedNumber(billAmount),
      status: 'pending',
      urgent: false,
      fileUrl: fileUrl,
      createdBy: user?.displayName || user?.email?.split('@')[0] || 'Desconhecido',
      owner: user?.displayName || user?.email?.split('@')[0] || 'Desconhecido'
    };
    
    setBills([...bills, newBill]);
    setBillName('');
    setBillAmount('');
    setBillFile(null);
    setBillUploading(false);
    setActiveSheet(null);
  };

  const handleSaveIncome = () => {
    const num = parseLocalizedNumber(incomeAmount);
    if (!num || num <= 0) return;

    let targetAcc = accounts.find(a => a.id === incomeTargetAccId);
    if (!targetAcc && accounts.length > 0) targetAcc = accounts[0];

    if (targetAcc) {
      setAccounts(accounts.map(a => a.id === targetAcc.id ? { ...a, balance: a.balance + num } : a));
    }

    const newTx = {
      id: `t_${Date.now()}`,
      title: incomeDesc.trim() || 'Nova Receita',
      category: 'Receita',
      date: new Date().toISOString().split('T')[0],
      dayGroup: 'Hoje',
      amount: num,
      type: 'income',
      status: 'completed',
      location: targetAcc ? targetAcc.name : 'Conta Bancária',
      sourceType: 'account',
      accountId: targetAcc ? targetAcc.id : null,
      createdBy: user?.displayName || user?.email?.split('@')[0] || 'Desconhecido',
      owner: user?.displayName || user?.email?.split('@')[0] || 'Desconhecido'
    };

    setTransactions([newTx, ...transactions]);
    setIncomeDesc('');
    setIncomeAmount('');
    setIncomeTargetAccId('');
    setActiveSheet(null);
  };

  // Account CRUD Handlers
  const handleSaveAccount = () => {
    if (!accName.trim()) return;
    const numBal = parseLocalizedNumber(accBalance);
    const numOverdraft = parseLocalizedNumber(accOverdraft);

    if (editingAccId) {
      setAccounts(accounts.map(a => a.id === editingAccId ? { ...a, name: accName.trim(), type: accType, balance: numBal, overdraftLimit: numOverdraft, color: accColor } : a));
    } else {
      const newAcc = {
        id: `acc_${Date.now()}`,
        name: accName.trim(),
        type: accType,
        balance: numBal,
        overdraftLimit: numOverdraft,
        color: accColor
      };
      setAccounts([...accounts, newAcc]);
    }
    setIsAccFormOpen(false);
    setEditingAccId(null);
    setAccOverdraft('');
  };

  const handleDeleteAccount = (id) => {
    if (accounts.length <= 1) return;
    setAccounts(accounts.filter(a => a.id !== id));
    removeDocument('accounts', id);
  };

  // Credit Card CRUD Handlers
  const handleSaveCard = () => {
    if (!cardName.trim()) return;
    const limitNum = parseLocalizedNumber(cardTotalLimit);

    if (editingCardId) {
      setCreditCards(creditCards.map(c => c.id === editingCardId ? {
        ...c,
        name: cardName.trim(),
        totalLimit: limitNum,
        closingDay: parseInt(cardClosingDay) || 20,
        dueDay: parseInt(cardDueDay) || 28,
        color: cardColor
      } : c));
    } else {
      const newCard = {
        id: `card_${Date.now()}`,
        name: cardName.trim(),
        bank: cardName.split(' ')[0] || 'Banco',
        totalLimit: limitNum,
        usedLimit: 0,
        closingDay: parseInt(cardClosingDay) || 20,
        dueDay: parseInt(cardDueDay) || 28,
        color: cardColor
      };
      setCreditCards([...creditCards, newCard]);
    }
    setIsCardFormOpen(false);
    setEditingCardId(null);
  };

  const handleDeleteCard = (id) => {
    if (creditCards.length <= 1) return;
    setCreditCards(creditCards.filter(c => c.id !== id));
    removeDocument('creditCards', id);
  };

  const handleCalendarDayClick = (dayNum) => {
    const monthStr = String(calViewMonth + 1).padStart(2, '0');
    const dayStr = String(dayNum).padStart(2, '0');
    const dateFormatted = `${calViewYear}-${monthStr}-${dayStr}`;

    if (rangeSelecting === 'start') {
      setRangeStartDate(dateFormatted);
      setRangeEndDate(dateFormatted);
      setRangeSelecting('end');
    } else {
      if (dateFormatted < rangeStartDate) {
        setRangeStartDate(dateFormatted);
        setRangeSelecting('end');
      } else {
        setRangeEndDate(dateFormatted);
        setRangeSelecting('start');
      }
    }
  };

  const periodLabel = dateFilterMode === 'month' 
    ? `${monthNames[selectedMonthIndex]} ${selectedYear}`
    : `${rangeStartDate.split('-').reverse().join('/')} - ${rangeEndDate.split('-').reverse().join('/')}`;

  const themeBg = isDarkMode ? 'text-slate-100' : 'bg-slate-200/70 text-slate-900';
  const cardBg = isDarkMode ? 'bg-[#16171d] border-[#252732] text-white' : 'bg-white border-slate-200 text-slate-900';
  const subText = isDarkMode ? 'text-slate-400' : 'text-slate-500';
  const innerInputBg = isDarkMode ? 'bg-[#1e2029] border-[#2d2f3a] text-white' : 'bg-slate-100 border-slate-200 text-slate-900';

  // Render Login Screen if not authenticated
  if (!user && !authLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${isDarkMode ? 'bg-[#0b0c0e]' : 'bg-slate-200/80'}`}>
        <div className={`w-full max-w-md p-6 sm:p-8 rounded-3xl border shadow-2xl space-y-6 ${cardBg}`}>
          {/* Logo Branding */}
          <div className="text-center space-y-2">
            <img 
              src="/bazil_logo.jpg" 
              alt="Logo Família Bazil" 
              className="w-20 h-20 rounded-2xl mx-auto border-2 border-emerald-500/40 shadow-xl shadow-emerald-500/20 object-cover" 
            />
            <h1 className={`text-lg font-extrabold uppercase tracking-wider ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              Controle Financeiro
            </h1>
            <span className="text-xs font-bold text-emerald-400 block -mt-1">
              Família Bazil
            </span>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {authError && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <div>
              <label className={`text-[10px] uppercase font-extrabold ${subText} block mb-1`}>E-mail</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
                <input
                  type="email"
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="familia@bazil.com"
                  className={`w-full pl-9 pr-3 py-3 rounded-xl border text-xs outline-none ${innerInputBg}`}
                />
              </div>
            </div>

            <div>
              <label className={`text-[10px] uppercase font-extrabold ${subText} block mb-1`}>Senha</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
                <input
                  type="password"
                  required
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full pl-9 pr-3 py-3 rounded-xl border text-xs outline-none ${innerInputBg}`}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-3.5 rounded-2xl bg-emerald-600 text-white font-extrabold text-xs shadow-lg shadow-emerald-500/25 hover:bg-emerald-500 active:scale-95 transition-all"
            >
              {authLoading ? 'Entrando...' : 'Entrar no Sistema'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex justify-center items-center sm:py-6 font-sans antialiased selection:bg-blue-500 transition-colors duration-300 ${themeBg} ${isDarkMode ? '' : 'bg-slate-100'}`}>
      {/* Global CSS Styling for animations and scrollbar removal */}
      <style>{`
        * {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        *::-webkit-scrollbar {
          display: none;
          width: 0px;
          height: 0px;
        }

        @keyframes slideFromRight {
          0% { opacity: 0; transform: translateX(45px) scale(0.92); }
          100% { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes slideToRight {
          0% { opacity: 1; transform: translateX(0) scale(1); }
          100% { opacity: 0; transform: translateX(45px) scale(0.92); }
        }
        @keyframes fadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes fadeOut {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes slideUpSheet {
          0% { opacity: 0; transform: translateY(100%); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes chartAssemble {
          0% { transform: scale(1.35) rotate(-20deg); opacity: 0; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes clipReveal {
          0% { width: 0px; }
          100% { width: 340px; }
        }
        @keyframes lineGlow {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        .animate-backdrop-in {
          animation: fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-backdrop-out {
          animation: fadeOut 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-sheet-up {
          animation: slideUpSheet 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-slide-from-right {
          animation: slideFromRight 0.32s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .animate-slide-to-right {
          animation: slideToRight 0.25s cubic-bezier(0.7, 0, 0.84, 0) both;
        }
        .animate-chart-pop {
          animation: chartAssemble 1.05s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-clip-reveal {
          animation: clipReveal 1.35s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }
        .tech-line-pulse {
          animation: lineGlow 2.5s ease-in-out infinite;
        }
        .donut-segment {
          transition: stroke-dasharray 1.2s cubic-bezier(0.16, 1, 0.3, 1), stroke-dashoffset 1.2s cubic-bezier(0.16, 1, 0.3, 1), stroke-width 0.5s ease, filter 0.5s ease;
        }
        .donut-segment:hover {
          stroke-width: 5.2;
          cursor: pointer;
        }
        .chart-container-shift {
          transition: all 1.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .tech-line-idle {
          stroke-dasharray: 180;
          stroke-dashoffset: 0;
          opacity: 1;
          transition: stroke-dashoffset 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease;
        }
        .tech-line-recoil {
          stroke-dasharray: 180;
          stroke-dashoffset: 180;
          opacity: 0;
          transition: stroke-dashoffset 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s ease;
        }
        .label-idle-left {
          opacity: 1;
          transform: translateX(0) scale(1);
          transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .label-recoil-left {
          opacity: 0;
          transform: translateX(12px) scale(0.85);
          transition: opacity 0.28s ease, transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .label-idle-right {
          opacity: 1;
          transform: translateX(0) scale(1);
          transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .label-recoil-right {
          opacity: 0;
          transform: translateX(-12px) scale(0.85);
          transition: opacity 0.28s ease, transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>

      {/* App Container */}
      <div className={`w-full h-full min-h-screen flex flex-col relative ${isDarkMode ? 'bg-[#0b0c0e]' : 'bg-slate-200/70'}`}>

        {/* Modal: Auto Updater */}
        {showUpdateModal && updateInfo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className={`w-full max-w-sm rounded-3xl p-6 ${isDarkMode ? 'bg-[#1e1f26] text-white' : 'bg-white text-slate-900'} shadow-2xl relative overflow-hidden`}>
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-purple-500"></div>
              
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center mt-2">
                  <RefreshCw className="w-8 h-8 text-blue-500" />
                </div>
                
                <div>
                  <h3 className="text-lg font-black uppercase tracking-wider mb-1">Nova Versão Disponível!</h3>
                  <p className={`text-xs ${subText}`}>Versão {updateInfo.version} já pode ser baixada.</p>
                </div>
                
                <div className={`w-full p-4 rounded-2xl border ${innerInputBg} text-left`}>
                  <h4 className="text-[10px] font-bold uppercase mb-2 text-blue-400">O que há de novo?</h4>
                  <ul className="text-xs space-y-2">
                    {updateInfo.changelog?.map((change, i) => (
                      <li key={i} className="flex items-start">
                        <span className="text-blue-500 mr-2">•</span>
                        <span>{change}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="w-full flex flex-col space-y-2 pt-2">
                  <button 
                    onClick={() => {
                      window.open(updateInfo.apkUrl, '_system');
                      setShowUpdateModal(false);
                    }}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-bold shadow-lg shadow-blue-500/30"
                  >
                    Baixar e Instalar Atualização
                  </button>
                  <button 
                    onClick={() => setShowUpdateModal(false)}
                    className={`w-full py-3 rounded-xl border ${isDarkMode ? 'border-white/10 text-white/50' : 'border-black/10 text-black/50'} text-xs font-bold`}
                  >
                    Lembrar Mais Tarde
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Visualizador Nativo de Boletos e Anexos */}
        {viewingAttachment && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className={`w-full max-w-2xl rounded-3xl border ${cardBg} p-4 sm:p-5 flex flex-col max-h-[92vh] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200`}>
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
                <div className="flex items-center space-x-2.5 min-w-0 flex-1 mr-2">
                  <div className="w-9 h-9 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs sm:text-sm font-black truncate text-white">
                      {viewingAttachment.title || 'Comprovante / Anexo'}
                    </h3>
                    <span className="text-[10px] text-slate-400 block truncate">Visualizador Nativo Integrado</span>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5 shrink-0">
                  <a
                    href={viewingAttachment.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-xl bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 transition-all text-xs font-bold flex items-center space-x-1 border border-blue-500/30"
                    title="Abrir arquivo externo"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => setViewingAttachment(null)}
                    className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-all"
                    title="Fechar Visualizador"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-auto py-2 flex items-center justify-center bg-black/40 rounded-2xl my-2 border border-white/5">
                {(() => {
                  const url = viewingAttachment.url.toLowerCase();
                  const isPdf = url.includes('.pdf') || viewingAttachment.url.includes('/raw/upload') || viewingAttachment.url.includes('application/pdf');

                  if (isPdf) {
                    const embedUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(viewingAttachment.url)}&embedded=true`;
                    return (
                      <iframe
                        src={embedUrl}
                        title={viewingAttachment.title}
                        className="w-full h-[68vh] rounded-xl border-0 bg-white"
                      />
                    );
                  } else {
                    return (
                      <img
                        src={viewingAttachment.url}
                        alt={viewingAttachment.title}
                        className="max-h-[68vh] w-auto max-w-full object-contain rounded-xl shadow-lg select-none"
                      />
                    );
                  }
                })()}
              </div>

              {/* Footer */}
              <div className="flex justify-between items-center pt-2 text-[10px] text-slate-400 shrink-0">
                <span className="truncate mr-2">Visualizando documento diretamente no app</span>
                <button
                  onClick={() => setViewingAttachment(null)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs active:scale-95 transition-all"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Header • Calendar on Left, Logo in Center, Action Icons on Right */}
        <header className="px-3 sm:px-4 pt-3 sm:pt-4 pb-2 z-30 relative shrink-0 w-full max-w-xl lg:max-w-6xl mx-auto">
          <div
            className={`flex items-center justify-between gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-2xl border shadow-xl ${
              isDarkMode
                ? 'bg-[#16171d] border-[#252732] shadow-black/50'
                : 'bg-white/95 border-slate-300 shadow-slate-200'
            }`}
          >
            {/* Left: Period / Calendar selector */}
            <button
              onClick={() => setActiveSheet('month-picker')}
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl border transition-all active:scale-95 shrink-0 ${
                isDarkMode ? 'bg-[#22232c] border-[#2d2f3a] text-slate-200 hover:bg-[#2b2c37]' : 'bg-slate-100 border-slate-200 text-slate-800 hover:bg-slate-200'
              }`}
              title="Selecionar período"
            >
              <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-extrabold text-[11px] sm:text-xs tracking-wide uppercase">
                {periodLabel}
              </span>
            </button>

            {/* Center: Brand logo & Title */}
            <div className="flex items-center space-x-2 shrink-0">
              <img 
                src="/bazil_logo.jpg" 
                alt="Controle Financeiro Família Bazil Logo" 
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl object-cover border border-emerald-500/30 shadow-md shadow-emerald-500/20 shrink-0" 
              />
              <div className="text-left hidden xs:block">
                <span className={`font-black text-[10px] sm:text-xs tracking-wider uppercase block ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  Controle Financeiro
                </span>
                <span className="text-[9px] sm:text-[10px] font-extrabold text-emerald-400 block -mt-0.5">
                  Família Bazil
                </span>
              </div>
            </div>

            {/* Right: Bell + Theme toggle + Logout */}
            <div className="flex items-center space-x-1.5 shrink-0">
              {user && (
                <button
                  onClick={handleLogout}
                  className={`p-2 rounded-xl transition-all active:scale-90 flex items-center space-x-1 ${
                    isDarkMode ? 'bg-[#22232c] hover:bg-rose-500/20 text-slate-300 hover:text-rose-400' : 'bg-slate-100 hover:bg-rose-100 text-slate-700 hover:text-rose-600'
                  }`}
                  title={`Conectado como ${user.email}. Clique para sair.`}
                >
                  <LogOut className="w-4 h-4 text-rose-400" />
                </button>
              )}

              <button
                onClick={() => setActiveSheet('notifications')}
                className={`relative flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl transition-all active:scale-90 ${
                  isDarkMode ? 'bg-[#22232c] hover:bg-[#2b2c37] text-slate-200' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
                title="Notificações & Alertas"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full text-[9px] font-black text-white flex items-center justify-center border border-[#0b0c0e] animate-pulse">
                    {unreadNotifCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`p-2 rounded-xl transition-all active:scale-90 ${
                  isDarkMode ? 'bg-[#22232c] text-amber-400 hover:bg-[#2b2c37]' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
                title="Alternar Modo Claro/Escuro"
              >
                {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </header>

        {/* Floating Add Button (bottom-right) & Quick Menu */}
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={toggleQuickMenu}
            className={`w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 text-white flex items-center justify-center shadow-2xl shadow-blue-500/50 active:scale-90 transition-all duration-300 ${showQuickMenu ? 'rotate-45 scale-110' : 'hover:scale-110 rotate-0'}`}
            title="Adicionar"
          >
            <Plus className="w-7 h-7 stroke-[3] transition-transform duration-300" />
          </button>

          {showQuickMenu && (
            <>
              <div
                className={`fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300 ${isMenuClosing ? 'animate-backdrop-out' : 'animate-backdrop-in'}`}
                onClick={() => closeQuickMenuWithAnim()}
              />

              <div className="absolute bottom-16 right-0 w-64 sm:w-72 max-h-[calc(100vh-100px)] overflow-y-auto scrollbar-none z-50 space-y-1.5 p-1">
                {[
                  { id: 'add-keypad', label: 'Novo Gasto', desc: 'Teclado calculadora', icon: Plus, color: 'blue' },
                  { id: 'add-expected-income', label: 'Receita Prevista', desc: 'Vendas em produção / Salário', icon: TrendingUp, color: 'emerald' },
                  { id: 'add-bill', label: 'Agendar Boleto', desc: 'Conta futura/aluguel', icon: Calendar, color: 'amber' },
                  { id: 'add-income', onClick: () => { if(accounts.length > 0) setIncomeTargetAccId(accounts[0].id); setActiveSheet('add-income'); }, label: 'Receita Direta', desc: 'Entrada instantânea no saldo', icon: DollarSign, color: 'emerald' },
                  { id: 'accounts-management', label: 'Contas & Cartões', desc: 'Saldos, limites e faturas', icon: CreditCard, color: 'indigo' },
                  { id: 'add-serasa', label: 'Dívida Serasa', desc: 'Monitoramento & Quitação', icon: ShieldAlert, color: 'rose' },
                  { id: 'categories', label: 'Categorias', desc: 'Criar e gerenciar', icon: Tag, color: 'purple' },
                ].map((item, idx) => (
                  <button
                    key={item.id}
                    onClick={() => closeQuickMenuWithAnim(() => { if (item.onClick) item.onClick(); else setActiveSheet(item.id); })}
                    style={{ animationDelay: isMenuClosing ? `${(4 - idx) * 35}ms` : `${idx * 45}ms` }}
                    className={`w-full p-2.5 sm:p-3 rounded-2xl border shadow-xl flex items-center space-x-3 text-left transition-all active:scale-95 group ${
                      isDarkMode
                        ? 'bg-[#16171d] border-[#252732] text-white hover:border-blue-500/50'
                        : 'bg-white/95 border-slate-200 text-slate-900 hover:border-blue-400'
                    } ${isMenuClosing ? 'animate-slide-to-right' : 'animate-slide-from-right'}`}
                  >
                    <ModernIcon icon={item.icon} color={item.color} size="md" />
                    <div>
                      <span className="text-sm font-bold block">{item.label}</span>
                      <span className={`text-[11px] ${subText}`}>{item.desc}</span>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Main Dashboard Scrollable Content */}
        <main ref={mainScrollRef} className="flex-1 overflow-y-auto px-4 py-2 space-y-6 pb-28 scrollbar-none w-full max-w-xl lg:max-w-6xl mx-auto">
          
          {/* HERO CARD UNIFICADO: VALORES DISPONÍVEIS E PODER FINANCEIRO (O mais consultado!) */}
          <section className={`p-5 sm:p-6 rounded-3xl border ${cardBg} relative overflow-hidden shadow-2xl space-y-5`}>
            <div className="absolute -top-16 -right-16 w-56 h-56 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-500/8 rounded-full blur-2xl pointer-events-none"></div>

            {/* Header Title */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ModernIcon icon={Wallet} color="emerald" size="sm" />
                <span className={`text-xs font-black uppercase tracking-wider text-emerald-400`}>
                  Poder Financeiro & Valores Disponíveis
                </span>
              </div>
            </div>

            {/* DUAL HERO METRICS: Os valores mais consultados pelo usuário */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* METRICA 1: Valor Disponível Imediato (Sem Descontar Boletos) */}
              <div className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-[#181c28] border-[#252f45]' : 'bg-emerald-50/70 border-emerald-200'} relative overflow-hidden shadow-lg flex items-start space-x-4`}>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500/80 to-transparent"></div>
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 mt-1">
                  <Wallet className="w-6 h-6 text-emerald-500" />
                </div>
                <div className="space-y-1">
                  <span className={`text-[10px] font-extrabold uppercase tracking-wider ${subText} block`}>
                    Disponível Imediato (Sem Descontar Boletos)
                  </span>
                  <h2 className={`text-3xl sm:text-4xl font-black tracking-tight ${totalPurchasingPowerRaw > 0 ? 'text-emerald-400' : totalPurchasingPowerRaw < 0 ? 'text-rose-400' : (isDarkMode ? 'text-slate-400' : 'text-slate-600')}`}>
                    R$ {totalPurchasingPowerRaw.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </h2>
                  <p className={`text-[10px] ${subText} pt-1 max-w-xs leading-tight`}>
                    Saldo em contas ({accounts.length}) + Cheque especial + Limite livre cartões
                  </p>
                </div>
              </div>

              {/* METRICA 2: Livre Líquido (Após Reservar Boletos Previstos) */}
              <div className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-[#1a1c24] border-[#252836]' : 'bg-blue-50/70 border-blue-200'} relative overflow-hidden shadow-lg flex items-start space-x-4`}>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500/80 to-transparent"></div>
                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 mt-1">
                  <ShieldCheck className="w-6 h-6 text-blue-500" />
                </div>
                <div className="space-y-1">
                  <span className={`text-[10px] font-extrabold uppercase tracking-wider ${subText} block`}>
                    Livre Líquido (Após Reservar Boletos Previstos)
                  </span>
                  <h2 className={`text-3xl sm:text-4xl font-black tracking-tight ${freeBalance > 0 ? 'text-emerald-400' : freeBalance < 0 ? 'text-rose-400' : (isDarkMode ? 'text-slate-400' : 'text-slate-600')}`}>
                    R$ {freeBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </h2>
                  <p className={`text-[10px] ${subText} pt-1 max-w-xs leading-tight`}>
                    Saldo base + receitas previstas - faturas e boletos
                  </p>
                </div>
              </div>

            </div>

            {/* DETALHAMENTO DA COMPOSIÇÃO DO DISPONÍVEL E CONTROLE DE CARTÕES */}
            <div className={`p-3.5 rounded-2xl border ${innerInputBg} space-y-2 text-[11px]`}>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700/30 pb-2">
                <div className="flex items-center space-x-1.5">
                  <span className={subText}>Saldo em Contas:</span>
                  <span className={`font-black ${totalBankBalance < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    R$ {totalBankBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                {totalOverdraftLimit > 0 && (
                  <div className="flex items-center space-x-1.5">
                    <span className={subText}>Cheque Especial:</span>
                    <span className="font-black text-amber-400">
                      + R$ {totalOverdraftLimit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                <div className="flex items-center space-x-1.5">
                  <span className={subText}>Limite Livre Cartões:</span>
                  <span className="font-black text-blue-400">
                    + R$ {totalCreditAvailable.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* CARD INSTALLMENTS CONTROL BADGE */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-[10px]">
                <div className="flex items-center space-x-1">
                  <span className="text-purple-400 font-bold flex items-center gap-1"><CreditCard className="w-3 h-3" /> Cartões de Crédito:</span>
                  <span className={subText}>
                    Limite Total R$ {totalCreditLimit.toLocaleString('pt-BR', { minimumFractionDigits: 0 })} | Usado Total: <strong className="text-rose-400">R$ {totalCreditUsed.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-md font-bold border border-purple-500/30">
                    Fatura do Mês: R$ {currentMonthCardBillsTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-md font-bold border border-indigo-500/30">
                    Parcelas Futuras: R$ {futureCardBillsTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

          </section>



          
          {/* 2 & 3. RECURSOS FINANCEIROS: CONTAS BANCÁRIAS & CARTÕES */}
          {/* Accounts & Credit Cards Overview Section */}
          <section className={`p-4 sm:p-5 rounded-3xl border ${cardBg} space-y-4 shadow-xl`}>
            <div className="flex justify-between items-center gap-2">
              <div>
                <p className={`text-[10px] font-bold uppercase tracking-widest ${subText} mb-0.5`}>Recursos Financeiros</p>
                <h3 className={`text-sm sm:text-base font-black uppercase tracking-wider ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  Contas Bancárias & Cartões
                </h3>
              </div>
              <button
                onClick={() => setActiveSheet('accounts-management')}
                className={`text-xs font-bold px-2.5 py-1.5 sm:px-3 rounded-xl transition-all active:scale-95 flex items-center space-x-1 shrink-0 whitespace-nowrap ${
                  isDarkMode ? 'bg-[#22232c] text-indigo-400 hover:bg-[#2b2c37] border border-[#2d2f3a]' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Gerenciar ({accounts.length + creditCards.length})</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Bank Accounts Box */}
              <div className={`p-4 rounded-2xl border ${innerInputBg} space-y-3`}>
                <div className="flex justify-between items-center">
                  <span className={`text-xs font-bold uppercase ${subText}`}>Saldo em Contas</span>
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
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {accounts.map(acc => {
                    const accAvailable = acc.balance + (acc.overdraftLimit || 0);
                    return (
                      <div key={acc.id} className="relative overflow-hidden rounded-xl border flex flex-col p-3 shadow-sm" style={{ borderLeft: `4px solid ${acc.color}`, backgroundColor: isDarkMode ? '#1a1c24' : '#ffffff', borderColor: isDarkMode ? '#2d2f3a' : '#e2e8f0', borderLeftColor: acc.color }}>
                        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ background: `linear-gradient(to right, ${acc.color}, transparent)` }}></div>
                        <div className="relative z-10 flex justify-between items-center mb-2">
                          <div className="flex items-center space-x-2 text-xs font-extrabold">
                            <span style={{ color: acc.color }}>🏦</span>
                            <span className="truncate max-w-[100px]" style={{ color: isDarkMode ? '#e2e8f0' : '#334155' }}>{acc.name}</span>
                          </div>
                        </div>
                        <div className="relative z-10 text-right">
                          <p className={`text-base font-black tracking-tight ${acc.balance > 0 ? 'text-emerald-400' : acc.balance < 0 ? 'text-rose-400' : (isDarkMode ? 'text-slate-400' : 'text-slate-600')}`}>
                            R$ {acc.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                          {(acc.overdraftLimit || 0) > 0 && (
                            <p className="text-[9px] font-bold text-amber-400 mt-1">
                              + R$ {(acc.overdraftLimit || 0).toLocaleString('pt-BR')} (Cheque Especial)
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Credit Cards Limit Box */}
              <div className={`p-4 rounded-2xl border ${innerInputBg} space-y-3`}>
                <div className="flex justify-between items-center">
                  <span className={`text-xs font-bold uppercase ${subText}`}>Limite de Crédito Livre</span>
                  <span className="text-sm font-black text-blue-400">
                    R$ {totalCreditAvailable.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-[11px] font-bold">
                    <span className={subText}>Utilizado: R$ {totalCreditUsed.toLocaleString('pt-BR')}</span>
                    <span className={subText}>Total: R$ {totalCreditLimit.toLocaleString('pt-BR')}</span>
                  </div>
                  <div className={`w-full h-2 rounded-full overflow-hidden ${isDarkMode ? 'bg-[#22232c]' : 'bg-slate-200'}`}>
                    <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500" style={{ width: `${creditLimitPercent}%` }}></div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {creditCards.map(card => {
                      const usedLimit = getCardUsedFromBills(card.name);
                      const freeLimit = card.totalLimit - usedLimit;
                      const percentUsed = card.totalLimit > 0 ? (usedLimit / card.totalLimit) * 100 : 0;
                      return (
                        <div key={card.id} className="relative rounded-xl overflow-hidden p-3 aspect-[16/10] flex flex-col justify-between shadow-md border-0" style={{ background: `linear-gradient(135deg, ${card.color}dd 0%, ${card.color} 100%)` }}>
                          <div className="absolute inset-0 bg-black/10 mix-blend-overlay pointer-events-none"></div>
                          
                          {/* Top Row */}
                          <div className="relative z-10 flex justify-between items-start">
                            <span className="text-white/90 text-[10px] uppercase font-bold tracking-widest truncate max-w-[120px]">{card.name}</span>
                            <CreditCard className="w-3 h-3 text-white/70" />
                          </div>
                          
                          {/* Middle Row */}
                          <div className="relative z-10 flex gap-4">
                            <div className="flex flex-col">
                              <span className="text-white/60 text-[8px] uppercase tracking-wider">Limite Total</span>
                              <span className="text-white font-bold text-sm">R$ {card.totalLimit.toLocaleString('pt-BR')}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-white/60 text-[8px] uppercase tracking-wider">Livre</span>
                              <span className="text-emerald-300 font-black text-sm">R$ {freeLimit.toLocaleString('pt-BR')}</span>
                            </div>
                          </div>
                          
                          {/* Bottom Row */}
                          <div className="relative z-10 space-y-1.5">
                            <div className="w-full bg-black/30 rounded-full h-1 overflow-hidden">
                              <div className={`h-full rounded-full ${percentUsed > 80 ? 'bg-rose-400' : 'bg-emerald-400'}`} style={{ width: `${Math.min(percentUsed, 100)}%` }}></div>
                            </div>
                            <div className="flex justify-between items-center text-[8px] text-white/80">
                              <span>F: dia {card.closingDay} / V: dia {card.dueDay}</span>
                              {percentUsed > 80 && <span className="text-rose-300 font-bold">⚠️ CRÍTICO</span>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 4. AGENDA: PRÓXIMOS BOLETOS */}
          {/* Agenda de Boletos e Compromissos */}
          <section className="space-y-0">
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className={`text-[10px] font-bold uppercase tracking-widest ${subText} mb-0.5`}>Agenda</p>
                <h3 className={`text-base font-black uppercase tracking-wider ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  PRÓXIMOS BOLETOS{' '}
                  <span className={`text-sm font-bold normal-case ${subText}`}>({monthNames[selectedMonthIndex]?.slice(0, 3) ?? 'Mês'})</span>
                </h3>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setActiveSheet('view-all-bills')}
                  className={`flex items-center space-x-1 text-xs font-bold px-3 py-1.5 rounded-xl transition-all active:scale-95 ${
                    isDarkMode ? 'bg-[#22232c] text-amber-400 hover:bg-[#2b2c37] border border-[#2d2f3a]' : 'bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-200'
                  }`}
                >
                  <Filter className="w-3 h-3" />
                  <span>Ver Todos ({filteredBills.length})</span>
                </button>
                <button
                  onClick={() => setActiveSheet('add-bill')}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all active:scale-95 ${
                    isDarkMode ? 'bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 border border-blue-500/25' : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200'
                  }`}
                >
                  + Agendar
                </button>
              </div>
            </div>

            <div className={`rounded-3xl border overflow-hidden ${cardBg}`}>
              {pendingBills.length === 0 ? (
                <div className="text-center py-10 px-4">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center mx-auto mb-3">
                    <Check className="w-7 h-7 text-emerald-400" />
                  </div>
                  <p className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Nenhum boleto pendente neste mês.</p>
                  <p className={`text-xs ${subText} mt-1`}>
                    {nextPendingBillOutsideSelectedPeriod
                      ? `Há um compromisso futuro agendado para ${monthNames[new Date(nextPendingBillOutsideSelectedPeriod.dueDate).getMonth()]} • navegue para esse mês para visualizar.`
                      : 'Todos os compromissos foram quitados.'}
                  </p>
                </div>
              ) : (
                (showAllBillsInline ? pendingBills : pendingBills.slice(0, 4)).map((bill, billIdx) => {
                  const isSerasaAcordo = bill.id.startsWith('b_serasa_');
                  const isLast = billIdx === (showAllBillsInline ? pendingBills.length - 1 : Math.min(3, pendingBills.length - 1));

                  // Determine icon & color per category
                  const catData = categories.find(c => c.name === bill.category);
                  const billColor = catData?.color ?? (isSerasaAcordo ? '#f43f5e' : bill.urgent ? '#f59e0b' : '#64748b');

                  // Status label
                  const today = new Date().toISOString().split('T')[0];
                  const isLate = bill.dueDate < today;
                  const diffTime = new Date(bill.dueDate) - new Date(today);
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  
                  let daysText = diffDays === 0 ? "Vence hoje" : diffDays === 1 ? "Vence amanhã" : diffDays < 0 ? `Venceu há ${Math.abs(diffDays)} dia(s)` : `Vence em ${diffDays} dias`;

                  const statusStyle = isSerasaAcordo ? { text: 'Acordo', cls: 'text-rose-400 bg-rose-500/10 border-rose-500/20', border: 'border-rose-500' }
                    : isLate ? { text: 'Atrasado', cls: 'text-red-400 bg-red-500/10 border-red-500/20', border: 'border-red-500' }
                    : diffDays === 0 ? { text: 'Vence Hoje', cls: 'text-amber-400 bg-amber-500/10 border-amber-500/20', border: 'border-amber-500 animate-pulse' }
                    : { text: 'Pendente', cls: 'text-slate-400 bg-slate-500/10 border-slate-500/20', border: 'border-transparent' };

                  return (
                    <div key={bill.id} className={`border-l-[3px] ${statusStyle.border}`}>
                      <div className="flex items-center px-4 py-3.5 gap-3">
                        {/* Category colored circle icon */}
                        <div
                          className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border"
                          style={{ background: `${billColor}20`, borderColor: `${billColor}35` }}
                        >
                          {isSerasaAcordo
                            ? <FileText className="w-5 h-5" style={{ color: billColor }} />
                            : <CreditCard className="w-5 h-5" style={{ color: billColor }} />}
                        </div>

                        {/* Bill info */}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-bold truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                            {bill.title}
                          </p>
                          <div className="flex items-center space-x-1 mt-0.5">
                            <span className={`text-[10px] ${subText}`}>
                              {bill.dueDate.split('-').reverse().join('/')}
                            </span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${isLate ? 'text-rose-400 bg-rose-400/10' : diffDays <= 3 ? 'text-amber-400 bg-amber-400/10' : 'text-slate-400 bg-slate-400/10'}`}>
                              {daysText}
                            </span>
                          </div>
                        </div>

                        {/* Amount */}
                        <div className="text-right shrink-0">
                          <p className={`text-sm font-extrabold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                            R$ {bill.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                          {/* Status badge */}
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border mt-0.5 ${statusStyle.cls}`}>
                            <span>{statusStyle.text}</span>
                          </span>
                        </div>
                      </div>

                      {/* Inline actions row */}
                      <div className={`flex items-center gap-2 px-4 pb-3 ${
                        !isLast ? `border-b ${isDarkMode ? 'border-[#252732]' : 'border-slate-100'}` : ''
                      }`}>
                        <button
                          onClick={(e) => handlePayBillInline(bill.id, e)}
                          className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 active:scale-95 transition-all"
                        >
                          <Check className="w-3 h-3 stroke-[3]" />
                          <span>Pagar</span>
                        </button>
                        <span className={`text-[10px] ${subText}`}>•</span>
                        <button
                          onClick={(e) => handleOpenEditBill(bill, e)}
                          className={`text-[11px] font-bold ${subText} hover:text-blue-400 active:scale-95 transition-all`}
                        >
                          Editar
                        </button>
                        <span className={`text-[10px] ${subText}`}>•</span>
                        <button
                          onClick={(e) => handleDeleteBillInline(bill.id, e)}
                          className="text-[11px] font-bold text-rose-400/70 hover:text-rose-400 active:scale-95 transition-all"
                        >
                          Excluir
                        </button>
                      
                        {bill.fileUrl ? (
                          <>
                            <span className={`text-[10px] ${subText}`}>•</span>
                            <button
                              onClick={(e) => { e.stopPropagation(); setViewingAttachment({ url: bill.fileUrl, title: bill.title }); }}
                              className="text-[11px] font-bold text-amber-400 hover:text-amber-300 active:scale-95 transition-all flex items-center gap-1"
                              title="Visualizar Anexo no App"
                            >
                              <FileText className="w-3 h-3" />
                              <span>Ver Anexo</span>
                            </button>
                          </>
                        ) : (
                          <>
                            <span className={`text-[10px] ${subText}`}>•</span>
                            <button
                              onClick={(e) => handleOpenEditBill(bill, e)}
                              className="text-[11px] font-bold text-emerald-400/80 hover:text-emerald-300 active:scale-95 transition-all flex items-center gap-1"
                              title="Anexar Boleto / Comprovante"
                            >
                              <Upload className="w-3 h-3" />
                              <span>+ Anexar</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}

              {pendingBills.length > 4 && (
                <button
                  onClick={() => setShowAllBillsInline(!showAllBillsInline)}
                  className={`w-full py-3.5 text-xs font-bold transition-all active:scale-95 ${
                    isDarkMode ? 'text-amber-400 hover:bg-[#1e2028]' : 'text-amber-600 hover:bg-amber-50'
                  } border-t ${isDarkMode ? 'border-[#252732]' : 'border-slate-100'}`}
                >
                  {showAllBillsInline ? 'Ver apenas 4 próximos' : `Ver todos os ${pendingBills.length} boletos`}
                </button>
              )}
            </div>
          </section>

          {/* 5. OS QUATRO CAMPOS DE RESUMO MENSAL */}
          <section className={`p-4 sm:p-5 rounded-3xl border ${cardBg} space-y-3 shadow-xl`}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center space-x-2">
                <ModernIcon icon={PieChart} color="emerald" size="sm" />
                <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                  Resumo Financeiro do Mês
                </span>
              </div>
            </div>
            
            <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3`}>
              <div className={`p-3 rounded-xl border relative overflow-hidden ${isDarkMode ? 'bg-[#1a1c24] border-[#2d2f3a]' : 'bg-white border-slate-200'} shadow-sm`}>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500"></div>
                <div className="flex items-center space-x-2.5">
                  <ArrowDownCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                  <div className="space-y-0.5 min-w-0">
                    <span className={`text-[9px] font-bold uppercase tracking-wider ${subText} block truncate`}>Receita Entrou</span>
                    <span className="text-sm font-black text-emerald-400 block truncate">R$ {completedIncomesTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              <div className={`p-3 rounded-xl border relative overflow-hidden ${isDarkMode ? 'bg-[#1a1c24] border-[#2d2f3a]' : 'bg-white border-slate-200'} shadow-sm`}>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500"></div>
                <div className="flex items-center space-x-2.5">
                  <TrendingUp className="w-5 h-5 text-blue-500 shrink-0" />
                  <div className="space-y-0.5 min-w-0">
                    <span className={`text-[9px] font-bold uppercase tracking-wider ${subText} block truncate`}>Receita Prevista</span>
                    <span className="text-sm font-black text-blue-400 block truncate">R$ {pendingExpectedIncomeTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              <div className={`p-3 rounded-xl border relative overflow-hidden ${isDarkMode ? 'bg-[#1a1c24] border-[#2d2f3a]' : 'bg-white border-slate-200'} shadow-sm`}>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-400"></div>
                <div className="flex items-center space-x-2.5">
                  <ShoppingBag className="w-5 h-5 text-slate-500 shrink-0" />
                  <div className="space-y-0.5 min-w-0">
                    <span className={`text-[9px] font-bold uppercase tracking-wider ${subText} block truncate`}>Gastos Pagos</span>
                    <span className="text-sm font-black text-slate-400 block truncate">R$ {paidExpensesTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              <div className={`p-3 rounded-xl border relative overflow-hidden ${isDarkMode ? 'bg-[#1a1c24] border-[#2d2f3a]' : 'bg-white border-slate-200'} shadow-sm`}>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500"></div>
                <div className="flex items-center space-x-2.5">
                  <Clock className="w-5 h-5 text-amber-500 shrink-0" />
                  <div className="space-y-0.5 min-w-0">
                    <span className={`text-[9px] font-bold uppercase tracking-wider ${subText} block truncate`}>Boletos Previstos</span>
                    <span className="text-sm font-black text-amber-400 block truncate">R$ {pendingBillsTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            </div>

            
          </section>
          


          {/* Receitas Previstas & Entradas Futuras Section */}
          <section className={`p-4 sm:p-5 rounded-3xl border ${cardBg} space-y-4 relative overflow-hidden shadow-xl`}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex items-center space-x-2">
                <ModernIcon icon={TrendingUp} color="emerald" size="md" />
                <div>
                  <h3 className={`text-sm sm:text-base font-black uppercase tracking-wider ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    Receitas Previstas & Entradas Futuras
                  </h3>
                  <span className={`text-[10px] ${subText}`}>Vendas em produção, salários e recebimentos programados</span>
                </div>
              </div>

              <button
                onClick={() => { setActiveSheet('add-expected-income'); setEditingExpIncomeId(null); }}
                className={`w-full sm:w-auto text-xs font-bold px-3 py-2 rounded-xl transition-all active:scale-95 flex items-center justify-center space-x-1 shrink-0 whitespace-nowrap ${
                  isDarkMode ? 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/25' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Cadastrar Entrada</span>
              </button>
            </div>

            {/* Filter Tabs & Search */}
            <div className="flex items-center space-x-2 pt-1 overflow-x-auto scrollbar-none text-[10px]">
              {[
                { id: 'all', label: 'Todas' },
                { id: 'pending', label: 'Previstas (Pendentes)' },
                { id: 'received', label: 'Recebidas' },
                { id: 'recurring', label: 'Recorrentes (Mensais)' }
              ].map(st => (
                <button
                  key={st.id}
                  onClick={() => setExpIncFilterStatus(st.id)}
                  className={`px-2.5 py-1 rounded-lg border font-bold shrink-0 transition-all ${
                    expIncFilterStatus === st.id
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                      : `${innerInputBg} ${subText}`
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>

            {/* Expected Incomes Summary Banner */}
            <div className={`p-3.5 rounded-2xl border ${isDarkMode ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'} grid grid-cols-2 gap-2 text-xs`}>
              <div>
                <span className={`text-[10px] font-bold ${subText} uppercase block`}>Previsto Pendente no Mês</span>
                <span className="text-sm font-black text-emerald-400">
                  R$ {pendingExpectedIncomeTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="text-right">
                <span className={`text-[10px] font-bold ${subText} uppercase block`}>Já Confirmado / Recebido</span>
                <span className="text-sm font-black text-blue-400">
                  R$ {completedIncomesTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Expected Incomes List */}
            <div className="space-y-2 pt-1">
              {filteredExpectedIncomes.filter(item => {
                if (expIncFilterStatus === 'pending') return item.status === 'pending';
                if (expIncFilterStatus === 'received') return item.status === 'received';
                if (expIncFilterStatus === 'recurring') return item.isRecurring;
                return true;
              }).length === 0 ? (
                <div className={`p-4 rounded-2xl border ${cardBg} text-center py-5`}>
                  <p className="text-xs font-bold text-slate-300">Nenhuma receita prevista encontrada</p>
                  <p className={`text-[10px] ${subText}`}>Cadastre entradas futuras para simular o saldo preditivo.</p>
                </div>
              ) : (
                filteredExpectedIncomes.filter(item => {
                  if (expIncFilterStatus === 'pending') return item.status === 'pending';
                  if (expIncFilterStatus === 'received') return item.status === 'received';
                  if (expIncFilterStatus === 'recurring') return item.isRecurring;
                  return true;
                }).map(item => {
                  const isReceived = item.status === 'received';
                  const targetAcc = accounts.find(a => a.id === item.targetAccountId) || accounts[0];

                  return (
                    <div key={item.id} className={`p-3.5 rounded-2xl border ${cardBg} hover:border-emerald-500/40 transition-colors space-y-2.5`}>
                        {/* Top row: Icon, Title, Recurrence badge, Date on left; Amount & Status on right */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                            <ModernIcon icon={isReceived ? CheckCircle2 : Clock} color={isReceived ? 'blue' : 'emerald'} size="md" />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-bold truncate block">{item.title || '(Sem Título)'}</span>
                                {item.isRecurring && (
                                  <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 shrink-0">
                                    Recorrente (Dia {item.recurrenceDay || '05'})
                                  </span>
                                )}
                              </div>
                              <span className={`text-[10px] ${subText} block truncate mt-0.5`}>
                                {item.category} • Previsão: {item.expectedDate.split('-').reverse().join('/')}
                              </span>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-sm font-black text-emerald-400 block">
                              + R$ {item.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md border inline-block mt-0.5 ${
                              isReceived ? 'bg-blue-500/15 text-blue-400 border-blue-500/30' : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            }`}>
                              {isReceived ? 'Recebido' : 'Previsto'}
                            </span>
                          </div>
                        </div>

                        {/* Bottom row: Destination Account on left; Action Buttons on right */}
                        <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[10px]">
                          <span className={`${subText} truncate flex-1 mr-2`}>
                            Destino: <strong className="text-slate-300 font-medium">{isReceived && targetAcc ? targetAcc.name : 'A definir ao receber'}</strong>
                          </span>

                          <div className="flex items-center space-x-1.5 shrink-0">
                            {!isReceived && (
                              <button
                                onClick={() => handleOpenReceiveModal(item)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold flex items-center gap-1 shadow-sm active:scale-95 transition-all"
                                title="Escolher conta e depositar valor"
                              >
                                <Check className="w-3 h-3 stroke-[3]" />
                                <span>Receber</span>
                              </button>
                            )}
                            <button
                              onClick={() => handleOpenEditExpectedIncome(item)}
                              className="p-1 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                              title="Editar Receita Prevista"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => { handleDeleteExpectedIncome(item.id); removeDocument('expected_incomes', item.id); }}
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                              title="Excluir Receita Prevista"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                  );
                })
              )}
            </div>
          </section>

          {/* SEÇÕES SECUNDÁRIAS: Orçamento & Meta de Quitação */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* CARD 1: Comprometimento do Orçamento Total */}
            <div className={`p-4 sm:p-5 rounded-3xl border ${cardBg} space-y-4 shadow-xl relative overflow-hidden`}>
              <div className="flex justify-between items-start">
                <div>
                  <span className={`text-[10px] font-extrabold uppercase tracking-widest ${subText} block`}>Orçamento vs Gastos</span>
                  <h3 className="text-sm font-black uppercase text-blue-400">Comprometimento Total</h3>
                </div>
                <ModernIcon icon={Activity} color="blue" size="sm" />
              </div>

              <div className="flex flex-col items-center justify-center pt-2 pb-1">
                <div className="relative w-40 h-20 overflow-hidden flex flex-col items-center justify-end">
                  <svg className="absolute top-0 left-0 w-full h-[200%]" viewBox="0 0 100 100">
                    <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke={isDarkMode ? '#2d2f3a' : '#e2e8f0'} strokeWidth="12" strokeLinecap="round" />
                    <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke={overallBudgetCommitmentPct > 80 ? '#f43f5e' : overallBudgetCommitmentPct > 60 ? '#fbbf24' : '#3b82f6'} strokeWidth="12" strokeLinecap="round" 
                      strokeDasharray="125.66" strokeDashoffset={125.66 - (125.66 * Math.min(overallBudgetCommitmentPct, 100)) / 100} 
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute bottom-0 text-center flex flex-col items-center leading-none">
                    <span className={`text-2xl font-black ${overallBudgetCommitmentPct > 80 ? 'text-rose-400' : overallBudgetCommitmentPct > 60 ? 'text-amber-400' : 'text-blue-400'}`}>
                      {overallBudgetCommitmentPct}%
                    </span>
                    <span className={`text-[9px] font-bold mt-1 px-2 py-0.5 rounded-full ${overallBudgetCommitmentPct > 80 ? 'text-rose-400 bg-rose-400/10' : overallBudgetCommitmentPct > 60 ? 'text-amber-400 bg-amber-400/10' : 'text-emerald-400 bg-emerald-400/10'}`}>
                      {overallBudgetCommitmentPct > 80 ? '🔴 Elevado' : overallBudgetCommitmentPct > 60 ? '🟡 Moderado' : '🟢 Excelente'}
                    </span>
                  </div>
                </div>
              </div>

              <div className={`p-2.5 rounded-2xl border ${innerInputBg} space-y-1.5 text-[11px]`}>
                <div className="flex justify-between">
                  <span className={subText}>Receita Orçada (Totais):</span>
                  <span className="font-bold text-emerald-400">R$ {totalPlannedBudgetIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span className={subText}>Comprometido Total:</span>
                  <span className="font-bold text-rose-400">R$ {totalPlannedExpensesAndCommitments.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            {/* CARD 2: Meta de Quitação de Dívidas Ativas */}
            <div className={`p-4 sm:p-5 rounded-3xl border ${cardBg} space-y-3 shadow-xl relative overflow-hidden`}>
              <div className="flex justify-between items-start">
                <div>
                  <span className={`text-[10px] font-extrabold uppercase tracking-widest ${subText} block`}>Planejamento de Quitação</span>
                  <h3 className="text-sm font-black uppercase text-amber-400">Meta Dívidas Ativas</h3>
                </div>
                <ModernIcon icon={ShieldCheck} color="amber" size="sm" />
              </div>

              <div>
                <span className="text-2xl font-black text-amber-400 block">
                  R$ {totalActiveDebtsGoal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className={`text-[10px] ${subText}`}>Para sanar boletos + cartões + acordos ativos</span>
              </div>

              <div className={`p-2.5 rounded-2xl border ${innerInputBg} space-y-1.5 text-[11px]`}>
                <div className="flex justify-between">
                  <span className={subText}>Boletos Pendentes:</span>
                  <span className="font-bold text-amber-400">R$ {pendingBillsTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span className={subText}>Faturas Cartões Utilizadas:</span>
                  <span className="font-bold text-blue-400">R$ {totalCreditUsed.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span className={subText}>Acordos Serasa Ativos:</span>
                  <span className="font-bold text-rose-400">R$ {activeSerasaAgreementsTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Dashboard Grid for Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Despesas Por Categoria */}
          <section ref={categoryChartRef} className={`p-5 rounded-3xl border ${cardBg} relative overflow-hidden transition-all duration-700`}>
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className={`text-[10px] font-bold uppercase tracking-widest ${subText} mb-0.5`}>Período Atual</p>
                <h3 className={`text-base font-black uppercase tracking-wider ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  DESPESAS DE {monthNames[selectedMonthIndex]?.toUpperCase().slice(0, 3) ?? 'MÊS'}
                </h3>
              </div>
              <div className="flex items-center space-x-2">
                {(activeCategory || animStage !== 'idle') && (
                  <button
                    onClick={handleResetCategory}
                    className={`text-[10px] px-3 py-1.5 rounded-full font-bold transition-all active:scale-95 ${
                      isDarkMode ? 'bg-[#22232c] text-slate-300 hover:bg-[#2b2c37] hover:text-white border border-[#2d2f3a]' : 'bg-slate-200 text-slate-700 hover:bg-slate-300 border border-slate-300'
                    }`}
                  >
                    Ver Todas
                  </button>
                )}
                <button
                  onClick={() => setActiveSheet('categories')}
                  className="text-xs text-blue-400 font-bold flex items-center space-x-1 hover:opacity-80 active:scale-95 transition-all"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Gerenciar ({dynamicCategories.length})</span>
                </button>
              </div>
            </div>


            {/* Enhanced Donut Chart • dashed leader lines + hover expand + scroll collapse */}
            {(() => {
              const CX = 150, CY = 150;
              const OUTER_R = 82, INNER_R = 60;
              const LINE_START_R = OUTER_R + 4;   // where the leader line begins
              const LINE_END_R   = OUTER_R + 28;  // where radial part ends (further out)
              const ELBOW_LEN    = 14;             // horizontal elbow length
              const toRad = (deg) => ((deg - 90) * Math.PI) / 180;

              const buildArc = (startDeg, endDeg, expand = 0) => {
                const s = startDeg + 0.8, e = endDeg - 0.8;
                if (e <= s) return '';
                const oR = OUTER_R + expand, iR = INNER_R - expand;
                const cos = Math.cos, sin = Math.sin;
                const sx = CX + oR * cos(toRad(s)), sy = CY + oR * sin(toRad(s));
                const ex = CX + oR * cos(toRad(e)), ey = CY + oR * sin(toRad(e));
                const ix = CX + iR * cos(toRad(e)), iy = CY + iR * sin(toRad(e));
                const jx = CX + iR * cos(toRad(s)), jy = CY + iR * sin(toRad(s));
                const large = (e - s) > 180 ? 1 : 0;
                return `M${sx} ${sy} A${oR} ${oR} 0 ${large} 1 ${ex} ${ey} L${ix} ${iy} A${iR} ${iR} 0 ${large} 0 ${jx} ${jy}Z`;
              };

              let cumDeg = 0;
              const segments = dynamicCategories.filter(c => c.allocated > 0).map(cat => {
                const pct = (cat.allocated / totalCategoryExpenses) * 100;
                const angle = (pct / 100) * 360;
                const startDeg = cumDeg;
                const endDeg = cumDeg + angle;
                const midDeg = cumDeg + angle / 2;
                cumDeg = endDeg;
                return { cat, pct, startDeg, endDeg, midDeg };
              });

              return (
                <div
                  className={`relative w-full mt-2 donut-wrapper donut-scroll-expand`}
                  style={{ paddingLeft: '52px', paddingRight: '52px', paddingTop: '24px', paddingBottom: '24px' }}
                  onMouseLeave={() => { if (activeCategory) handleResetCategory(); }}
                >
                  <svg
                    key={catAnimKey}
                    viewBox="0 0 300 300"
                    className="w-full max-w-[320px] mx-auto block"
                    style={{ overflow: 'visible' }}
                  >
                    {/* Background ring */}
                    <circle
                      cx={CX}
                      cy={CY}
                      r={(OUTER_R + INNER_R) / 2}
                      fill="none"
                      stroke={isDarkMode ? '#1e2029' : '#e2e8f0'}
                      strokeWidth={OUTER_R - INNER_R}
                    />

                    {/* Segments + dashed flowing leader lines + labels */}
                    {totalCategoryExpenses > 0 ? (() => {
                      const mapped = segments.map((seg) => {
                        const midRad = toRad(seg.midDeg);
                        const cos = Math.cos(midRad);
                        const sin = Math.sin(midRad);
                        const isRight = cos >= 0;
                        const lx1 = CX + LINE_START_R * cos;
                        const ly1 = CY + LINE_START_R * sin;
                        const lx2 = CX + LINE_END_R * cos;
                        const ly2 = CY + LINE_END_R * sin;
                        return { ...seg, midRad, cos, sin, isRight, lx1, ly1, lx2, ly2, labelY: ly2 };
                      });

                      const rightItems = mapped.filter(m => m.isRight).sort((a, b) => a.labelY - b.labelY);
                      for (let i = 1; i < rightItems.length; i++) {
                        if (rightItems[i].labelY - rightItems[i - 1].labelY < 20) {
                          rightItems[i].labelY = rightItems[i - 1].labelY + 20;
                        }
                      }

                      const leftItems = mapped.filter(m => !m.isRight).sort((a, b) => a.labelY - b.labelY);
                      for (let i = 1; i < leftItems.length; i++) {
                        if (leftItems[i].labelY - leftItems[i - 1].labelY < 20) {
                          leftItems[i].labelY = leftItems[i - 1].labelY + 20;
                        }
                      }

                      return mapped.map(({ cat, pct, startDeg, endDeg, midDeg, isRight, lx1, ly1, lx2, ly2, labelY }) => {
                        const isSelected = (activeCategory || pendingCategory)?.id === cat.id;
                        const expand = isSelected ? 6 : 0;
                        const arcD = buildArc(startDeg, endDeg, expand);
                        const elbowX  = lx2 + (isRight ? ELBOW_LEN : -ELBOW_LEN);
                        const textX   = elbowX + (isRight ? 4 : -4);
                        const anchor  = isRight ? 'start' : 'end';
                        const dashDuration = isSelected ? '0.45s' : '0.9s';
                        const lineOpacity  = isSelected ? 1 : 0.6;
                        const lineW        = isSelected ? '1.8' : '1.2';

                      return (
                        <g key={cat.id}>
                          {/* Arc segment */}
                          <path
                            d={arcD}
                            fill={cat.color}
                            opacity={(activeCategory || pendingCategory) && !isSelected ? 0.22 : 1}
                            style={{
                              filter: isSelected ? `drop-shadow(0 0 10px ${cat.color})` : 'none',
                              transition: 'all 0.42s cubic-bezier(0.34,1.56,0.64,1)',
                              cursor: 'pointer'
                            }}
                            onMouseEnter={() => handleSelectCategory(cat)}
                            onClick={(e) => { e.stopPropagation(); handleSelectCategory(cat); }}
                          />

                          {/* Radial dashed leader line */}
                          <line
                            x1={lx1} y1={ly1} x2={lx2} y2={labelY}
                            stroke={cat.color}
                            strokeWidth={lineW}
                            opacity={lineOpacity}
                            strokeDasharray="4 4"
                            style={{
                              animation: `dashFlow ${dashDuration} linear infinite`,
                              transition: 'opacity 0.3s ease, stroke-width 0.3s ease'
                            }}
                          />
                          {/* Horizontal elbow (solid) */}
                          <line
                            x1={lx2} y1={labelY} x2={elbowX} y2={labelY}
                            stroke={cat.color}
                            strokeWidth={lineW}
                            opacity={lineOpacity}
                            style={{ transition: 'all 0.3s ease' }}
                          />
                          {/* Dot at elbow end */}
                          <circle
                            cx={elbowX}
                            cy={labelY}
                            r="2"
                            fill={cat.color}
                            opacity={lineOpacity}
                            style={{ transition: 'all 0.3s ease' }}
                          />

                          {/* Category name */}
                          <text
                            x={textX}
                            y={labelY - 4}
                            textAnchor={anchor}
                            fill={cat.color}
                            fontSize={isSelected ? '10.5' : '9'}
                            fontWeight={isSelected ? '800' : '700'}
                            style={{ transition: 'all 0.3s ease', fontFamily: 'inherit' }}
                          >
                            {cat.name}
                          </text>
                          {/* Percentage */}
                          <text
                            x={textX}
                            y={labelY + 8}
                            textAnchor={anchor}
                            fill={cat.color}
                            fontSize="8"
                            fontWeight="600"
                            opacity={isSelected ? 1 : 0.72}
                            style={{ transition: 'all 0.3s ease', fontFamily: 'inherit' }}
                          >
                            {Math.round(pct)}%
                          </text>
                        </g>
                      );
                    });
                  })() : (
                    <text x={CX} y={CY + 4} textAnchor="middle" fill="#64748b" fontSize="11">Sem dados</text>
                  )}

                    {/* Center text • TOTAL or selected category */}
                    <text
                      x={CX} y={CY - 11}
                      textAnchor="middle"
                      fill={isDarkMode ? '#94a3b8' : '#64748b'}
                      fontSize="9"
                      fontWeight="700"
                      letterSpacing="1.5"
                      style={{ textTransform: 'uppercase', fontFamily: 'inherit' }}
                    >
                      {activeCategory ? activeCategory.name : 'TOTAL'}
                    </text>
                    <text
                      x={CX} y={CY + 11}
                      textAnchor="middle"
                      fill={activeCategory ? activeCategory.color : (isDarkMode ? '#ffffff' : '#0f172a')}
                      fontSize="14"
                      fontWeight="800"
                      style={{ transition: 'fill 0.4s ease', fontFamily: 'inherit' }}
                    >
                      {`R$ ${(activeCategory
                        ? activeCategory.allocated
                        : totalCategoryExpenses
                      ).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    </text>
                  </svg>
                </div>
              );
            })()}
          </section>

          {/* Comparative Revenue vs Expenses Line Chart */}
          <section ref={lineChartRef} className={`p-5 rounded-3xl border ${cardBg} space-y-4 relative overflow-hidden shadow-xl`}>
            <div className="flex justify-between items-start">
              <div>
                <p className={`text-[10px] font-bold uppercase tracking-widest ${subText} mb-0.5`}>Comparativo</p>
                <h3 className={`text-base font-black uppercase tracking-wider ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  Fluxo Preditivo
                </h3>
                <div className="flex items-center space-x-3 mt-1.5">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-6 h-1.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50"></span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${subText}`}>Receita</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-6 h-1.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50"></span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${subText}`}>Gastos</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end space-y-2">
                <div className={`p-0.5 rounded-xl border ${innerInputBg} flex space-x-0.5 text-[10px] font-bold`}>
                  {['3M', '6M', '12M'].map((p) => (
                    <button
                      key={p}
                      onClick={() => {
                        setCompChartPeriod(p);
                        setHoveredPointIndex(null);
                      }}
                      className={`px-2.5 py-1 rounded-lg transition-all font-bold ${
                        compChartPeriod === p
                          ? 'bg-blue-600 text-white shadow-sm'
                          : `${subText} ${isDarkMode ? 'hover:text-white' : 'hover:text-slate-900'}`
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <span className={`text-xs font-bold ${
                  netMargin >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {netMargin >= 0 ? '+' : ''}R$ {netMargin.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                </span>
              </div>
            </div>

            <div key={lineAnimKey} className="relative h-56 w-full pt-1 pb-2">
              <svg
                className="w-full h-full overflow-visible"
                viewBox="0 0 340 165"
                preserveAspectRatio="none"
              >
                <defs>
                  <clipPath id={`lineClip_${lineAnimKey}`}>
                    <rect x="0" y="0" width="340" height="165" className="animate-clip-reveal" />
                  </clipPath>

                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
                  </linearGradient>
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity="0.02" />
                  </linearGradient>

                  <filter id="badgeShadow" x="-10%" y="-10%" width="120%" height="120%">
                    <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.6" />
                  </filter>
                </defs>

                <line x1="15" y1="20" x2="325" y2="20" stroke={isDarkMode ? "#334155" : "#e2e8f0"} strokeWidth="1" strokeDasharray="3 3" />
                <line x1="15" y1="50" x2="325" y2="50" stroke={isDarkMode ? "#334155" : "#e2e8f0"} strokeWidth="1" strokeDasharray="3 3" />
                <line x1="15" y1="80" x2="325" y2="80" stroke={isDarkMode ? "#334155" : "#e2e8f0"} strokeWidth="1" strokeDasharray="3 3" />
                <line x1="15" y1="110" x2="325" y2="110" stroke={isDarkMode ? "#334155" : "#e2e8f0"} strokeWidth="1" strokeDasharray="3 3" />

                {(() => {
                  const data = comparisonData;
                  const allVals = data.flatMap(d => [d.income, d.expense]);
                  const rawMin = Math.min(...allVals);
                  const rawMax = Math.max(...allVals);
                  const minVal = Math.max(0, rawMin - (rawMax - rawMin) * 0.25);
                  const maxVal = rawMax + (rawMax - rawMin) * 0.25;

                  const padLeft = 25;
                  const padRight = 25;
                  const width = 340;
                  const usableWidth = width - padLeft - padRight;
                  const height = 88;
                  const topOffset = 22;

                  const pointsIncome = data.map((d, i) => {
                    const x = padLeft + (i / Math.max(1, data.length - 1)) * usableWidth;
                    const y = height - ((d.income - minVal) / Math.max(1, maxVal - minVal)) * height + topOffset;
                    return { x, y, val: d.income, label: d.label };
                  });

                  const pointsExpense = data.map((d, i) => {
                    const x = padLeft + (i / Math.max(1, data.length - 1)) * usableWidth;
                    const y = height - ((d.expense - minVal) / Math.max(1, maxVal - minVal)) * height + topOffset;
                    return { x, y, val: d.expense, label: d.label };
                  });

                  const buildSmoothPath = (pts) => {
                    if (pts.length < 2) return pts.length === 1 ? `M ${pts[0].x},${pts[0].y}` : '';
                    let d = `M ${pts[0].x},${pts[0].y}`;
                    for (let i = 1; i < pts.length; i++) {
                      const prev = pts[i - 1];
                      const curr = pts[i];
                      const cpX = (prev.x + curr.x) / 2;
                      d += ` C ${cpX},${prev.y} ${cpX},${curr.y} ${curr.x},${curr.y}`;
                    }
                    return d;
                  };

                  const pathIncomeStr = buildSmoothPath(pointsIncome);
                  const pathExpenseStr = buildSmoothPath(pointsExpense);

                  const areaIncomeStr = `${pathIncomeStr} L ${padLeft + usableWidth},122 L ${padLeft},122 Z`;
                  const areaExpenseStr = `${pathExpenseStr} L ${padLeft + usableWidth},122 L ${padLeft},122 Z`;

                  const maxIncomeVal = Math.max(...pointsIncome.map(p => p.val));
                  const maxExpenseVal = Math.max(...pointsExpense.map(p => p.val));

                  return (
                    <g clipPath={`url(#lineClip_${lineAnimKey})`}>
                      <path d={areaIncomeStr} fill="url(#incomeGrad)" />
                      <path d={areaExpenseStr} fill="url(#expenseGrad)" />

                      <path d={pathIncomeStr} fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" className="transition-all duration-500" />
                      <path d={pathExpenseStr} fill="none" stroke="#f87171" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" className="transition-all duration-500" />

                      {pointsIncome.map((pt, idx) => {
                        const expPt = pointsExpense[idx];
                        const isHovered = hoveredPointIndex === idx;
                        const isFirst = idx === 0;
                        const isLast = idx === pointsIncome.length - 1;

                        const showIncomeVal = (pt.val > 0 && (isFirst || isLast || pt.val === maxIncomeVal)) || (isHovered && pt.val > 0);
                        const showExpenseVal = (expPt.val > 0 && (isFirst || isLast || expPt.val === maxExpenseVal)) || (isHovered && expPt.val > 0);

                        return (
                          <g key={idx} className="cursor-pointer" onMouseEnter={() => setHoveredPointIndex(idx)} onClick={() => setHoveredPointIndex(idx)}>
                            {isHovered && (
                              <line x1={pt.x} y1="10" x2={pt.x} y2="135" stroke="#34d399" strokeWidth="1.5" strokeDasharray="3 3" />
                            )}

                            <circle 
                              cx={pt.x} 
                              cy={pt.y} 
                              r={isHovered ? "6" : "4"} 
                              fill="#10b981" 
                              stroke={isDarkMode ? "#0f172a" : "#ffffff"} 
                              strokeWidth="2" 
                              className="transition-all duration-300"
                            />

                            <circle 
                              cx={expPt.x} 
                              cy={expPt.y} 
                              r={isHovered ? "6" : "4"} 
                              fill="#ef4444" 
                              stroke={isDarkMode ? "#0f172a" : "#ffffff"} 
                              strokeWidth="2" 
                              className="transition-all duration-300"
                            />

                            {showIncomeVal && (
                              <g transform={`translate(${pt.x + (isLast ? -20 : isFirst ? 20 : 0)}, ${pt.y < 50 ? pt.y + 16 : pt.y - 14})`}>
                                <rect 
                                  x="-36" 
                                  y="-12" 
                                  width="72" 
                                  height="13" 
                                  rx="4" 
                                  fill={isDarkMode ? "#0f172acc" : "#ffffffdd"} 
                                  stroke="#10b981" 
                                  strokeWidth="0.8"
                                  filter="url(#badgeShadow)" 
                                />
                                <text
                                  x="0"
                                  y="-2"
                                  textAnchor="middle"
                                  fill="#34d399"
                                  fontSize="8.5"
                                  fontWeight="800"
                                >
                                  R$ {pt.val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </text>
                              </g>
                            )}

                            {showExpenseVal && (
                              <g transform={`translate(${expPt.x + (isLast ? -20 : isFirst ? 20 : 0)}, ${expPt.y < 50 ? expPt.y + 16 : expPt.y - 14})`}>
                                <rect 
                                  x="-36" 
                                  y="-12" 
                                  width="72" 
                                  height="13" 
                                  rx="4" 
                                  fill={isDarkMode ? "#0f172acc" : "#ffffffdd"} 
                                  stroke="#ef4444" 
                                  strokeWidth="0.8"
                                  filter="url(#badgeShadow)"
                                />
                                <text
                                  x="0"
                                  y="-2"
                                  textAnchor="middle"
                                  fill="#f87171"
                                  fontSize="8.5"
                                  fontWeight="800"
                                >
                                  R$ {expPt.val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </text>
                              </g>
                            )}

                            <text 
                              x={pt.x} 
                              y="152" 
                              textAnchor="middle" 
                              fill={isHovered ? (isDarkMode ? "#ffffff" : "#0f172a") : (isDarkMode ? "#94a3b8" : "#64748b")} 
                              fontSize="10" 
                              fontWeight={isHovered ? "900" : "700"}
                            >
                              {pt.label}
                            </text>
                          </g>
                        );
                      })}
                    </g>
                  );
                })()}
              </svg>
            </div>

              {hoveredPointIndex !== null && comparisonData[hoveredPointIndex] && (() => {
                const item = comparisonData[hoveredPointIndex];
                const netDiff = item.income - item.expense;
                const isNetPositive = netDiff >= 0;
                const isLastTwo = hoveredPointIndex >= comparisonData.length - 2;
                const isFirstTwo = hoveredPointIndex <= 1;

                return (
                  <div 
                    className={`absolute top-0 -translate-y-2 p-3 rounded-2xl border ${isDarkMode ? 'bg-slate-900/95 border-slate-700 text-white backdrop-blur-md' : 'bg-white/95 border-slate-200 text-slate-900 backdrop-blur-md'} shadow-2xl text-xs space-y-1.5 pointer-events-none z-30 transition-all min-w-[170px]`}
                    style={
                      isLastTwo 
                        ? { right: '10px', left: 'auto', transform: 'none' } 
                        : isFirstTwo 
                        ? { left: '10px', right: 'auto', transform: 'none' } 
                        : { left: `${(hoveredPointIndex / Math.max(1, comparisonData.length - 1)) * 100}%`, transform: 'translateX(-50%)' }
                    }
                  >
                    <div className="font-extrabold border-b border-slate-700/50 pb-1 flex justify-between space-x-3 items-center">
                      <span className="text-white">{item.label}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-md border font-bold ${
                        isNetPositive 
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                          : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                      }`}>
                        Resultado: {isNetPositive ? '+' : '-'}R$ {Math.abs(netDiff).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                    <div className="flex justify-between space-x-3 text-emerald-400 font-bold">
                      <span>Faturamento:</span>
                      <span className="text-white">R$ {item.income.toLocaleString('pt-BR')}</span>
                    </div>
                    <div className="flex justify-between space-x-3 text-rose-400 font-bold">
                      <span>Gastos:</span>
                      <span className="text-white">R$ {item.expense.toLocaleString('pt-BR')}</span>
                    </div>
                  </div>
                );
              })()}

            <div className={`p-2.5 rounded-2xl border ${innerInputBg} grid grid-cols-2 gap-2 text-center text-xs font-extrabold`}>
              <div className="flex items-center justify-center space-x-1.5 text-emerald-400">
                <ModernIcon icon={TrendingUp} color="emerald" size="sm" className="border-0 bg-transparent p-0 w-4 h-4" />
                <span>Média: R$ {Math.round(totalPeriodIncome / Math.max(1, comparisonData.length)).toLocaleString('pt-BR')}/mês</span>
              </div>
              {(() => {
                const isPositiveMargin = netMargin >= 0;
                let marginLabel = '0.0% livre';
                if (totalPeriodIncome > 0) {
                  const pct = (netMargin / totalPeriodIncome) * 100;
                  marginLabel = pct >= 0 ? `+${pct.toFixed(1)}% livre` : `${pct.toFixed(1)}% (Déficit)`;
                } else if (totalPeriodExpense > 0) {
                  marginLabel = '-100% (Sem receitas)';
                }

                return (
                  <div className={`flex items-center justify-center space-x-1.5 ${isPositiveMargin ? 'text-emerald-400' : 'text-rose-400'}`}>
                    <ModernIcon icon={isPositiveMargin ? TrendingUp : TrendingDown} color={isPositiveMargin ? 'emerald' : 'rose'} size="sm" className="border-0 bg-transparent p-0 w-4 h-4" />
                    <span>Margem: {marginLabel}</span>
                  </div>
                );
              })()}
            </div>
          </section>

          </div> {/* End Charts Grid */}

          {/* Últimos Lançamentos */}
          <section className="space-y-0">
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className={`text-[10px] font-bold uppercase tracking-widest ${subText} mb-0.5`}>Histórico</p>
                <h3 className={`text-base font-black uppercase tracking-wider ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Últimos Lançamentos</h3>
              </div>
              <span className={`text-xs font-bold px-3 py-1 rounded-xl ${
                isDarkMode ? 'bg-[#22232c] text-slate-400 border border-[#2d2f3a]' : 'bg-slate-100 text-slate-500 border border-slate-200'
              }`}>{filteredTransactions.length} no período</span>
            </div>

            <div className={`rounded-3xl border overflow-hidden ${cardBg}`}>
              {filteredTransactions.length === 0 ? (
                <div className="text-center py-10 px-4">
                  <p className={`text-sm ${subText}`}>Nenhuma transação neste período.</p>
                </div>
              ) : (
                filteredTransactions.map((tx, txIdx) => {
                  const catData = categories.find(c => c.name === tx.category);
                  const txColor = tx.type === 'income' ? '#34d399' : (catData?.color ?? '#60a5fa');
                  return (
                  <div
                    key={tx.id}
                    className={`flex items-center px-4 py-3.5 gap-3 ${
                      txIdx < filteredTransactions.length - 1
                        ? `border-b ${isDarkMode ? 'border-[#252732]' : 'border-slate-100'}`
                        : ''
                    }`}
                  >
                    <div 
                      className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border"
                      style={{ background: `${txColor}20`, borderColor: `${txColor}35` }}
                    >
                      {tx.type === 'income'
                        ? <DollarSign className="w-5 h-5" style={{ color: txColor }} />
                        : <Tag className="w-5 h-5" style={{ color: txColor }} />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{tx.title}</p>
                      <p className={`text-xs ${subText} truncate`}>{tx.dayGroup} • {tx.category}</p>
                    </div>

                    <div className="text-right shrink-0 flex items-center space-x-3">
                      <div>
                        <span className={`text-sm font-extrabold block ${
                          tx.type === 'income' ? 'text-emerald-400' : isDarkMode ? 'text-slate-200' : 'text-slate-700'
                        }`}>
                          {tx.type === 'income' ? '+' : '-'} R$ {tx.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>

                      <button
                        onClick={(e) => handleDeleteTransactionInline(tx.id, e)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Excluir Lançamento"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  );
                })
              )}
            </div>
          </section>

          

          {/* Serasa Debt Monitoring & Payoff Planning Section (POSITIONED LAST) */}
          <section className={`p-5 rounded-3xl border ${cardBg} space-y-4 relative overflow-hidden shadow-xl`}>
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <ModernIcon icon={ShieldAlert} color="rose" size="md" />
                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider flex items-center space-x-1 text-rose-400">
                    <span>Monitoramento Serasa</span>
                  </h3>
                  <span className={`text-[10px] ${subText}`}>Planejamento de Limpeza do Nome</span>
                </div>
              </div>

              <button
                onClick={() => setActiveSheet('add-serasa')}
                className="text-xs text-rose-400 font-bold hover:underline flex items-center space-x-1"
              >
                <span>+ Cadastrar</span>
              </button>
            </div>

            {/* Serasa Search & Status Filter Bar */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center space-x-2">
                <input 
                  type="text" 
                  placeholder="Buscar credor / empresa..." 
                  value={serasaSearchQuery} 
                  onChange={(e) => setSerasaSearchQuery(e.target.value)}
                  className={`flex-1 p-2 rounded-xl text-xs border ${innerInputBg}`}
                />
              </div>

              <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none text-[10px]">
                {[
                  { id: 'all', label: 'Todas' },
                  { id: 'negativado', label: 'Negativadas' },
                  { id: 'em_acordo', label: 'Em Acordo' },
                  { id: 'quitado', label: 'Quitadas' }
                ].map((st) => (
                  <button
                    key={st.id}
                    onClick={() => setSerasaFilterStatus(st.id)}
                    className={`px-2.5 py-1 rounded-lg border font-bold shrink-0 transition-all ${
                      serasaFilterStatus === st.id 
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-sm' 
                        : `${innerInputBg} ${subText}`
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Score Recovery & Discount Banner */}
            <div className={`p-3.5 rounded-2xl border ${isDarkMode ? 'bg-rose-950/20 border-rose-500/30' : 'bg-rose-50 border-rose-200'} grid grid-cols-2 gap-2 text-xs`}>
              <div className="space-y-0.5">
                <span className={`text-[10px] font-bold ${subText} uppercase block`}>Dívida Original</span>
                <span className="text-sm font-black text-slate-300 line-through decoration-rose-500">
                  R$ {totalSerasaOriginal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] text-emerald-400 font-bold block">
                  Economia: R$ {totalSerasaSavings.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <div className="space-y-0.5 text-right">
                <span className={`text-[10px] font-bold ${subText} uppercase block`}>Oferta p/ Quitação</span>
                <span className="text-sm font-black text-rose-400">
                  R$ {totalSerasaOffers.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] text-blue-400 font-bold flex items-center justify-end space-x-1">
                  <span>+{totalScoreBoostPotential} pts no Score</span>
                </span>
              </div>
            </div>

            {/* Serasa Debts List */}
            <div className="space-y-2 pt-1">
              {serasaDebts.filter(d => {
                const creditorName = String(d.creditor || '').toLowerCase();
                const debtCategory = String(d.category || '').toLowerCase();
                const matchesSearch = creditorName.includes(String(serasaSearchQuery || '').toLowerCase()) || debtCategory.includes(String(serasaSearchQuery || '').toLowerCase());
                if (!matchesSearch) return false;
                if (serasaFilterStatus === 'all') return true;
                return d.status === serasaFilterStatus;
              }).length === 0 ? (
                <div className={`p-4 rounded-2xl border ${cardBg} text-center py-5`}>
                  <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto mb-1 opacity-80" />
                  <p className="text-xs font-bold text-slate-300">Nenhuma dívida encontrada</p>
                  <p className={`text-[10px] ${subText}`}>Tente alterar os termos da busca ou os filtros acima.</p>
                </div>
              ) : (
                serasaDebts
                  .filter(d => {
                    const creditorName = String(d.creditor || '').toLowerCase();
                    const debtCategory = String(d.category || '').toLowerCase();
                    const matchesSearch = creditorName.includes(String(serasaSearchQuery || '').toLowerCase()) || debtCategory.includes(String(serasaSearchQuery || '').toLowerCase());
                    if (!matchesSearch) return false;
                    if (serasaFilterStatus === 'all') return true;
                    return d.status === serasaFilterStatus;
                  })
                  .map((debt) => {
                  const isNegativado = debt.status === 'negativado';
                  const isEmAcordo = debt.status === 'em_acordo';
                  const isQuitado = debt.status === 'quitado';

                  return (
                    <div key={debt.id} className={`relative overflow-hidden p-4 rounded-2xl border ${isQuitado ? (isDarkMode ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200') : isEmAcordo ? (isDarkMode ? 'bg-amber-500/5 border-amber-500/20' : 'bg-amber-50 border-amber-200') : (isDarkMode ? 'bg-rose-500/5 border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.1)]' : 'bg-rose-50 border-rose-300 shadow-sm')} space-y-3 transition-all`}>
                      {!isQuitado && !isEmAcordo && <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/10 rounded-bl-full pointer-events-none"></div>}
                      <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-2.5">
                          <ModernIcon 
                            icon={isQuitado ? CheckCircle2 : isEmAcordo ? Clock : ShieldAlert} 
                            color={isQuitado ? 'emerald' : isEmAcordo ? 'amber' : 'rose'} 
                            size="md" 
                          />
                          <div>
                            <span className="text-xs font-bold block">{debt.creditor}</span>
                            <span className={`text-[10px] ${subText}`}>
                              {debt.category} • Vencimento: {debt.dueDate.split('-').reverse().join('/')}
                            </span>
                          </div>
                        </div>

                        <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md border ${
                          isQuitado 
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' 
                            : isEmAcordo 
                              ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' 
                              : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                        }`}>
                          {isQuitado ? 'Quitado' : isEmAcordo ? 'Em Acordo' : 'Negativado'}
                        </span>
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t border-slate-800/30 text-xs">
                        <div>
                          <span className={`text-[10px] ${subText} block`}>
                            Proposta ({debt.plannedInstallments}x de R$ {debt.monthlyInstallment.toFixed(2)} via {debt.paymentMethod || 'Boleto'}):
                          </span>
                          <div className="flex items-center space-x-2">
                            <span className="font-extrabold text-rose-400">
                              R$ {debt.offerAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                              -{debt.discountPercent}% OFF
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-1.5">
                          {isNegativado && (
                            <>
                              <button
                                onClick={() => handleOpenNegotiateModal(debt)}
                                className="px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30 text-[10px] font-bold active:scale-95 transition-all flex items-center space-x-1"
                                title="Gerar acordo com valor negociado/desconto"
                              >
                                <Check className="w-3 h-3" />
                                <span>Gerar Acordo</span>
                              </button>
                              <button
                                onClick={() => handleToggleSerasaStatus(debt.id, 'quitado')}
                                className="px-2.5 py-1 rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 text-[10px] font-bold active:scale-95 transition-all shadow-sm"
                                title="Quitar dívida integralmente sem desconto"
                              >
                                Quitar Total
                              </button>
                            </>
                          )}
                          {isEmAcordo && (
                            <button
                              onClick={() => handleToggleSerasaStatus(debt.id, 'quitado')}
                              className="px-2.5 py-1 rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 text-[10px] font-bold active:scale-95 transition-all shadow-sm"
                            >
                              Quitar Acordo
                            </button>
                          )}
                          {isQuitado && (
                            <button
                              onClick={() => handleToggleSerasaStatus(debt.id, 'negativado')}
                              className="px-2 py-1 rounded-xl bg-slate-800 text-slate-400 text-[10px] hover:text-white"
                              title="Reabrir"
                            >
                              Reabrir
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteSerasaDebt(debt.id)}
                            className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Excluir Dívida"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

        </main>

        {/* Modal: View All Bills & Filter Central */}
        {activeSheet === 'view-all-bills' && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div className={`w-full max-w-[480px] rounded-t-3xl sm:rounded-3xl border ${cardBg} p-5 space-y-4 animate-in slide-in-from-bottom sm:zoom-in-95 duration-300 shadow-2xl max-h-[88vh] flex flex-col`}>
              
              {/* Header */}
              <div className="flex justify-between items-center shrink-0">
                <h3 className="text-sm font-extrabold flex items-center space-x-2 text-amber-500">
                  <ModernIcon icon={Calendar} color="amber" size="sm" />
                  <span>Central de Boletos & Compromissos</span>
                </h3>
                <button onClick={() => setActiveSheet(null)} className={`p-1.5 rounded-full transition-colors ${isDarkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-200 text-slate-600'}`}>
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Filters & Search */}
              <div className="space-y-2.5 shrink-0">
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Buscar boleto por nome ou categoria..." 
                    value={billSearchQuery} 
                    onChange={(e) => setBillSearchQuery(e.target.value)}
                    className={`w-full p-2.5 rounded-xl text-xs border ${innerInputBg} pl-3`}
                  />
                  {billSearchQuery && (
                    <button 
                      onClick={() => setBillSearchQuery('')}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-white text-xs"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="flex justify-between items-center gap-2">
                  <div className={`p-0.5 rounded-xl border ${innerInputBg} flex flex-1 space-x-1 text-[10px] font-bold`}>
                    {[
                      { id: 'all', label: 'Todos' },
                      { id: 'pending', label: 'Pendentes' },
                      { id: 'paid', label: 'Pagos' },
                      { id: 'serasa', label: 'Acordo Serasa' }
                    ].map((st) => (
                      <button
                        key={st.id}
                        onClick={() => setBillStatusFilter(st.id)}
                        className={`flex-1 py-1 rounded-lg text-center transition-all ${
                          billStatusFilter === st.id 
                            ? 'bg-amber-500 text-slate-950 font-black shadow-sm' 
                            : `${subText} ${isDarkMode ? 'hover:text-white' : 'hover:text-slate-900'}`
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setBillPeriodMode(prev => prev === 'current' ? 'all_time' : 'current')}
                    className={`px-2.5 py-1.5 rounded-xl border text-[10px] font-bold shrink-0 transition-all ${
                      billPeriodMode === 'current' 
                        ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' 
                        : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                    }`}
                  >
                    {billPeriodMode === 'current' ? periodLabel : 'Todo Histórico'}
                  </button>
                </div>
              </div>

              {/* Scrollable Bills List */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-none">
                {modalFilteredBills.length === 0 ? (
                  <div className={`p-6 rounded-2xl border ${innerInputBg} text-center space-y-1 my-4`}>
                    <p className="text-xs font-bold text-slate-300">Nenhum boleto encontrado</p>
                    <p className={`text-[10px] ${subText}`}>Tente alterar a busca ou o filtro de status/período.</p>
                  </div>
                ) : (
                  modalFilteredBills.map((bill) => {
                    const isSerasaAcordo = bill.id.startsWith('b_serasa_');
                    const isPaid = bill.status === 'paid';

                    return (
                      <div 
                        key={bill.id} 
                        className={`p-3.5 rounded-2xl border ${innerInputBg} flex items-center justify-between hover:border-amber-500/40 transition-colors`}
                      >
                        <div className="flex items-center space-x-3">
                          <ModernIcon 
                            icon={isPaid ? CheckCircle2 : isSerasaAcordo ? FileText : CreditCard} 
                            color={isPaid ? 'emerald' : isSerasaAcordo ? 'rose' : bill.urgent ? 'amber' : 'slate'} 
                            size="md" 
                          />
                          <div>
                            <span className={`text-xs font-bold block ${isPaid ? 'line-through opacity-70' : ''}`}>
                              {bill.title}
                            </span>
                            <span className={`text-[10px] ${subText}`}>
                              Vencimento: {bill.dueDate.split('-').reverse().join('/')} • {bill.category}
                            </span>
                          </div>
                        </div>

                        <div className="flex-1 flex justify-center">
                          {bill.fileUrl ? (
                            <button
                              onClick={() => setViewingAttachment({ url: bill.fileUrl, title: bill.title })}
                              className="text-amber-400 hover:text-amber-300 p-1.5 bg-amber-500/15 rounded-xl flex items-center gap-1 text-[10px] font-bold border border-amber-500/30 active:scale-95 transition-all shadow-sm"
                              title="Visualizar Anexo"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>Anexo</span>
                            </button>
                          ) : (
                            <button
                              onClick={(e) => handleOpenEditBill(bill, e)}
                              className="text-slate-400 hover:text-emerald-400 p-1.5 bg-slate-500/10 hover:bg-emerald-500/10 rounded-xl flex items-center gap-1 text-[10px] font-bold border border-dashed border-slate-600/30 hover:border-emerald-500/30 active:scale-95 transition-all"
                              title="Anexar Comprovante ou Boleto"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              <span>+ Anexar</span>
                            </button>
                          )}
                        </div>

                        <div className="text-right flex items-center space-x-2">
                          <div>
                            <span className={`text-xs font-extrabold block ${isPaid ? 'text-emerald-400' : 'text-amber-400'}`}>
                              R$ {bill.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md border ${
                              isPaid 
                                ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' 
                                : isSerasaAcordo 
                                  ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' 
                                  : 'text-amber-500/90 bg-amber-500/10 border-amber-500/20'
                            }`}>
                              {isPaid ? 'Pago' : isSerasaAcordo ? 'Acordo Serasa' : 'Pendente'}
                            </span>
                          </div>

                          <div className="flex flex-col space-y-1">
                            {!isPaid && (
                              <button
                                onClick={(e) => handlePayBillInline(bill.id, e)}
                                className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 text-[10px] font-bold"
                                title="Marcar como Pago"
                              >
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                              </button>
                            )}
                            <button
                              onClick={(e) => handleOpenEditBill(bill, e)}
                              className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 text-[10px]"
                              title="Editar Boleto / Anexo"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => handleDeleteBillInline(bill.id, e)}
                              className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 text-[10px]"
                              title="Excluir"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer Summary */}
              <div className={`p-3 rounded-2xl border ${innerInputBg} flex justify-between items-center text-xs shrink-0`}>
                <span className={subText}>
                  Exibindo <strong className="text-white">{modalFilteredBills.length}</strong> de {baseBillsForModal.length} registros
                </span>
                <span className="font-extrabold text-amber-400">
                  Total: R$ {modalFilteredBills.reduce((s, b) => s + b.amount, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

            </div>
          </div>
        )}

        {/* Modal: Central de Notificações Inteligentes */}
        {activeSheet === 'notifications' && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div className={`w-full max-w-[500px] rounded-t-3xl sm:rounded-3xl border ${cardBg} p-5 space-y-4 animate-in slide-in-from-bottom sm:zoom-in-95 duration-300 shadow-2xl max-h-[90vh] overflow-y-auto scrollbar-none`}>
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-extrabold flex items-center space-x-2 text-indigo-400">
                  <ModernIcon icon={Bell} color="indigo" size="sm" />
                  <span>Central de Alertas Inteligentes</span>
                  {unreadNotifCount > 0 && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-500 text-white">
                      {unreadNotifCount} novos
                    </span>
                  )}
                </h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={async () => {
                      const testNotif = {
                        id: `notif_test_${Date.now()}`,
                        title: '🔔 Teste de Notificação Real',
                        desc: 'Seu aplicativo Família Bazil está conectado e emitindo alertas instantâneos!',
                        type: 'warning',
                        category: 'health',
                        time: 'Agora mesmo',
                        read: false
                      };
                      setNotifications([testNotif, ...notifications]);

                      // 1. Try Native Capacitor LocalNotification
                      try {
                        const perm = await LocalNotifications.requestPermissions();
                        if (perm.display === 'granted') {
                          await LocalNotifications.schedule({
                            notifications: [
                              {
                                title: testNotif.title,
                                body: testNotif.desc,
                                id: Math.floor(Math.random() * 100000),
                                schedule: { at: new Date(Date.now() + 100) }
                              }
                            ]
                          });
                        }
                      } catch (err) {
                        // 2. Fallback to Web Notification API
                        if (typeof window !== 'undefined' && 'Notification' in window) {
                          if (Notification.permission === 'granted') {
                            new Notification(testNotif.title, { body: testNotif.desc, icon: '/bazil_logo.jpg' });
                          } else if (Notification.permission !== 'denied') {
                            const req = await Notification.requestPermission();
                            if (req === 'granted') new Notification(testNotif.title, { body: testNotif.desc, icon: '/bazil_logo.jpg' });
                          }
                        }
                      }
                    }}
                    className="px-2.5 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-extrabold active:scale-95 transition-all shadow-md shadow-indigo-600/20"
                    title="Emitir um alerta de teste imediatamente"
                  >
                    ? Testar Agora
                  </button>
                  <button onClick={() => setActiveSheet(null)} className={`p-1.5 rounded-full transition-colors ${isDarkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-200 text-slate-600'}`}>
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Filter Tabs & Clear Actions */}
              <div className="flex items-center justify-between gap-2 border-b border-slate-700/30 pb-2">
                <div className="flex items-center space-x-1 overflow-x-auto scrollbar-none text-[10px]">
                  {[
                    { id: 'all', label: 'Todas' },
                    { id: 'unread', label: `Não Lidas (${unreadNotifCount})` },
                    { id: 'bills', label: 'Boletos' },
                    { id: 'cards', label: 'Cartões' },
                    { id: 'incomes', label: 'Receitas' },
                    { id: 'health', label: 'Saúde' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setNotifFilterTab(tab.id)}
                      className={`px-2 py-1 rounded-lg font-bold shrink-0 transition-all ${
                        notifFilterTab === tab.id
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : `${innerInputBg} ${subText}`
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {unreadNotifCount > 0 && (
                  <button
                    onClick={handleMarkAllNotifsAsRead}
                    className="text-[10px] text-blue-400 font-bold hover:underline shrink-0"
                  >
                    Marcar lidas
                  </button>
                )}
              </div>

              {/* Notification Items List */}
              <div className="space-y-2.5 pt-1">
                {computedNotifications.filter(n => {
                  if (notifFilterTab === 'unread') return !n.read;
                  if (notifFilterTab === 'bills') return n.category === 'bills';
                  if (notifFilterTab === 'cards') return n.category === 'cards';
                  if (notifFilterTab === 'incomes') return n.category === 'incomes';
                  if (notifFilterTab === 'health') return n.category === 'health';
                  return true;
                }).length === 0 ? (
                  <div className="text-center py-8 px-4">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-1 opacity-80" />
                    <p className="text-xs font-bold text-slate-300">Tudo em dia por aqui!</p>
                    <p className={`text-[10px] ${subText}`}>Você não possui novos alertas para esta categoria.</p>
                  </div>
                ) : (
                  computedNotifications.filter(n => {
                    if (notifFilterTab === 'unread') return !n.read;
                    if (notifFilterTab === 'bills') return n.category === 'bills';
                    if (notifFilterTab === 'cards') return n.category === 'cards';
                    if (notifFilterTab === 'incomes') return n.category === 'incomes';
                    if (notifFilterTab === 'health') return n.category === 'health';
                    return true;
                  }).map((notif) => {
                    const isAlert = notif.type === 'alert';
                    const isWarning = notif.type === 'warning';
                    const isSuccess = notif.type === 'success';

                    return (
                      <div
                        key={notif.id}
                        className={`p-3.5 rounded-2xl border transition-all space-y-2 ${
                          !notif.read
                            ? isDarkMode ? 'bg-[#1e2230] border-indigo-500/40 shadow-lg' : 'bg-indigo-50/80 border-indigo-200'
                            : `${innerInputBg} opacity-85`
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-center space-x-2">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${
                              isAlert ? 'bg-rose-500 animate-pulse' : isWarning ? 'bg-amber-400' : isSuccess ? 'bg-emerald-400' : 'bg-blue-400'
                            }`}></span>
                            <span className={`text-xs font-extrabold ${
                              isAlert ? 'text-rose-400' : isWarning ? 'text-amber-400' : isSuccess ? 'text-emerald-400' : 'text-blue-400'
                            }`}>
                              {notif.title}
                            </span>
                          </div>

                          <span className={`text-[9.5px] font-bold ${subText} shrink-0`}>
                            {notif.time}
                          </span>
                        </div>

                        <p className={`text-xs ${subText} leading-relaxed`}>{notif.desc}</p>

                        <div className="flex justify-between items-center pt-1 border-t border-slate-700/20 text-[11px]">
                          {!notif.read ? (
                            <button
                              onClick={() => handleMarkNotifAsRead(notif.id)}
                              className="text-[10px] text-slate-400 hover:text-white font-semibold"
                            >
                              Marcar como lida
                            </button>
                          ) : (
                            <span className="text-[10px] text-emerald-400 font-bold">✓ Lida</span>
                          )}

                          {notif.actionLabel && (
                            <button
                              onClick={() => handleNotifAction(notif)}
                              className={`px-3 py-1 rounded-xl text-[10px] font-extrabold active:scale-95 transition-all shadow-sm ${
                                isAlert ? 'bg-rose-600 text-white hover:bg-rose-500' 
                                : isSuccess ? 'bg-emerald-600 text-white hover:bg-emerald-500' 
                                : 'bg-indigo-600 text-white hover:bg-indigo-500'
                              }`}
                            >
                              {notif.actionLabel}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

                {/* Modal: Pay Bill Confirmation */}
        {activeSheet === 'pay-bill' && billToPay && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div className={`w-full max-w-[480px] rounded-t-3xl sm:rounded-3xl border ${cardBg} p-5 space-y-4 animate-in slide-in-from-bottom sm:zoom-in-95 duration-300 shadow-2xl max-h-[90vh] overflow-y-auto scrollbar-none`}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-extrabold flex items-center space-x-2 text-emerald-500">
                  <ModernIcon icon={CheckCircle2} color="emerald" size="sm" />
                  <span>Confirmar Pagamento</span>
                </h3>
                <button onClick={() => { setActiveSheet(null); setBillToPay(null); }} className={`p-1.5 rounded-full transition-colors ${isDarkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-200 text-slate-600'}`}>
                  <X className="w-5 h-5" />
                </button>
              </div>
          {billToPay && (
            <div className="space-y-6 pb-6 px-4">
              <div className="text-center space-y-1">
                <span className={`text-xs uppercase tracking-widest font-black ${subText}`}>Pagando Boleto</span>
                <h3 className="text-xl font-bold text-white truncate px-4">{billToPay.title}</h3>
              </div>
              {payBillError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-center">
                  <p className="text-xs font-bold text-rose-400">{payBillError}</p>
                </div>
              )}

              <div className="space-y-4">
                {billToPay.groupId && (
                  <label className={`flex items-center space-x-3 p-3 rounded-2xl border ${innerInputBg} cursor-pointer mb-2`}>
                    <input
                      type="checkbox"
                      checked={payBillUpdateFuture}
                      onChange={(e) => setPayBillUpdateFuture(e.target.checked)}
                      className="w-5 h-5 rounded cursor-pointer accent-emerald-500"
                    />
                    <div>
                      <span className="text-xs font-bold block">Atualizar meses futuros</span>
                      <span className={`text-[10px] ${subText}`}>Aplicar este novo valor para os próximos boletos desta recorrência.</span>
                    </div>
                  </label>
                )}
                
                <div className="space-y-1">
                  <label className={`text-[10px] font-bold uppercase tracking-wider ${subText} ml-1`}>Valor Pago</label>
                  <div className="relative">
                    <span className={`absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold ${subText}`}>R$</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      required
                      value={payBillAmount}
                      onChange={(e) => setPayBillAmount(e.target.value)}
                      className={`w-full pl-10 p-3.5 rounded-2xl text-base font-black bg-transparent border ${isDarkMode ? 'border-slate-700 focus:border-emerald-500' : 'border-slate-300 focus:border-emerald-500'} text-emerald-400 focus:outline-none transition-all`}
                    />
                  </div>
                </div>

                <div className="space-y-1 mt-4">
                  <label className={`text-[10px] font-bold uppercase tracking-wider ${subText} ml-1`}>Fonte do Pagamento</label>
                  <div className="flex bg-slate-800/50 p-1 rounded-2xl border border-slate-700">
                    <button
                      type="button"
                      onClick={() => setPayBillSourceType('account')}
                      className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${payBillSourceType === 'account' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                    >
                      Conta
                    </button>
                    <button
                      type="button"
                      onClick={() => setPayBillSourceType('credit_card')}
                      className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${payBillSourceType === 'credit_card' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                    >
                      Cartão
                    </button>
                  </div>
                </div>

                {payBillSourceType === 'account' && (
                  <div className="space-y-1 mt-3">
                    <label className={`text-[10px] font-bold uppercase tracking-wider ${subText} ml-1`}>Conta de Saída</label>
                    <select
                      value={payBillSelectedAccountId}
                      onChange={(e) => setPayBillSelectedAccountId(e.target.value)}
                      className={`w-full p-3.5 rounded-2xl text-sm font-bold bg-transparent border ${isDarkMode ? 'border-slate-700 focus:border-emerald-500' : 'border-slate-300 focus:border-emerald-500'} text-white focus:outline-none transition-all appearance-none cursor-pointer`}
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
                      <label className={`text-[10px] font-bold uppercase tracking-wider ${subText} ml-1`}>Cartão Utilizado</label>
                      <select
                        value={payBillSelectedCardId}
                        onChange={(e) => setPayBillSelectedCardId(e.target.value)}
                        className={`w-full p-3.5 rounded-2xl text-sm font-bold bg-transparent border ${isDarkMode ? 'border-slate-700 focus:border-emerald-500' : 'border-slate-300 focus:border-emerald-500'} text-white focus:outline-none transition-all appearance-none cursor-pointer`}
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
                      <label className={`text-[10px] font-bold uppercase tracking-wider ${subText} ml-1`}>Parcelas</label>
                      <select
                        value={payBillInstallments}
                        onChange={(e) => setPayBillInstallments(e.target.value)}
                        className={`w-full p-3.5 rounded-2xl text-sm font-bold bg-transparent border ${isDarkMode ? 'border-slate-700 focus:border-emerald-500' : 'border-slate-300 focus:border-emerald-500'} text-white focus:outline-none transition-all appearance-none cursor-pointer`}
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
                    </div>
          </div>
        )}

        {/* Modal: Edit Bill */}
        {activeSheet === 'edit-bill' && selectedBill && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div className={`w-full max-w-[480px] rounded-t-3xl sm:rounded-3xl border ${cardBg} p-5 space-y-4 animate-in slide-in-from-bottom sm:zoom-in-95 duration-300 shadow-2xl max-h-[90vh] overflow-y-auto scrollbar-none`}>
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-extrabold flex items-center space-x-2 text-amber-500">
                  <ModernIcon icon={Edit3} color="amber" size="sm" />
                  <span>Editar Boleto</span>
                </h3>
                <button 
                  onClick={() => { setActiveSheet(null); setEditBillFile(null); }} 
                  className={`p-1.5 rounded-full transition-colors ${isDarkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-200 text-slate-600'}`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className={`text-[10px] font-bold ${subText} block mb-1`}>Nome</label>
                  <input 
                    type="text" 
                    value={selectedBill.title} 
                    onChange={(e) => setSelectedBill({ ...selectedBill, title: e.target.value })}
                    className={`w-full p-2.5 rounded-xl text-xs border ${innerInputBg}`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={`text-[10px] font-bold ${subText} block mb-1`}>Valor (R$)</label>
                    <input 
                      type="number" 
                      value={selectedBill.amount} 
                      onChange={(e) => setSelectedBill({ ...selectedBill, amount: parseLocalizedNumber(e.target.value) })}
                      className={`w-full p-2.5 rounded-xl text-xs border ${innerInputBg}`}
                    />
                  </div>
                  <div>
                    <label className={`text-[10px] font-bold ${subText} block mb-1`}>Vencimento</label>
                    <input 
                      type="date" 
                      value={selectedBill.dueDate} 
                      onChange={(e) => setSelectedBill({ ...selectedBill, dueDate: e.target.value })}
                      className={`w-full p-2.5 rounded-xl text-xs border ${innerInputBg}`}
                    />
                  </div>
                </div>

                {/* Seção de Anexo / Comprovante do Boleto */}
                <div className={`p-3 rounded-2xl border ${isDarkMode ? 'bg-[#1a1c24] border-[#2d3142]' : 'bg-slate-50 border-slate-200'} space-y-2`}>
                  <label className={`text-[10px] uppercase tracking-wider font-bold ${subText} block`}>
                    Anexo / Comprovante (PDF ou Imagem)
                  </label>

                  {selectedBill.fileUrl && !editBillFile && (
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileText className="w-4 h-4 text-amber-400 shrink-0" />
                        <span className="text-xs font-bold text-amber-400 truncate">
                          Anexo atual disponível
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => setViewingAttachment({ url: selectedBill.fileUrl, title: selectedBill.title })}
                          className="px-2.5 py-1 text-[11px] font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-lg transition-all active:scale-95"
                        >
                          Visualizar
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedBill({ ...selectedBill, fileUrl: null })}
                          className="p-1 text-rose-400 hover:text-rose-300 rounded-lg hover:bg-rose-500/10 transition-all"
                          title="Remover anexo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {editBillFile && (
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <Upload className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="text-xs font-bold text-emerald-400 truncate">
                          {editBillFile.name}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditBillFile(null)}
                        className="p-1 text-rose-400 hover:text-rose-300 rounded-lg hover:bg-rose-500/10 transition-all"
                        title="Cancelar novo anexo"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  <div>
                    <label className={`w-full flex items-center justify-center gap-2 p-2.5 rounded-xl border border-dashed cursor-pointer transition-all ${
                      isDarkMode 
                        ? 'border-slate-700 hover:border-amber-500/60 bg-slate-800/40 hover:bg-slate-800/80 text-slate-300' 
                        : 'border-slate-300 hover:border-amber-500 bg-white text-slate-600'
                    }`}>
                      <Upload className="w-4 h-4 text-amber-500" />
                      <span className="text-xs font-semibold">
                        {selectedBill.fileUrl || editBillFile ? 'Substituir arquivo' : 'Selecionar arquivo'}
                      </span>
                      <input 
                        type="file" 
                        accept="image/*,.pdf" 
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setEditBillFile(e.target.files[0]);
                          }
                        }} 
                        className="hidden" 
                      />
                    </label>
                  </div>
                </div>
              </div>

              <button 
                onClick={handleSaveEditedBill}
                disabled={editBillUploading}
                className="w-full py-3.5 rounded-2xl bg-blue-600 text-white font-bold text-xs shadow-lg shadow-blue-500/20 hover:bg-blue-500 active:scale-98 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {editBillUploading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Enviando anexo...</span>
                  </>
                ) : (
                  <span>Salvar Alterações</span>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Modal: Month/Calendar Period Picker */}
        {activeSheet === 'month-picker' && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div className={`w-full max-w-[480px] rounded-t-3xl sm:rounded-3xl border ${cardBg} p-5 space-y-4 animate-in slide-in-from-bottom sm:zoom-in-95 duration-300 shadow-2xl max-h-[85vh] overflow-y-auto scrollbar-none`}>
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-extrabold flex items-center space-x-2 text-blue-500">
                  <ModernIcon icon={Filter} color="blue" size="sm" />
                  <span>Filtrar Período de Análise</span>
                </h3>
                <button onClick={() => setActiveSheet(null)} className={`p-1.5 rounded-full transition-colors ${isDarkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-200 text-slate-600'}`}>
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className={`p-1 rounded-2xl border ${innerInputBg} grid grid-cols-2 gap-1`}>
                <button
                  onClick={() => setDateFilterMode('month')}
                  className={`py-2 rounded-xl text-xs font-bold transition-all ${
                    dateFilterMode === 'month' 
                      ? 'bg-blue-600 text-white shadow-md' 
                      : `${subText} ${isDarkMode ? 'hover:text-white' : 'hover:text-slate-900'}`
                  }`}
                >
                  Por Mês / Ano
                </button>
                <button
                  onClick={() => setDateFilterMode('range')}
                  className={`py-2 rounded-xl text-xs font-bold transition-all ${
                    dateFilterMode === 'range' 
                      ? 'bg-blue-600 text-white shadow-md' 
                      : `${subText} ${isDarkMode ? 'hover:text-white' : 'hover:text-slate-900'}`
                  }`}
                >
                  Calendário (Intervalo)
                </button>
              </div>

              {dateFilterMode === 'month' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-4 py-2 rounded-2xl bg-slate-800/40 border border-slate-700/50">
                    <button 
                      onClick={() => setSelectedYear(prev => prev - 1)}
                      className="p-1 hover:bg-slate-700 rounded-lg text-slate-300"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-extrabold text-blue-400">{selectedYear}</span>
                    <button 
                      onClick={() => setSelectedYear(prev => prev + 1)}
                      className="p-1 hover:bg-slate-700 rounded-lg text-slate-300"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {monthNames.map((m, idx) => {
                      const isSelected = selectedMonthIndex === idx && selectedYear === 2026;
                      return (
                        <button
                          key={m}
                          onClick={() => {
                            setSelectedMonthIndex(idx);
                            setActiveSheet(null);
                          }}
                          className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center space-y-1 transition-all active:scale-95 ${
                            isSelected 
                              ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white border-blue-400 shadow-md shadow-blue-500/30 ring-2 ring-blue-400/40' 
                              : `${innerInputBg} hover:border-blue-500/50`
                          }`}
                        >
                          <span>{m}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {dateFilterMode === 'range' && (
                <div className="space-y-3">
                  <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
                    <button 
                      onClick={() => {
                        const today = new Date().toISOString().split('T')[0];
                        setRangeStartDate(today);
                        setRangeEndDate(today);
                      }}
                      className="px-2.5 py-1 rounded-xl bg-slate-800 border border-slate-700 hover:border-blue-500 shrink-0 font-semibold"
                    >
                      Hoje
                    </button>
                    <button 
                      onClick={() => {
                        const now = new Date();
                        const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
                        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
                        setRangeStartDate(start);
                        setRangeEndDate(end);
                      }}
                      className="px-2.5 py-1 rounded-xl bg-slate-800 border border-slate-700 hover:border-blue-500 shrink-0 font-semibold"
                    >
                      Mês Atual
                    </button>
                    <button 
                      onClick={() => {
                        const now = new Date();
                        const start = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString().split('T')[0];
                        const end = new Date(now.getFullYear(), now.getMonth() + 2, 0).toISOString().split('T')[0];
                        setRangeStartDate(start);
                        setRangeEndDate(end);
                      }}
                      className="px-2.5 py-1 rounded-xl bg-slate-800 border border-slate-700 hover:border-blue-500 shrink-0 font-semibold"
                    >
                      Próximo Mês
                    </button>
                  </div>

                  <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-800/40 border border-slate-700/50 text-xs">
                    <button 
                      onClick={() => {
                        if (calViewMonth === 0) {
                          setCalViewMonth(11);
                          setCalViewYear(prev => prev - 1);
                        } else {
                          setCalViewMonth(prev => prev - 1);
                        }
                      }}
                      className="p-1 hover:bg-slate-700 rounded-lg"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="font-bold text-slate-200">
                      {monthNames[calViewMonth]} {calViewYear}
                    </span>
                    <button 
                      onClick={() => {
                        if (calViewMonth === 11) {
                          setCalViewMonth(0);
                          setCalViewYear(prev => prev + 1);
                        } else {
                          setCalViewMonth(prev => prev + 1);
                        }
                      }}
                      className="p-1 hover:bg-slate-700 rounded-lg"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400">
                    <span>Dom</span><span>Seg</span><span>Ter</span><span>Qua</span><span>Qui</span><span>Sex</span><span>Sáb</span>
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-xs">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={`empty_${i}`} className="h-8"></div>
                    ))}
                    
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((dayNum) => {
                      const monthStr = String(calViewMonth + 1).padStart(2, '0');
                      const dayStr = String(dayNum).padStart(2, '0');
                      const thisFormatted = `${calViewYear}-${monthStr}-${dayStr}`;

                      const isStart = thisFormatted === rangeStartDate;
                      const isEnd = thisFormatted === rangeEndDate;
                      const isInRange = thisFormatted >= rangeStartDate && thisFormatted <= rangeEndDate;

                      return (
                        <button
                          key={dayNum}
                          onClick={() => handleCalendarDayClick(dayNum)}
                          className={`h-8 rounded-xl font-bold flex items-center justify-center transition-all ${
                            isStart || isEnd
                              ? 'bg-blue-600 text-white shadow-md scale-105 z-10 ring-2 ring-blue-300'
                              : isInRange 
                                ? 'bg-blue-500/25 text-blue-300 border border-blue-500/30'
                                : `${innerInputBg} hover:bg-slate-800`
                          }`}
                        >
                          {dayNum}
                        </button>
                      );
                    })}
                  </div>

                  <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs flex items-center justify-between">
                    <div>
                      <span className={`text-[10px] ${subText} block`}>Período Selecionado:</span>
                      <span className="font-extrabold text-blue-400">
                        {rangeStartDate.split('-').reverse().join('/')} até {rangeEndDate.split('-').reverse().join('/')}
                      </span>
                    </div>
                    <button
                      onClick={() => setActiveSheet(null)}
                      className="px-3 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-500 active:scale-95 shadow-md shadow-blue-500/30"
                    >
                      Aplicar
                    </button>
                  </div>

                </div>
              )}

            </div>
          </div>
        )}
        {/* Modal: Novo Gasto */}
        {activeSheet === 'add-keypad' && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div className={`w-full max-w-[480px] rounded-t-3xl sm:rounded-3xl border ${cardBg} p-6 space-y-5 animate-in slide-in-from-bottom sm:zoom-in-95 duration-300 shadow-2xl max-h-[90vh] overflow-y-auto scrollbar-none`}>
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-extrabold text-blue-500">Novo Gasto</h3>
                <button onClick={() => setActiveSheet(null)} className={`p-1.5 rounded-full transition-colors ${isDarkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-200 text-slate-600'}`}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="text-center pb-2">
                  <span className={`text-xs ${subText} block mb-1`}>Valor (R$)</span>
                  <input type="text" value={calcValue} onChange={(e) => setCalcValue(e.target.value)} className={`w-full bg-transparent text-center text-4xl font-black ${isDarkMode ? 'text-white' : 'text-blue-600'} outline-none border-b ${isDarkMode ? 'border-slate-700/50' : 'border-slate-300'} pb-2 focus:border-blue-500 transition-colors`} placeholder="R$ 0,00" />
                </div>

                {calcValidationError && (
                  <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-[10px] font-bold text-rose-300">
                    {calcValidationError}
                  </div>
                )}
                
                {/* Payment Method Selector */}
                <div className="space-y-3">
                  <div>
                    <label className={`text-[10px] uppercase tracking-wider font-bold ${subText} block mb-1`}>Forma de Pagamento</label>
                    <div className={`p-1 rounded-2xl border ${innerInputBg} grid grid-cols-2 gap-1 text-xs font-bold`}>
                      <button
                        type="button"
                        onClick={() => setPaymentSourceType('account')}
                        className={`py-2 rounded-xl transition-all ${paymentSourceType === 'account' ? 'bg-blue-600 text-white shadow-md' : subText}`}
                      >
                        Conta Bancária
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentSourceType('credit_card')}
                        className={`py-2 rounded-xl transition-all ${paymentSourceType === 'credit_card' ? 'bg-purple-600 text-white shadow-md' : subText}`}
                      >
                        Cartão de Crédito
                      </button>
                    </div>
                  </div>

                  {paymentSourceType === 'account' ? (
                    <div>
                      <label className={`text-[10px] uppercase tracking-wider font-bold ${subText} block mb-1`}>Conta de Origem</label>
                      <select value={selectedAccountId} onChange={(e) => setSelectedAccountId(e.target.value)} className={`w-full p-3 rounded-xl border ${innerInputBg} text-sm outline-none ${isDarkMode ? 'bg-[#1e2029] text-white' : 'bg-slate-100 text-slate-900'}`}>
                        {accounts.map(a => <option key={a.id} value={a.id} className={isDarkMode ? 'bg-[#16171d] text-white' : 'bg-white text-slate-900'}>{a.name} (Saldo: R$ {a.balance.toFixed(2)})</option>)}
                      </select>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={`text-[10px] uppercase tracking-wider font-bold ${subText} block mb-1`}>Cartão</label>
                          <select value={selectedCardId} onChange={(e) => setSelectedCardId(e.target.value)} className={`w-full p-3 rounded-xl border ${innerInputBg} text-sm outline-none ${isDarkMode ? 'bg-[#1e2029] text-white' : 'bg-slate-100 text-slate-900'}`}>
                            {creditCards.map(c => <option key={c.id} value={c.id} className={isDarkMode ? 'bg-[#16171d] text-white' : 'bg-white text-slate-900'}>{c.name} (Livre: R$ {(c.totalLimit - getCardUsedFromBills(c.name)).toFixed(0)})</option>)}
                          </select>
                        </div>
                        <div>
                          <label className={`text-[10px] uppercase tracking-wider font-bold ${subText} block mb-1`}>Parcelas</label>
                          <select value={calcInstallments} onChange={(e) => setCalcInstallments(e.target.value)} className={`w-full p-3 rounded-xl border ${innerInputBg} text-sm outline-none ${isDarkMode ? 'bg-[#1e2029] text-white' : 'bg-slate-100 text-slate-900'}`}>
                            {(() => {
                              const rawNum = parseLocalizedNumber(calcValue || '0');
                              return [1,2,3,4,5,6,10,12,18,24].map(n => (
                                <option key={n} value={n} className={isDarkMode ? 'bg-[#16171d] text-white' : 'bg-white text-slate-900'}>
                                  {n}x de R$ {(rawNum / n).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </option>
                              ));
                            })()}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className={`text-[10px] uppercase tracking-wider font-bold ${subText} block mb-1`}>Fatura de Cobrança</label>
                        <div className={`p-1 rounded-2xl border ${innerInputBg} grid grid-cols-2 gap-1 text-[11px] font-bold`}>
                          <button
                            type="button"
                            onClick={() => setCalcCardTargetPeriod('current_invoice')}
                            className={`py-1.5 rounded-xl transition-all ${calcCardTargetPeriod === 'current_invoice' ? 'bg-purple-600 text-white shadow-sm' : subText}`}
                          >
                            💳 Fatura Atual
                          </button>
                          <button
                            type="button"
                            onClick={() => setCalcCardTargetPeriod('next_invoice')}
                            className={`py-1.5 rounded-xl transition-all ${calcCardTargetPeriod === 'next_invoice' ? 'bg-indigo-600 text-white shadow-sm' : subText}`}
                          >
                            ⏩ Próxima Fatura
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className={`text-[10px] uppercase tracking-wider font-bold ${subText} block mb-1`}>Categoria</label>
                    <select value={calcCategory} onChange={(e) => setCalcCategory(e.target.value)} className={`w-full p-3 rounded-xl border ${innerInputBg} text-sm outline-none ${isDarkMode ? 'bg-[#1e2029] text-white' : 'bg-slate-100 text-slate-900'}`}>
                      {dynamicCategories.map(c => <option key={c.id} value={c.name} className={isDarkMode ? 'bg-[#16171d] text-white' : 'bg-white text-slate-900'}>{c.name}</option>)}
                    </select>
                    <button type="button" onClick={() => { setActiveSheet('categories'); setIsCategoryFormOpen(true); }} className="text-[10px] text-blue-500 font-bold mt-1.5 ml-1">+ Criar nova categoria</button>
                  </div>
                  <div>
                    <label className={`text-[10px] uppercase tracking-wider font-bold ${subText} block mb-1`}>Descrição / Estabelecimento</label>
                    <input type="text" value={calcLocation} onChange={(e) => setCalcLocation(e.target.value)} placeholder="Ex: Supermercado Carrefour" className={`w-full p-3 rounded-xl border ${innerInputBg} text-sm outline-none`} />
                  </div>
                  <div>
                    <label className={`text-[10px] uppercase tracking-wider font-bold ${subText} block mb-1`}>Data do Gasto</label>
                    <input type="date" value={calcDate} onChange={(e) => setCalcDate(e.target.value)} className={`w-full p-3 rounded-xl border ${innerInputBg} text-sm outline-none`} />
                  </div>
                </div>

                <button onClick={handleSaveKeypadExpense} className="w-full py-3.5 rounded-2xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-500 active:scale-95 transition-all shadow-lg shadow-blue-500/25 mt-2">
                  Adicionar Gasto
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Agendar Boleto */}
        {activeSheet === 'add-bill' && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div className={`w-full max-w-[480px] rounded-t-3xl sm:rounded-3xl border ${cardBg} p-6 space-y-5 animate-in slide-in-from-bottom sm:zoom-in-95 duration-300 shadow-2xl max-h-[90vh] overflow-y-auto scrollbar-none`}>
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-extrabold text-amber-500">Agendar Boleto</h3>
                <button onClick={() => setActiveSheet(null)} className={`p-1.5 rounded-full transition-colors ${isDarkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-200 text-slate-600'}`}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className={`text-[10px] uppercase tracking-wider font-bold ${subText} block mb-1`}>Nome do Boleto</label>
                  <input type="text" value={billName} onChange={(e) => setBillName(e.target.value)} placeholder="Ex: Aluguel do Apê" className={`w-full p-3 rounded-xl border ${innerInputBg} text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all`} />
                </div>
                <div>
                  <label className={`text-[10px] uppercase tracking-wider font-bold ${subText} block mb-1`}>Valor (R$)</label>
                  <input type="number" value={billAmount} onChange={(e) => setBillAmount(e.target.value)} placeholder="0.00" className={`w-full p-3 rounded-xl border ${innerInputBg} text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all`} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`text-[10px] uppercase tracking-wider font-bold ${subText} block mb-1`}>Vencimento</label>
                    <input type="date" value={billDueDate} onChange={(e) => setBillDueDate(e.target.value)} className={`w-full p-3 rounded-xl border ${innerInputBg} text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all`} />
                  </div>
                  <div>
                    <label className={`text-[10px] uppercase tracking-wider font-bold ${subText} block mb-1`}>Categoria</label>
                    <select value={billCategory} onChange={(e) => setBillCategory(e.target.value)} className={`w-full p-3 rounded-xl border ${innerInputBg} text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all`}>
                      {dynamicCategories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                    <button type="button" onClick={() => { setActiveSheet('categories'); setIsCategoryFormOpen(true); }} className="text-[10px] text-amber-500 font-bold mt-1.5 ml-1">+ Criar nova categoria</button>
                  </div>
                </div>
                <div>
                  <label className={`text-[10px] uppercase tracking-wider font-bold ${subText} block mb-1`}>Anexo (PDF ou Imagem)</label>
                  <input type="file" accept="image/*,.pdf" onChange={(e) => setBillFile(e.target.files[0])} className={`w-full p-2 rounded-xl border ${innerInputBg} text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100`} />
                </div>
                <button onClick={handleSaveBill} disabled={billUploading} className="w-full py-3.5 rounded-2xl bg-amber-600 text-white font-bold text-sm hover:bg-amber-500 active:scale-95 transition-all shadow-lg shadow-amber-500/25 mt-2 disabled:opacity-50 disabled:cursor-not-allowed">
                  {billUploading ? 'Enviando...' : 'Agendar Pagamento'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Nova Receita */}
        {activeSheet === 'add-income' && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div className={`w-full max-w-[480px] rounded-t-3xl sm:rounded-3xl border ${cardBg} p-6 space-y-5 animate-in slide-in-from-bottom sm:zoom-in-95 duration-300 shadow-2xl max-h-[90vh] overflow-y-auto scrollbar-none`}>
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-extrabold text-emerald-500">Nova Receita Direta</h3>
                <button onClick={() => setActiveSheet(null)} className={`p-1.5 rounded-full transition-colors ${isDarkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-200 text-slate-600'}`}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="text-center pb-2">
                  <span className={`text-xs ${subText} block mb-1`}>Valor da Receita</span>
                  <input type="text" value={incomeAmount} onChange={(e) => setIncomeAmount(e.target.value)} className={`w-full bg-transparent text-center text-4xl font-black text-emerald-400 outline-none border-b border-slate-700/50 pb-2 focus:border-emerald-500 transition-colors`} placeholder="R$ 0,00" />
                </div>
                <div>
                  <label className={`text-[10px] uppercase tracking-wider font-bold ${subText} block mb-1`}>Descrição</label>
                  <input type="text" value={incomeDesc} onChange={(e) => setIncomeDesc(e.target.value)} placeholder="Ex: Salário, Pix recebido..." className={`w-full p-3 rounded-xl border ${innerInputBg} text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all`} />
                </div>
                <div>
                  <label className={`text-[10px] uppercase tracking-wider font-bold ${subText} block mb-1`}>Conta de Destino</label>
                  <select
                    value={incomeTargetAccId}
                    onChange={(e) => setIncomeTargetAccId(e.target.value)}
                    className={`w-full p-3 rounded-xl border ${innerInputBg} text-sm font-bold outline-none ${isDarkMode ? 'bg-[#1e2029] text-white' : 'bg-slate-100 text-slate-900'}`}
                  >
                    <option value="" disabled>Selecione onde o dinheiro entrou</option>
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
                <button onClick={handleSaveIncome} className="w-full py-3.5 rounded-2xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-500 active:scale-95 transition-all shadow-lg shadow-emerald-500/25 mt-2">
                  Adicionar Receita
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Cadastrar / Editar Receita Prevista */}
        {activeSheet === 'add-expected-income' && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div className={`w-full max-w-[480px] rounded-t-3xl sm:rounded-3xl border ${cardBg} p-6 space-y-5 animate-in slide-in-from-bottom sm:zoom-in-95 duration-300 shadow-2xl max-h-[90vh] overflow-y-auto scrollbar-none`}>
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-extrabold text-emerald-500">
                  {editingExpIncomeId ? 'Editar Receita Prevista' : 'Cadastrar Receita Prevista / Entradas Futuras'}
                </h3>
                <button onClick={() => { setActiveSheet(null); setEditingExpIncomeId(null); }} className={`p-1.5 rounded-full transition-colors ${isDarkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-200 text-slate-600'}`}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className={`text-[10px] uppercase tracking-wider font-bold ${subText} block mb-1`}>Título da Receita</label>
                  <input type="text" value={expIncTitle} onChange={(e) => setExpIncTitle(e.target.value)} placeholder="Ex: Salário, Projeto PJ, Venda Encomenda #104" className={`w-full p-3 rounded-xl border ${innerInputBg} text-sm outline-none`} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`text-[10px] uppercase tracking-wider font-bold ${subText} block mb-1`}>Valor Previsto (R$)</label>
                    <input type="number" value={expIncAmount} onChange={(e) => setExpIncAmount(e.target.value)} placeholder="5500.00" className={`w-full p-3 rounded-xl border ${innerInputBg} text-sm outline-none font-bold text-emerald-400`} />
                  </div>
                  <div>
                    <label className={`text-[10px] uppercase tracking-wider font-bold ${subText} block mb-1`}>Categoria</label>
                    <select value={expIncCategory} onChange={(e) => setExpIncCategory(e.target.value)} className={`w-full p-3 rounded-xl border ${innerInputBg} text-sm outline-none ${isDarkMode ? 'bg-[#1e2029] text-white' : 'bg-slate-100 text-slate-900'}`}>
                      {dynamicCategories.map(c => <option key={c.id} value={c.name} className={isDarkMode ? 'bg-[#16171d] text-white' : 'bg-white text-slate-900'}>{c.name}</option>)}
                    </select>
                    <button type="button" onClick={() => { setActiveSheet('categories'); setIsCategoryFormOpen(true); }} className="text-[10px] text-emerald-500 font-bold mt-1.5 ml-1">+ Criar nova categoria</button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`text-[10px] uppercase tracking-wider font-bold ${subText} block mb-1`}>Data Prevista</label>
                    <input type="date" value={expIncDate} onChange={(e) => setExpIncDate(e.target.value)} className={`w-full p-3 rounded-xl border ${innerInputBg} text-sm outline-none`} />
                  </div>
                  <div>
                    <label className={`text-[10px] uppercase tracking-wider font-bold ${subText} block mb-1`}>Conta de Destino</label>
                    <input type="text" disabled value="Definida ao Receber" className={`w-full p-3 rounded-xl border ${innerInputBg} text-xs italic opacity-75 outline-none`} />
                  </div>
                </div>

                {/* Recurrence Toggle */}
                <div className={`p-3 rounded-2xl border ${innerInputBg} flex items-center justify-between`}>
                  <div>
                    <span className="text-xs font-bold block">Entrada Recorrente Mensal</span>
                    <span className={`text-[10px] ${subText}`}>Marque para receitas fixas como Salário ou Aluguel</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={expIncIsRecurring}
                    onChange={(e) => setExpIncIsRecurring(e.target.checked)}
                    className="w-5 h-5 rounded cursor-pointer accent-emerald-500"
                  />
                </div>

                <div>
                  <label className={`text-[10px] uppercase tracking-wider font-bold ${subText} block mb-1`}>Observações (Opcional)</label>
                  <input type="text" value={expIncNotes} onChange={(e) => setExpIncNotes(e.target.value)} placeholder="Ex: Pagamento na entrega do lote #104" className={`w-full p-3 rounded-xl border ${innerInputBg} text-sm outline-none`} />
                </div>

                <button onClick={handleSaveExpectedIncome} className="w-full py-3.5 rounded-2xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-500 active:scale-95 transition-all shadow-lg shadow-emerald-600/25 mt-2">
                  {editingExpIncomeId ? 'Salvar Alterações' : 'Salvar Receita Prevista'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Confirmar Recebimento e Escolher Conta Bancária */}
        {activeSheet === 'confirm-receive-income' && receivingIncomeItem && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div className={`w-full max-w-[480px] rounded-t-3xl sm:rounded-3xl border ${cardBg} p-6 space-y-5 animate-in slide-in-from-bottom sm:zoom-in-95 duration-300 shadow-2xl max-h-[90vh] overflow-y-auto scrollbar-none`}>
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-extrabold text-emerald-500">Confirmar Recebimento de Valor</h3>
                <button onClick={() => setActiveSheet(null)} className={`p-1.5 rounded-full transition-colors ${isDarkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-200 text-slate-600'}`}>
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className={`p-4 rounded-2xl border ${innerInputBg} space-y-1`}>
                <span className="text-xs font-bold block">{receivingIncomeItem.title}</span>
                <span className="text-lg font-black text-emerald-400 block">
                  + R$ {receivingIncomeItem.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className={`text-[10px] ${subText} block`}>
                  Categoria: {receivingIncomeItem.category} • Previsão: {receivingIncomeItem.expectedDate.split('-').reverse().join('/')}
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <label className={`text-[10px] uppercase tracking-wider font-bold ${subText} block mb-1`}>
                    Em qual Conta Bancária o dinheiro foi recebido?
                  </label>
                  <select
                    value={receiveTargetAccountId}
                    onChange={(e) => setReceiveTargetAccountId(e.target.value)}
                    className={`w-full p-3 rounded-xl border ${innerInputBg} text-sm font-bold outline-none ${isDarkMode ? 'bg-[#1e2029] text-white' : 'bg-slate-100 text-slate-900'}`}
                  >
                    {accounts.map(a => (
                      <option key={a.id} value={a.id} className={isDarkMode ? 'bg-[#16171d] text-white' : 'bg-white text-slate-900'}>
                        {a.name} (Saldo Atual: R$ {a.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleExecuteReceiveIncome}
                  className="w-full py-3.5 rounded-2xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-500 active:scale-95 transition-all shadow-lg shadow-emerald-600/25 mt-2 flex items-center justify-center space-x-2"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Confirmar Depósito & Receber</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Cadastrar Dívida Ativa Serasa */}
        {activeSheet === 'add-serasa' && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div className={`w-full max-w-[480px] rounded-t-3xl sm:rounded-3xl border ${cardBg} p-6 space-y-5 animate-in slide-in-from-bottom sm:zoom-in-95 duration-300 shadow-2xl max-h-[90vh] overflow-y-auto scrollbar-none`}>
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-extrabold text-rose-500">Cadastrar Dívida Ativa (Serasa)</h3>
                <button onClick={() => setActiveSheet(null)} className={`p-1.5 rounded-full transition-colors ${isDarkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-200 text-slate-600'}`}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className={`text-[10px] uppercase tracking-wider font-bold ${subText} block mb-1`}>Credor / Empresa</label>
                  <input type="text" value={serasaCreditor} onChange={(e) => setSerasaCreditor(e.target.value)} placeholder="Ex: Banco Itaú, Claro, Enel" className={`w-full p-3 rounded-xl border ${innerInputBg} text-sm outline-none`} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`text-[10px] uppercase tracking-wider font-bold ${subText} block mb-1`}>Valor Original da Dívida (R$)</label>
                    <input type="number" value={serasaOriginalAmount} onChange={(e) => setSerasaOriginalAmount(e.target.value)} placeholder="4200.00" className={`w-full p-3 rounded-xl border ${innerInputBg} text-sm outline-none`} />
                  </div>
                  <div>
                    <label className={`text-[10px] uppercase tracking-wider font-bold ${subText} block mb-1`}>Categoria</label>
                    <select value={serasaCategory} onChange={(e) => setSerasaCategory(e.target.value)} className={`w-full p-3 rounded-xl border ${innerInputBg} text-sm outline-none ${isDarkMode ? 'bg-[#1e2029] text-white' : 'bg-slate-100 text-slate-900'}`}>
                      {dynamicCategories.map(c => <option key={c.id} value={c.name} className={isDarkMode ? 'bg-[#16171d] text-white' : 'bg-white text-slate-900'}>{c.name}</option>)}
                    </select>
                    <button type="button" onClick={() => { setActiveSheet('categories'); setIsCategoryFormOpen(true); }} className="text-[10px] text-rose-500 font-bold mt-1.5 ml-1">+ Criar nova categoria</button>
                  </div>
                </div>
                <div>
                  <label className={`text-[10px] uppercase tracking-wider font-bold ${subText} block mb-1`}>Vencimento Original</label>
                  <input type="date" value={serasaDueDate} onChange={(e) => setSerasaDueDate(e.target.value)} className={`w-full p-3 rounded-xl border ${innerInputBg} text-sm outline-none`} />
                </div>
                <button onClick={handleSaveSerasaDebt} className="w-full py-3.5 rounded-2xl bg-rose-600 text-white font-bold text-sm hover:bg-rose-500 active:scale-95 transition-all shadow-lg shadow-rose-500/25 mt-2">
                  Salvar Dívida Ativa
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Renegociar & Gerar Acordo para Dívida Ativa */}
        {activeSheet === 'negotiate-serasa' && negotiatingDebt && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div className={`w-full max-w-[480px] rounded-t-3xl sm:rounded-3xl border ${cardBg} p-6 space-y-5 animate-in slide-in-from-bottom sm:zoom-in-95 duration-300 shadow-2xl max-h-[90vh] overflow-y-auto scrollbar-none`}>
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-extrabold text-amber-500">Gerar Acordo de Dívida ({negotiatingDebt.creditor})</h3>
                <button onClick={() => setActiveSheet(null)} className={`p-1.5 rounded-full transition-colors ${isDarkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-200 text-slate-600'}`}>
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className={`p-3.5 rounded-2xl border ${innerInputBg} space-y-1`}>
                <div className="flex justify-between text-xs">
                  <span className={subText}>Dívida Original:</span>
                  <span className="font-extrabold text-slate-300 line-through">R$ {negotiatingDebt.originalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                {parseFloat(agreementOfferAmount) < negotiatingDebt.originalAmount && (
                  <div className="flex justify-between text-xs font-bold text-emerald-400 pt-1 border-t border-slate-700/40">
                    <span>Economia Negociada:</span>
                    <span>-{Math.max(0, Math.round(((negotiatingDebt.originalAmount - (parseFloat(agreementOfferAmount) || 0)) / negotiatingDebt.originalAmount) * 100))}% OFF (Economia R$ {(negotiatingDebt.originalAmount - (parseFloat(agreementOfferAmount) || 0)).toFixed(2)})</span>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className={`text-[10px] uppercase tracking-wider font-bold ${subText} block mb-1`}>Valor do Acordo (R$)</label>
                  <input type="number" value={agreementOfferAmount} onChange={(e) => setAgreementOfferAmount(e.target.value)} placeholder="Valor com desconto" className={`w-full p-3 rounded-xl border ${innerInputBg} text-sm font-bold text-amber-400 outline-none`} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`text-[10px] uppercase tracking-wider font-bold ${subText} block mb-1`}>Parcelas</label>
                    <select value={agreementInstallments} onChange={(e) => setAgreementInstallments(e.target.value)} className={`w-full p-3 rounded-xl border ${innerInputBg} text-sm outline-none ${isDarkMode ? 'bg-[#1e2029] text-white' : 'bg-slate-100 text-slate-900'}`}>
                      {[1,2,3,4,5,6,12,18,24].map(n => <option key={n} value={n} className={isDarkMode ? 'bg-[#16171d] text-white' : 'bg-white text-slate-900'}>{n}x de R$ {((parseFloat(agreementOfferAmount || 0)) / n).toFixed(2)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={`text-[10px] uppercase tracking-wider font-bold ${subText} block mb-1`}>1ª Parcela Vencimento</label>
                    <input type="date" value={agreementDueDate} onChange={(e) => setAgreementDueDate(e.target.value)} className={`w-full p-3 rounded-xl border ${innerInputBg} text-sm outline-none`} />
                  </div>
                </div>
                <div>
                  <label className={`text-[10px] uppercase tracking-wider font-bold ${subText} block mb-1`}>Forma de Pagamento</label>
                  <select value={agreementPaymentMethod} onChange={(e) => setAgreementPaymentMethod(e.target.value)} className={`w-full p-3 rounded-xl border ${innerInputBg} text-sm outline-none ${isDarkMode ? 'bg-[#1e2029] text-white' : 'bg-slate-100 text-slate-900'}`}>
                    <option value="Boleto" className={isDarkMode ? 'bg-[#16171d] text-white' : 'bg-white text-slate-900'}>Boleto Bancário</option>
                    <option value="Cartão" className={isDarkMode ? 'bg-[#16171d] text-white' : 'bg-white text-slate-900'}>Cartão de Crédito</option>
                  </select>
                </div>
                <button onClick={handleConfirmSerasaAgreement} className="w-full py-3.5 rounded-2xl bg-amber-600 text-white font-bold text-sm hover:bg-amber-500 active:scale-95 transition-all shadow-lg shadow-amber-500/25 mt-2">
                  Confirmar Acordo & Gerar Boletos
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Transfer */}
        {activeSheet === 'transfer' && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div className={`w-full max-w-[480px] rounded-t-3xl sm:rounded-3xl border ${cardBg} p-6 space-y-5 animate-in slide-in-from-bottom sm:zoom-in-95 duration-300 shadow-2xl max-h-[90vh] overflow-y-auto scrollbar-none`}>
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-extrabold text-blue-500 flex items-center space-x-2">
                  <ArrowRightLeft className="w-5 h-5" />
                  <span>Transferência entre Contas</span>
                </h3>
                <button onClick={() => setActiveSheet(null)} className={`p-1.5 rounded-full transition-colors ${isDarkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-200 text-slate-600'}`}>
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {transferError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-center">
                    <p className="text-xs font-bold text-rose-400">{transferError}</p>
                  </div>
                )}
                
                <div className="space-y-1">
                  <label className={`text-[10px] font-bold uppercase tracking-wider ${subText} ml-1`}>Conta de Origem (Sai dinheiro)</label>
                  <select
                    value={transferSourceId}
                    onChange={(e) => setTransferSourceId(e.target.value)}
                    className={`w-full p-3.5 rounded-2xl text-sm font-bold bg-transparent border ${isDarkMode ? 'border-slate-700 focus:border-blue-500' : 'border-slate-300 focus:border-blue-500'} text-white focus:outline-none transition-all appearance-none cursor-pointer`}
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
                  <label className={`text-[10px] font-bold uppercase tracking-wider ${subText} ml-1`}>Conta de Destino (Entra dinheiro)</label>
                  <select
                    value={transferDestId}
                    onChange={(e) => setTransferDestId(e.target.value)}
                    className={`w-full p-3.5 rounded-2xl text-sm font-bold bg-transparent border ${isDarkMode ? 'border-slate-700 focus:border-blue-500' : 'border-slate-300 focus:border-blue-500'} text-white focus:outline-none transition-all appearance-none cursor-pointer`}
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
                  <label className={`text-[10px] font-bold uppercase tracking-wider ${subText} ml-1`}>Valor da Transferência</label>
                  <div className="relative">
                    <span className={`absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold ${subText}`}>R$</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      required
                      value={transferAmount}
                      onChange={(e) => setTransferAmount(e.target.value)}
                      className={`w-full pl-10 p-3.5 rounded-2xl text-base font-black bg-transparent border ${isDarkMode ? 'border-slate-700 focus:border-blue-500' : 'border-slate-300 focus:border-blue-500'} text-blue-400 focus:outline-none transition-all`}
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
            </div>
          </div>
        )}

        {/* Modal: Gerenciar Categorias */}
        {activeSheet === 'categories' && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div className={`w-full max-w-[480px] rounded-t-3xl sm:rounded-3xl border ${cardBg} p-6 space-y-5 animate-in slide-in-from-bottom sm:zoom-in-95 duration-300 shadow-2xl max-h-[90vh] overflow-y-auto scrollbar-none`}>
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-extrabold text-purple-500">Categorias</h3>
                <button onClick={() => setActiveSheet(null)} className={`p-1.5 rounded-full transition-colors ${isDarkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-200 text-slate-600'}`}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                {isCategoryFormOpen ? (
                  <div className={`p-4 rounded-2xl border ${innerInputBg} space-y-4`}>
                    <h4 className="text-xs font-bold">{editingCategoryId ? 'Editar Categoria' : 'Nova Categoria'}</h4>
                    <div className="space-y-3">
                      <div>
                        <label className={`text-[10px] uppercase tracking-wider font-bold ${subText} block mb-1`}>Nome</label>
                        <input type="text" value={catFormName} onChange={(e) => setCatFormName(e.target.value)} placeholder="Ex: Investimentos" className={`w-full p-2.5 rounded-xl border ${cardBg} text-sm ${isDarkMode ? 'text-white' : 'text-slate-900'} outline-none`} />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={`text-[10px] uppercase tracking-wider font-bold ${subText} block mb-1`}>Cor</label>
                          <input type="color" value={catFormColor} onChange={(e) => setCatFormColor(e.target.value)} className="w-full h-10 rounded-xl cursor-pointer bg-transparent border-0" />
                        </div>
                        <div>
                          <label className={`text-[10px] uppercase tracking-wider font-bold ${subText} block mb-1`}>Orçamento (R$)</label>
                          <input type="number" value={catFormAllocated} onChange={(e) => setCatFormAllocated(e.target.value)} placeholder="500" className={`w-full p-2.5 rounded-xl border ${cardBg} text-sm ${isDarkMode ? 'text-white' : 'text-slate-900'} outline-none`} />
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2 pt-2">
                      <button onClick={() => { setIsCategoryFormOpen(false); setEditingCategoryId(null); }} className={`flex-1 py-2 rounded-xl text-xs font-bold border ${cardBg} ${subText}`}>Cancelar</button>
                      <button onClick={handleSaveCategory} className="flex-1 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold shadow-lg shadow-purple-500/20 hover:bg-purple-500 active:scale-95 transition-all">Salvar Categoria</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      {dynamicCategories.map(cat => (
                        <div key={cat.id} className={`flex items-center justify-between p-3 rounded-2xl border ${innerInputBg}`}>
                          <div className="flex items-center space-x-3">
                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: cat.color }}></div>
                            <div>
                              <p className="text-sm font-bold">{cat.name}</p>
                              <p className={`text-[10px] ${subText}`}>R$ {cat.allocated.toFixed(2)}</p>
                            </div>
                          </div>
                          {confirmDeleteCatId === cat.id ? (
                            <div className="flex items-center space-x-2">
                              <button onClick={() => setConfirmDeleteCatId(null)} className="text-xs px-2 py-1 bg-slate-700 text-white rounded-lg">Não</button>
                              <button onClick={handleExecuteDeleteCategory} className="text-xs px-2 py-1 bg-rose-600 text-white rounded-lg font-bold">Sim</button>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-1">
                              <button 
                                onClick={() => { 
                                  setCatFormName(cat.name); setCatFormColor(cat.color); setCatFormAllocated(cat.allocated); 
                                  setEditingCategoryId(cat.id); setIsCategoryFormOpen(true); 
                                }}
                                className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button onClick={() => setConfirmDeleteCatId(cat.id)} className="p-1.5 rounded-lg hover:bg-rose-500/20 text-rose-400">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <button 
                      onClick={handleOpenCreateCategory}
                      className="w-full py-3.5 rounded-2xl border border-dashed border-purple-500/40 text-purple-400 font-bold text-sm hover:bg-purple-500/10 active:scale-95 transition-all mt-2"
                    >
                      + Nova Categoria
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal: Gerenciar Contas Bancárias & Cartões */}
        {activeSheet === 'accounts-management' && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div className={`w-full max-w-[520px] rounded-t-3xl sm:rounded-3xl border ${cardBg} p-6 space-y-5 animate-in slide-in-from-bottom sm:zoom-in-95 duration-300 shadow-2xl max-h-[90vh] overflow-y-auto scrollbar-none`}>
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-extrabold flex items-center space-x-2 text-indigo-400">
                  <ModernIcon icon={CreditCard} color="indigo" size="sm" />
                  <span>Contas Bancárias & Cartões de Crédito</span>
                </h3>
                <button onClick={() => setActiveSheet(null)} className={`p-1.5 rounded-full transition-colors ${isDarkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-200 text-slate-600'}`}>
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tabs */}
              <div className={`p-1 rounded-2xl border ${innerInputBg} grid grid-cols-2 gap-1 text-xs font-bold`}>
                <button
                  type="button"
                  onClick={() => setAccountsTab('accounts')}
                  className={`py-2 rounded-xl transition-all ${accountsTab === 'accounts' ? 'bg-indigo-600 text-white shadow-md' : subText}`}
                >
                  Contas ({accounts.length})
                </button>
                <button
                  type="button"
                  onClick={() => setAccountsTab('cards')}
                  className={`py-2 rounded-xl transition-all ${accountsTab === 'cards' ? 'bg-purple-600 text-white shadow-md' : subText}`}
                >
                  Cartões de Crédito ({creditCards.length})
                </button>
              </div>

              {/* Tab 1: Bank Accounts */}
              {accountsTab === 'accounts' && (
                <div className="space-y-4">
                  {isAccFormOpen ? (
                    <div className={`p-4 rounded-2xl border ${innerInputBg} space-y-3`}>
                      <h4 className="text-xs font-bold">{editingAccId ? 'Editar Conta' : 'Nova Conta'}</h4>
                      <div>
                        <label className={`text-[10px] uppercase font-bold ${subText} block mb-1`}>Nome da Conta / Banco</label>
                        <input type="text" value={accName} onChange={(e) => setAccName(e.target.value)} placeholder="Ex: Itaú, Nubank" className={`w-full p-2.5 rounded-xl border ${cardBg} text-xs outline-none`} />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={`text-[10px] uppercase font-bold ${subText} block mb-1`}>Saldo Atual (R$)</label>
                          <input type="number" value={accBalance} onChange={(e) => setAccBalance(e.target.value)} placeholder="-800.00" className={`w-full p-2.5 rounded-xl border ${cardBg} text-xs outline-none font-bold ${parseFloat(accBalance) < 0 ? 'text-rose-400' : 'text-emerald-400'}`} />
                        </div>
                        <div>
                          <label className={`text-[10px] uppercase font-bold ${subText} block mb-1`}>Cheque Especial (R$)</label>
                          <input type="number" value={accOverdraft} onChange={(e) => setAccOverdraft(e.target.value)} placeholder="1000.00" className={`w-full p-2.5 rounded-xl border ${cardBg} text-xs outline-none font-bold text-amber-400`} />
                        </div>
                      </div>
                      <div>
                        <label className={`text-[10px] uppercase font-bold ${subText} block mb-1`}>Cor da Conta</label>
                        <input type="color" value={accColor} onChange={(e) => setAccColor(e.target.value)} className="w-full h-9 rounded-xl cursor-pointer bg-transparent border-0" />
                      </div>
                      <div className="flex space-x-2 pt-1">
                        <button onClick={() => { setIsAccFormOpen(false); setEditingAccId(null); }} className={`flex-1 py-2 rounded-xl text-xs font-bold border ${cardBg}`}>Cancelar</button>
                        <button onClick={handleSaveAccount} className="flex-1 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold">Salvar Conta</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        {accounts.map(acc => {
                          const accAvailable = acc.balance + (acc.overdraftLimit || 0);
                          return (
                            <div key={acc.id} className="relative overflow-hidden flex items-center justify-between p-3.5 rounded-2xl border shadow-sm" style={{ borderLeft: `4px solid ${acc.color}`, backgroundColor: isDarkMode ? '#1a1c24' : '#ffffff', borderColor: isDarkMode ? '#2d2f3a' : '#e2e8f0', borderLeftColor: acc.color }}>
                              <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ background: `linear-gradient(to right, ${acc.color}, transparent)` }}></div>
                              <div className="relative z-10 flex items-center space-x-3">
                                <div className="flex flex-col">
                                  <div className="flex items-center space-x-2">
                                    <span style={{ color: acc.color }}>🏦</span>
                                    <p className="text-sm font-bold" style={{ color: isDarkMode ? '#e2e8f0' : '#334155' }}>{acc.name}</p>
                                  </div>
                                  <div className="flex items-center space-x-2 text-[11px] mt-1">
                                    <span className={acc.balance > 0 ? 'text-emerald-400 font-black' : acc.balance < 0 ? 'text-rose-400 font-black' : (isDarkMode ? 'text-slate-400 font-bold' : 'text-slate-500 font-bold')}>
                                      R$ {acc.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </span>
                                    {acc.overdraftLimit > 0 && (
                                      <span className="text-amber-400 font-bold">• Limite: R$ {acc.overdraftLimit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="relative z-10 flex items-center space-x-1 shrink-0">
                                <button onClick={() => { setAccName(acc.name); setAccBalance(acc.balance.toString()); setAccOverdraft((acc.overdraftLimit || 0).toString()); setAccColor(acc.color); setEditingAccId(acc.id); setIsAccFormOpen(true); }} className="p-2 rounded-lg hover:bg-slate-500/10 text-slate-400 transition-colors"><Edit3 className="w-4 h-4" /></button>
                                <button onClick={() => handleDeleteAccount(acc.id)} className="p-2 rounded-lg hover:bg-rose-500/10 text-rose-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <button onClick={() => { setAccName(''); setAccBalance(''); setAccOverdraft(''); setIsAccFormOpen(true); setEditingAccId(null); }} className="w-full py-3 rounded-2xl border border-dashed border-indigo-500/40 text-indigo-400 font-bold text-xs hover:bg-indigo-500/10">
                        + Adicionar Conta Bancária
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* Tab 2: Credit Cards */}
              {accountsTab === 'cards' && (
                <div className="space-y-4">
                  {isCardFormOpen ? (
                    <div className={`p-4 rounded-2xl border ${innerInputBg} space-y-3`}>
                      <h4 className="text-xs font-bold">{editingCardId ? 'Editar Cartão' : 'Novo Cartão de Crédito'}</h4>
                      <div>
                        <label className={`text-[10px] uppercase font-bold ${subText} block mb-1`}>Nome do Cartão</label>
                        <input type="text" value={cardName} onChange={(e) => setCardName(e.target.value)} placeholder="Ex: Nubank Roxinho" className={`w-full p-2.5 rounded-xl border ${cardBg} text-xs outline-none`} />
                      </div>
                      <div>
                        <label className={`text-[10px] uppercase font-bold ${subText} block mb-1`}>Limite Total (R$)</label>
                        <input type="number" value={cardTotalLimit} onChange={(e) => setCardTotalLimit(e.target.value)} placeholder="5000.00" className={`w-full p-2.5 rounded-xl border ${cardBg} text-xs outline-none`} />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={`text-[10px] uppercase font-bold ${subText} block mb-1`}>Dia do Fechamento</label>
                          <input type="number" value={cardClosingDay} onChange={(e) => setCardClosingDay(e.target.value)} placeholder="20" className={`w-full p-2.5 rounded-xl border ${cardBg} text-xs outline-none`} />
                        </div>
                        <div>
                          <label className={`text-[10px] uppercase font-bold ${subText} block mb-1`}>Dia do Vencimento</label>
                          <input type="number" value={cardDueDay} onChange={(e) => setCardDueDay(e.target.value)} placeholder="28" className={`w-full p-2.5 rounded-xl border ${cardBg} text-xs outline-none`} />
                        </div>
                      </div>
                      <div className="flex space-x-2 pt-1">
                        <button onClick={() => { setIsCardFormOpen(false); setEditingCardId(null); }} className={`flex-1 py-2 rounded-xl text-xs font-bold border ${cardBg}`}>Cancelar</button>
                        <button onClick={handleSaveCard} className="flex-1 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold">Salvar Cartão</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        {creditCards.map(card => {
                          const usedLimit = getCardUsedFromBills(card.name);
                          const freeLimit = card.totalLimit - usedLimit;
                          const percentUsed = card.totalLimit > 0 ? (usedLimit / card.totalLimit) * 100 : 0;
                          return (
                            <div key={card.id} className="relative rounded-2xl overflow-hidden p-4 aspect-[16/10] flex flex-col justify-between shadow-lg border-0" style={{ background: `linear-gradient(135deg, ${card.color}dd 0%, ${card.color} 100%)` }}>
                              <div className="absolute inset-0 bg-black/10 mix-blend-overlay pointer-events-none"></div>
                              
                              <div className="relative z-10 flex justify-between items-start">
                                <span className="text-white/90 text-xs uppercase font-bold tracking-widest truncate">{card.name}</span>
                                <div className="flex space-x-1">
                                  <button onClick={() => { setCardName(card.name); setCardTotalLimit(card.totalLimit.toString()); setCardClosingDay(card.closingDay.toString()); setCardDueDay(card.dueDay.toString()); setCardColor(card.color); setEditingCardId(card.id); setIsCardFormOpen(true); }} className="p-2 rounded-xl hover:bg-white/20 text-white transition-colors"><Edit3 className="w-4 h-4" /></button>
                                  <button onClick={() => handleDeleteCard(card.id)} className="p-2 rounded-xl hover:bg-rose-500/80 text-white transition-colors"><Trash2 className="w-4 h-4" /></button>
                                </div>
                              </div>
                              
                              <div className="relative z-10 flex gap-6">
                                <div className="flex flex-col">
                                  <span className="text-white/60 text-[9px] uppercase tracking-wider">Limite Total</span>
                                  <span className="text-white font-bold text-base">R$ {card.totalLimit.toLocaleString('pt-BR')}</span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-white/60 text-[9px] uppercase tracking-wider">Livre</span>
                                  <span className="text-emerald-300 font-black text-base">R$ {freeLimit.toLocaleString('pt-BR')}</span>
                                </div>
                              </div>
                              
                              <div className="relative z-10 space-y-2">
                                <div className="w-full bg-black/30 rounded-full h-1.5 overflow-hidden">
                                  <div className={`h-full rounded-full ${percentUsed > 80 ? 'bg-rose-400' : 'bg-emerald-400'}`} style={{ width: `${Math.min(percentUsed, 100)}%` }}></div>
                                </div>
                                <div className="flex justify-between items-center text-[10px] text-white/80 font-medium">
                                  <span>F: dia {card.closingDay} / V: dia {card.dueDay}</span>
                                  {percentUsed > 80 && <span className="text-rose-300 font-bold bg-rose-500/20 px-2 py-0.5 rounded-full">⚠️ CRÍTICO</span>}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <button onClick={() => { setCardName(''); setCardTotalLimit(''); setIsCardFormOpen(true); setEditingCardId(null); }} className="w-full py-3 rounded-2xl border border-dashed border-purple-500/40 text-purple-400 font-bold text-xs hover:bg-purple-500/10">
                        + Adicionar Cartão de Crédito
                      </button>
                    </>
                  )}
                </div>
              )}

            </div>
          </div>
        )}

      </div>
    </div>
  );
}

