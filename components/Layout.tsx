
import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  FileText, 
  LogOut,
  ChevronRight,
  Database
} from 'lucide-react';
import { UserRole } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  userRole: UserRole;
  onLogout: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, userRole, onLogout, activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: [UserRole.ADMIN, UserRole.RH, UserRole.DELIVERY] },
    { id: 'candidates', label: 'Candidatos', icon: Users, roles: [UserRole.ADMIN, UserRole.RH] },
    { id: 'templates', label: 'Modelos de Avaliação', icon: FileText, roles: [UserRole.ADMIN, UserRole.DELIVERY] },
    { id: 'config', label: 'Configurações', icon: Settings, roles: [UserRole.ADMIN] },
    { id: 'bank', label: 'Banco de Questões', icon: Database, roles: [UserRole.ADMIN, UserRole.DELIVERY] },
  ];

  const filteredMenu = menuItems.filter(item => item.roles.includes(userRole));

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shrink-0">
        <div className="p-6">
          <h1 className="text-xl font-bold tracking-tight text-blue-400">SAP Talent Pro</h1>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest">Assessment System</p>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          {filteredMenu.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activeTab === item.id 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
              {activeTab === item.id && <ChevronRight size={16} className="ml-auto" />}
            </button>
          ))}
        </nav>

        <div className="p-4 mt-auto border-t border-slate-800">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold uppercase">
              {userRole.substring(0, 2)}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-medium truncate">Usuário {userRole}</span>
              <span className="text-xs text-slate-500 uppercase tracking-tighter">Sessão Ativa</span>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <LogOut size={18} />
            <span className="text-sm">Sair do Sistema</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative p-8">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
