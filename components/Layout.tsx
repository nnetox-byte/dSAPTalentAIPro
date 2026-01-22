
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
  X,
  ShieldCheck,
  Key,
  Loader2,
  CheckCircle2,
  ShieldAlert,
  Cookie,
  ExternalLink,
  Info
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { Profile } from '../types';
import { db } from '../services/dbService';

interface LayoutProps {
  children: React.ReactNode;
  profile: Profile;
  onLogout: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, profile, onLogout, activeTab, setActiveTab }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [showCookieBanner, setShowCookieBanner] = useState(false);
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const consent = localStorage.getItem('sap_talent_cookie_consent');
    if (!consent) {
      setTimeout(() => setShowCookieBanner(true), 1500);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem('sap_talent_cookie_consent', 'accepted');
    setShowCookieBanner(false);
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, slug: 'dashboard' },
    { id: 'candidates', label: 'Candidatos', icon: Users, slug: 'candidates' },
    { id: 'linkedin_analyses', label: 'Análise DISC', icon: BrainCircuit, slug: 'linkedin_analyses' },
    { id: 'templates', label: 'Modelos de Testes', icon: FileText, slug: 'templates' },
    { id: 'access_management', label: 'Gestão de Acessos', icon: ShieldCheck, slug: 'access_management' },
    { id: 'bank', label: 'Banco de Questões', icon: Database, slug: 'bank' },
    { id: 'compliance', label: 'Compliance & Segurança', icon: ShieldCheck, slug: 'compliance' },
    { id: 'config', label: 'Configurações', icon: Settings, slug: 'config' },
  ];

  const filteredMenu = menuItems.filter(item => {
    if (item.id === 'compliance') return true;
    return profile.perfil?.funcionalidades?.includes(item.slug);
  });

  const handleTabClick = (id: string) => {
    setActiveTab(id);
    setIsMobileMenuOpen(false);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("As senhas não conferem.");
      return;
    }

    setIsUpdating(true);
    try {
      await db.updatePassword(newPassword);
      setUpdateSuccess(true);
      setTimeout(() => {
        setIsPasswordModalOpen(false);
        setUpdateSuccess(false);
        setNewPassword('');
        setConfirmPassword('');
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Erro ao atualizar senha.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden flex-col md:flex-row">
      {/* Mobile Top Bar */}
      <div className="md:hidden bg-slate-900 text-white p-4 flex items-center justify-between sticky top-0 z-[110] shadow-lg">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold tracking-tight text-blue-400">SAP Talent Pro</h1>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-400">
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <aside className={`fixed md:relative w-64 bg-slate-900 text-white h-full z-[105] flex flex-col shrink-0 transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-6">
          <h1 className="text-xl font-bold text-blue-400 uppercase tracking-tighter">SAP Talent Pro</h1>
          <div className="mt-4 flex items-center gap-2 px-3 py-2 bg-slate-800/50 rounded-xl border border-slate-700/50">
             <div className="w-2 h-2 rounded-full bg-green-500"></div>
             <span className="text-[10px] font-black uppercase text-slate-300 truncate">{profile.perfil?.nome}</span>
          </div>
          <p className="text-[9px] text-slate-500 mt-2 font-bold truncate">{profile.email}</p>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {filteredMenu.map((item) => (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === item.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <item.icon size={20} className="shrink-0" />
              <span className="font-medium text-left text-sm">{item.label}</span>
            </button>
          ))}
        </nav>
        
        <div className="p-4 border-t border-slate-800 space-y-2">
          <button 
            onClick={() => setIsPasswordModalOpen(true)}
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-xl transition-colors"
          >
            <Key size={18} />
            <span className="text-sm font-bold">Alterar Senha</span>
          </button>
          <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors">
            <LogOut size={18} />
            <span className="text-sm font-bold">Sair</span>
          </button>

          <div className="pt-4 flex flex-col gap-2">
            <button onClick={() => handleTabClick('compliance')} className="text-[10px] text-slate-500 hover:text-slate-300 font-bold uppercase tracking-widest text-left px-4">Centro de Compliance</button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto relative p-4 md:p-8 flex flex-col">
        <div className="max-w-6xl mx-auto flex-1 w-full">{children}</div>
        
        <footer className="max-w-6xl mx-auto w-full mt-12 py-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-widest">
            <ShieldCheck size={16} className="text-blue-500" />
            © {new Date().getFullYear()} SAP Talent Pro • Delaware Brasil • LGPD Compliance
          </div>
          <div className="flex gap-6">
            <button onClick={() => handleTabClick('compliance')} className="text-[10px] text-slate-500 hover:text-blue-600 font-bold uppercase tracking-widest">Compliance & Segurança</button>
          </div>
        </footer>
      </main>

      {/* Modal Alterar Senha */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden border border-slate-200">
            <div className="bg-slate-900 p-8 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <Key className="text-blue-400" size={24} />
                <h3 className="text-xl font-bold tracking-tight">Alterar Senha</h3>
              </div>
              <button 
                onClick={() => { setIsPasswordModalOpen(false); setError(null); }} 
                className="text-slate-400 hover:text-white transition-colors p-2"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleUpdatePassword} className="p-8 space-y-6">
              {updateSuccess ? (
                <div className="py-10 flex flex-col items-center gap-4 text-center">
                  <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                    <CheckCircle2 size={40} />
                  </div>
                  <h4 className="text-lg font-bold text-slate-900">Senha Alterada!</h4>
                  <p className="text-sm text-slate-500">Sua nova senha foi salva com sucesso.</p>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">NOVA SENHA</label>
                      <input 
                        type="password" 
                        required 
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres" 
                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-medium" 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">CONFIRMAR NOVA SENHA</label>
                      <input 
                        type="password" 
                        required 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repita a senha" 
                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-medium" 
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 text-red-600 border border-red-100 rounded-xl text-[10px] font-bold text-center uppercase tracking-widest">
                      {error}
                    </div>
                  )}

                  <button 
                    type="submit" 
                    disabled={isUpdating} 
                    className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl flex items-center justify-center gap-3 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isUpdating ? <Loader2 className="animate-spin" /> : "Salvar Nova Senha"}
                  </button>
                </>
              )}
            </form>
          </div>
        </div>
      )}

      {/* BANNER DE COOKIES */}
      {showCookieBanner && (
        <div className="fixed bottom-6 left-6 right-6 md:left-auto md:right-8 md:w-[400px] z-[300] bg-white rounded-[32px] shadow-2xl border border-slate-200 p-8">
          <div className="flex gap-4 items-start mb-6">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl shrink-0">
              <ShieldCheck size={24} />
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Aviso de Cookies</h4>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Utilizamos cookies essenciais para garantir o funcionamento do sistema e a segurança das suas avaliações técnicos.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={acceptCookies}
              className="flex-1 py-3 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
            >
              Aceitar Tudo
            </button>
            <button 
              onClick={() => handleTabClick('compliance')}
              className="py-3 px-6 border border-slate-200 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-50 transition-all"
            >
              Políticas
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
