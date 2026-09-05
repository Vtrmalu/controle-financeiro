const fs = require('fs');
let content = fs.readFileSync('App.jsx', 'utf8').replace(/\r\n/g, '\n');

// The original string we want to replace
const targetStr = `  const [categories, setCategories] = useLocalStorage('categories', [
    { id: '1', name: 'Moradia', color: '#3b82f6', icon: Home, baseAllocated: 0 },
    { id: '2', name: 'Alimentação', color: '#10b981', icon: Utensils, baseAllocated: 0 },
    { id: '3', name: 'Transporte', color: '#f59e0b', icon: Car, baseAllocated: 0 },
    { id: '4', name: 'Lazer', color: '#ec4899', icon: Film, baseAllocated: 0 },
    { id: '5', name: 'Outros', color: '#8b5cf6', icon: Layers, baseAllocated: 0 },
  ]);`;

// The new string to replace with
const replacementStr = `  const [categories, setCategories] = useLocalStorage('categories', [
    { id: '1', name: 'Moradia', color: '#3b82f6', icon: Home, baseAllocated: 0 },
    { id: '2', name: 'Alimentação', color: '#10b981', icon: Utensils, baseAllocated: 0 },
    { id: '3', name: 'Transporte', color: '#f59e0b', icon: Car, baseAllocated: 0 },
    { id: '4', name: 'Lazer', color: '#ec4899', icon: Film, baseAllocated: 0 },
    { id: '6', name: 'Previstos', color: '#14b8a6', icon: Calendar, baseAllocated: 0 },
    { id: '7', name: 'Dívidas Serasa', color: '#f97316', icon: ShieldAlert, baseAllocated: 0 },
    { id: '5', name: 'Outros', color: '#8b5cf6', icon: Layers, baseAllocated: 0 },
  ]);`;

if (content.includes("name: 'Outros', color: '#8b5cf6'")) {
  content = content.replace(targetStr, replacementStr);
}

// But wait, what if the user's local storage already has the old categories?
// We need to inject a useEffect that pushes them if they're missing!
const hookTarget = `  // Confirm Deposit Modal State`;
const injection = `
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

  // Confirm Deposit Modal State`;

if (!content.includes('cat_prev') && content.includes(hookTarget)) {
  content = content.replace(hookTarget, injection);
  fs.writeFileSync('App.jsx', content);
  console.log('Categories injected successfully!');
} else {
  console.log('Target not found or already injected.');
}
