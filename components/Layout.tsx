
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  FileText, 
  LogOut,
  ChevronRight,
  Database,
  BrainCircuit,
  Cloud,
  CloudOff,
  RefreshCw,
  Menu,
  X
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { UserRole } from '../types';
import { db } from '../services/dbService';

interface LayoutProps {
  children: React.ReactNode;
  userRole: UserRole;
  onLogout: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, userRole, onLogout, activeTab, setActiveTab }) => {
  const [isOnline, setIsOnline] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    db.onConnectionStatusChange((online) => {
      setIsOnline(online);
    });
  }, []);

  const handleRetry = async () => {
    setIsRetrying(true);
    const success = await db.retryConnection();
    setIsRetrying(false);
    if (!success) {
      alert("Acesso negado ou erro de conexão com o Supabase.");
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: [UserRole.ADMIN, UserRole.RH, UserRole.DELIVERY] },
    { id: 'candidates', label: 'Candidatos', icon: Users, roles: [UserRole.ADMIN, UserRole.RH] },
    { id: 'linkedin_analyses', label: 'Análise DISC', icon: BrainCircuit, roles: [UserRole.ADMIN, UserRole.RH] },
    { id: 'templates', label: 'Modelos de Testes', icon: FileText, roles: [UserRole.ADMIN, UserRole.DELIVERY] },
    { id: 'config', label: 'Configurações', icon: Settings, roles: [UserRole.ADMIN] },
    { id: 'bank', label: 'Banco de Questões', icon: Database, roles: [UserRole.ADMIN, UserRole.DELIVERY] },
  ];

  const filteredMenu = menuItems.filter(item => item.roles.includes(userRole));

  const handleTabClick = (id: string) => {
    setActiveTab(id);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden flex-col md:flex-row">
      {/* Mobile Top Bar */}
      <div className="md:hidden bg-slate-900 text-white p-4 flex items-center justify-between sticky top-0 z-[110] shadow-lg">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold tracking-tight text-blue-400">SAP Talent Pro</h1>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-slate-400 hover:text-white transition-colors"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside className={`
        fixed md:relative w-64 bg-slate-900 text-white h-full z-[105] flex flex-col shrink-0 transition-transform duration-300
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-6 hidden md:flex justify-between items-start">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-blue-400">SAP Talent Pro</h1>
            <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest">Supabase Backend</p>
          </div>
          <div className="group relative">
            <div className={`w-3 h-3 rounded-full shadow-lg ${isOnline ? 'bg-green-500 shadow-green-500/50' : 'bg-red-500 shadow-red-500/50 animate-pulse'}`}></div>
          </div>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {filteredMenu.map((item) => (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === item.id || (item.id === 'linkedin_analyses' && activeTab === 'linkedin_detail')
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <item.icon size={20} className="shrink-0" />
              <span className="font-medium text-left">{item.label}</span>
              {(activeTab === item.id || (item.id === 'linkedin_analyses' && activeTab === 'linkedin_detail')) && <ChevronRight size={16} className="ml-auto shrink-0" />}
            </button>
          ))}
        </nav>
        
        <div className="px-6 py-4 bg-slate-800/30 flex items-center justify-between group">
           <div className="flex items-center gap-2">
             {isOnline ? <Cloud className="text-green-500" size={14} /> : <CloudOff className="text-red-500" size={14} />}
             <div className="text-[9px] font-black uppercase tracking-widest leading-tight">
               <span className={isOnline ? 'text-green-500' : 'text-red-500'}>{isOnline ? 'Sincronizado' : 'Modo Local'}</span>
             </div>
           </div>
           {!isOnline && (
             <button onClick={handleRetry} disabled={isRetrying} className="p-1.5 hover:bg-slate-700 rounded-md text-slate-400">
               <RefreshCw size={12} className={isRetrying ? 'animate-spin' : ''} />
             </button>
           )}
        </div>

        <div className="p-4 border-t border-slate-800">
          <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors">
            <LogOut size={18} />
            <span className="text-sm font-bold">Sair</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto relative p-4 md:p-8">
        <div className="max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  );
};

export default Layout;
