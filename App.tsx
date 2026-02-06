
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  LayoutDashboard, Package, History, Settings, LogOut, Menu, X, 
  ShieldCheck, Bell, ShieldAlert, Building, Bot, CreditCard, Truck
} from 'lucide-react';
import { Transaction, Product, UserProfile, StaffMember, AuditLog, BusinessType, Debt, Supplier } from './types';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import Transactions from './components/Transactions';
import FloatingConsole from './components/FloatingConsole';
import Auth from './components/Auth';
import Receipt from './components/Receipt';
import AdminConsole from './components/AdminConsole';
import DebtsModule from './components/DebtsModule';
import SuppliersModule from './components/SuppliersModule';

const App: React.FC = () => {
  const [isAuth, setIsAuth] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inventory' | 'history' | 'admin' | 'debts' | 'suppliers'>('dashboard');
  const [user, setUser] = useState<UserProfile | null>(null);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeReceipt, setActiveReceipt] = useState<Transaction | null>(null);

  useEffect(() => {
    const saved = {
      staff: localStorage.getItem('aes_staff'),
      logs: localStorage.getItem('aes_audit'),
      transactions: localStorage.getItem('aes_transactions'),
      products: localStorage.getItem('aes_products'),
      user: localStorage.getItem('aes_user_profile'),
      debts: localStorage.getItem('aes_debts'),
      suppliers: localStorage.getItem('aes_suppliers'),
    };
    if (saved.staff) setStaff(JSON.parse(saved.staff));
    if (saved.logs) setAuditLogs(JSON.parse(saved.logs));
    if (saved.transactions) setTransactions(JSON.parse(saved.transactions));
    if (saved.products) setProducts(JSON.parse(saved.products));
    if (saved.user) setUser(JSON.parse(saved.user));
    if (saved.debts) setDebts(JSON.parse(saved.debts));
    if (saved.suppliers) setSuppliers(JSON.parse(saved.suppliers));
  }, []);

  useEffect(() => {
    localStorage.setItem('aes_staff', JSON.stringify(staff));
    localStorage.setItem('aes_audit', JSON.stringify(auditLogs));
    localStorage.setItem('aes_transactions', JSON.stringify(transactions));
    localStorage.setItem('aes_products', JSON.stringify(products));
    localStorage.setItem('aes_debts', JSON.stringify(debts));
    localStorage.setItem('aes_suppliers', JSON.stringify(suppliers));
    if (user) localStorage.setItem('aes_user_profile', JSON.stringify(user));
  }, [staff, auditLogs, transactions, products, debts, suppliers, user]);

  const addAudit = useCallback((action: string, details: string, severity: 'low' | 'medium' | 'high' = 'low') => {
    const newLog: AuditLog = {
      id: Math.random().toString(36).substr(2, 9).toUpperCase(),
      timestamp: new Date().toISOString(),
      user: user?.name || 'Système',
      action,
      details,
      severity
    };
    setAuditLogs(prev => [newLog, ...prev]);
  }, [user]);

  const addTransaction = useCallback((t: Omit<Transaction, 'id' | 'date'>) => {
    const newT: Transaction = { 
      ...t, 
      id: Math.random().toString(36).substr(2, 9).toUpperCase(), 
      date: new Date().toISOString(),
      staffName: user?.name
    };
    setTransactions(prev => [newT, ...prev]);
    
    if (t.type === 'purchase' && t.supplierId) {
       setSuppliers(prev => prev.map(s => s.id === t.supplierId ? { ...s, totalBusiness: s.totalBusiness + t.amount, lastDelivery: new Date().toISOString() } : s));
    }

    addAudit("Finance", `Enregistrement: ${t.description} (${t.amount} F)`, 'low');
    if (newT.type === 'sale') setActiveReceipt(newT);
  }, [user, addAudit]);

  const addSupplier = useCallback((s: Omit<Supplier, 'id' | 'balance' | 'totalBusiness'>) => {
    const newS: Supplier = {
      ...s,
      id: `SUP-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      balance: 0,
      totalBusiness: 0
    };
    setSuppliers(prev => [...prev, newS]);
    addAudit("Partenaire", `Nouveau fournisseur ajouté : ${s.name}`, "medium");
  }, [addAudit]);

  const addDebt = useCallback((d: Omit<Debt, 'id' | 'date' | 'status' | 'remainingAmount'>) => {
    const newD: Debt = {
      ...d,
      id: `DBT-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      date: new Date().toISOString(),
      remainingAmount: d.amount,
      status: 'pending'
    };
    setDebts(prev => [newD, ...prev]);
    addAudit("Dette", `Nouvelle dette de ${d.customerName} : ${d.amount} F`, 'medium');
  }, [addAudit]);

  const handleDebtPayment = useCallback((debtId: string, amount: number) => {
    setDebts(prev => prev.map(d => {
      if (d.id === debtId) {
        const remaining = d.remainingAmount - amount;
        const status = remaining <= 0 ? 'paid' : 'partial';
        addTransaction({
          type: 'credit_repayment',
          amount: amount,
          description: `Remboursement Dette: ${d.customerName}`,
          category: 'Crédit',
          paymentMethod: 'Espèces',
          customerName: d.customerName
        });
        return { ...d, remainingAmount: Math.max(0, remaining), status };
      }
      return d;
    }));
  }, [addTransaction]);

  const updateBusiness = useCallback((type: BusinessType) => {
    if (user && user.role === 'owner') {
      setUser({ ...user, businessType: type });
      addAudit("Gouvernance", `Changement de type de business : ${type}`, "high");
    }
  }, [user, addAudit]);

  const handleAuthSuccess = (userData: any) => {
    const existing = localStorage.getItem('aes_user_profile');
    const final = existing ? { ...JSON.parse(existing), ...userData } : { 
      ...userData, 
      businessName: "AESCOMPT Professional",
      businessType: "general",
      location: "Bamako",
      learningProfile: {
        lastTopics: [],
        preferredLanguage: "Français",
        commonActions: {},
        businessPatterns: [],
        autoOptimizerEnabled: true
      },
      backupPhrase: ["AES", "ELITE", "SECURE", "MALI", "BAMAKO", "TRUST", "DATA", "GROWTH", "TRADE", "GOLD", "PROFIT", "VISION"]
    };
    setUser(final);
    setIsAuth(true);
    addAudit("Accès", "Connexion sécurisée réussie.", "medium");
  };

  if (!isAuth) return <Auth onAuthSuccess={handleAuthSuccess} />;

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-inter selection:bg-yellow-500/30">
      {isSidebarOpen && <div className="fixed inset-0 bg-black/90 z-[4000] lg:hidden backdrop-blur-3xl animate-in fade-in" onClick={() => setIsSidebarOpen(false)} />}
      
      <aside className={`fixed inset-y-0 left-0 z-[5000] w-80 bg-slate-900 border-r border-slate-800 transform transition-all duration-700 lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0 shadow-[0_0_100px_rgba(0,0,0,1)]' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="p-10 flex items-center gap-5">
             <div className="w-14 h-14 mali-gradient rounded-[24px] flex items-center justify-center font-black text-2xl text-white shadow-3xl">A</div>
             <div>
                <h1 className="text-2xl font-black italic tracking-tighter text-white uppercase leading-none">AESCOMPT</h1>
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.5em]">Gouvernance Pro</p>
             </div>
          </div>

          <nav className="flex-1 px-8 space-y-4 mt-8">
            {(['dashboard', 'inventory', 'suppliers', 'history', 'debts', 'admin'] as const).map(id => {
              const items = {
                dashboard: { label: 'Caisse', icon: LayoutDashboard },
                inventory: { label: 'Stock', icon: Package },
                suppliers: { label: 'Fournisseurs', icon: Truck },
                history: { label: 'Audit', icon: History },
                debts: { label: 'Dettes', icon: CreditCard },
                admin: { label: 'Patron', icon: ShieldCheck }
              };
              if (id === 'admin' && user?.role !== 'owner') return null;
              const Icon = items[id].icon;
              return (
                <button 
                  key={id} 
                  onClick={() => { setActiveTab(id); setIsSidebarOpen(false); }}
                  className={`w-full flex items-center gap-6 px-8 py-6 rounded-[32px] transition-all font-black text-[10px] uppercase tracking-widest ${activeTab === id ? 'bg-yellow-600 text-white shadow-2xl scale-[1.05]' : 'text-slate-500 hover:bg-slate-800 hover:text-slate-200'}`}
                >
                  <Icon className="w-6 h-6" />{items[id].label}
                </button>
              );
            })}
          </nav>

          <div className="p-10 border-t border-slate-800">
             <div className="p-6 bg-slate-950 rounded-[32px] border border-slate-800 mb-6 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center font-black text-yellow-500">{user?.name?.[0] || 'U'}</div>
                <div>
                   <p className="text-xs font-black text-white truncate">{user?.name}</p>
                   <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">{user?.role}</p>
                </div>
             </div>
            <button onClick={() => { setIsAuth(false); setUser(null); }} className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-slate-600 hover:text-red-500 font-black text-[10px] uppercase tracking-widest transition-all"><LogOut className="w-5 h-5" /> Quitter</button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden bg-slate-950">
        <header className="h-32 flex items-center justify-between px-10 border-b border-slate-800 bg-slate-950/40 backdrop-blur-3xl shrink-0 z-30">
          <div className="flex items-center gap-6">
            <button className="lg:hidden p-5 bg-slate-900 border border-slate-800 rounded-[24px]" onClick={() => setIsSidebarOpen(true)}><Menu className="w-8 h-8" /></button>
            <div className="hidden md:block">
               <h2 className="text-3xl font-black italic text-white uppercase tracking-tighter leading-none">{activeTab}</h2>
               <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mt-1">Gouvernance {user?.businessType}</p>
            </div>
          </div>
          <div className="flex items-center gap-8">
             <div className="flex flex-col items-end hidden sm:block">
                <p className="text-sm font-black text-white">{user?.businessName}</p>
                <p className="text-[9px] font-black text-yellow-600 uppercase tracking-widest">{user?.location}</p>
             </div>
             <div className="w-16 h-16 rounded-[28px] mali-gradient p-1 shadow-2xl">
                <div className="w-full h-full bg-slate-900 rounded-[24px] flex items-center justify-center font-black text-white text-xl overflow-hidden">
                   {user?.logo ? <img src={user.logo} className="w-full h-full object-cover" /> : (user?.name?.[0] || 'A')}
                </div>
             </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 md:p-14 custom-scrollbar">
          {activeTab === 'dashboard' && <Dashboard transactions={transactions} products={products} debts={debts} onAddTransaction={addTransaction} />}
          {activeTab === 'inventory' && <Inventory products={products} suppliers={suppliers} businessType={user?.businessType || 'general'} location={user?.location || 'Mali'} onAddProduct={(p) => setProducts(prev => [...prev, {...p, id: Math.random().toString(36).substr(2,9).toUpperCase(), createdAt: new Date().toISOString()}])} onUpdateStock={(id, qty) => setProducts(prev => prev.map(p => p.id === id ? {...p, stock: qty} : p))} userRole={user?.role} />}
          {activeTab === 'suppliers' && <SuppliersModule suppliers={suppliers} onAddSupplier={addSupplier} onUpdateBalance={(id, amt) => setSuppliers(prev => prev.map(s => s.id === id ? {...s, balance: s.balance + amt} : s))} />}
          {activeTab === 'history' && <Transactions transactions={transactions} />}
          {activeTab === 'debts' && <DebtsModule debts={debts} onAddDebt={addDebt} onPayDebt={handleDebtPayment} />}
          {activeTab === 'admin' && user?.role === 'owner' && <AdminConsole staff={staff} auditLogs={auditLogs} user={user!} onUpdateLogo={(l) => setUser({...user!, logo: l})} onUpdateBusiness={updateBusiness} onAddStaff={(s) => setStaff(prev => [...prev, {...s, id: Math.random().toString(36).substr(2,9).toUpperCase(), accessCode: `AES-${Math.random().toString(36).substr(2,4).toUpperCase()}`}])} onRevokeAccess={(id) => setStaff(prev => prev.map(s => s.id === id ? {...s, active: false} : s))} />}
        </div>
      </main>

      <FloatingConsole 
        user={user!} 
        products={products} 
        debts={debts}
        suppliers={suppliers}
        onAddTransaction={addTransaction} 
        onAddDebt={addDebt}
        onAddSupplier={addSupplier}
        onUpdateStock={(id, qty) => setProducts(prev => prev.map(p => p.id === id ? {...p, stock: qty} : p))} 
        onOpenTab={setActiveTab} 
        onUpdateBusiness={updateBusiness}
      />
      {activeReceipt && <Receipt transaction={activeReceipt} user={user!} onClose={() => setActiveReceipt(null)} />}
    </div>
  );
};

export default App;
