
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, X, Settings2, Package, Factory, HardHat, DatabaseZap, CheckCircle2, UserCircle2 } from 'lucide-react';
import { db } from '../services/dbService';
import { SAPModule, Industry } from '../types';

const SettingsView: React.FC = () => {
  const [modules, setModules] = useState<SAPModule[]>([]);
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [roles, setRoles] = useState<string[]>(['Consultor Funcional', 'Consultor Técnico', 'Gerente de Projetos', 'Arquiteto de Soluções']);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState(false);
  
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [showIndustryModal, setShowIndustryModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const [ms, inds] = await Promise.all([db.getModules(), db.getIndustries()]);
      setModules(ms);
      setIndustries(inds);
      const savedRoles = localStorage.getItem('fb_roles');
      if (savedRoles) setRoles(JSON.parse(savedRoles));
    };
    loadData();
  }, []);

  const handleSeed = async () => {
    if (!confirm('Isso irá enviar os módulos e indústrias padrão para o seu Firestore. Deseja continuar?')) return;
    setIsSeeding(true);
    try {
      await db.seedDatabase();
      setSeedSuccess(true);
      setTimeout(() => setSeedSuccess(false), 3000);
      const [ms, inds] = await Promise.all([db.getModules(), db.getIndustries()]);
      setModules(ms);
      setIndustries(inds);
    } catch (e: any) {
      alert("Erro ao sincronizar. Verifique se as regras do Firestore estão abertas.\nErro: " + e.message);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleAddModule = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const category = formData.get('category') as any;

    if (name) {
      const newModule: SAPModule = { 
        id: name.toLowerCase().replace(/\s/g, '_'), 
        name, 
        category 
      };
      const updated = [...modules, newModule];
      setModules(updated);
      db.saveModules(updated);
      setShowModuleModal(false);
    }
  };

  const handleAddIndustry = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;

    if (name) {
      const newIndustry: Industry = { 
        id: name.toLowerCase().replace(/\s/g, '_'), 
        name 
      };
      const updated = [...industries, newIndustry];
      setIndustries(updated);
      db.saveIndustries(updated);
      setShowIndustryModal(false);
    }
  };

  const handleAddRole = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    if (name) {
      const updated = [...roles, name];
      setRoles(updated);
      localStorage.setItem('fb_roles', JSON.stringify(updated));
      setShowRoleModal(false);
    }
  };

  const removeItem = (type: 'module' | 'industry' | 'role', id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm('Deseja realmente remover este item?')) {
      if (type === 'module') {
        const updated = modules.filter(m => m.id !== id);
        setModules(updated);
        db.saveModules(updated);
      } else if (type === 'industry') {
        const updated = industries.filter(i => i.id !== id);
        setIndustries(updated);
        db.saveIndustries(updated);
      } else {
        const updated = roles.filter(r => r !== id);
        setRoles(updated);
        localStorage.setItem('fb_roles', JSON.stringify(updated));
      }
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 relative z-0">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-600/20">
            <Settings2 size={28} />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-slate-900">Configurações do Sistema</h2>
            <p className="text-slate-500 font-medium">Gerencie parâmetros de módulos, indústrias e funções</p>
          </div>
        </div>

        <button 
          onClick={handleSeed}
          disabled={isSeeding}
          className={`flex items-center gap-2 px-6 py-3 font-bold rounded-2xl transition-all shadow-lg ${
            seedSuccess ? 'bg-green-600 text-white' : 'bg-slate-900 text-white hover:bg-slate-800'
          }`}
        >
          {seedSuccess ? <CheckCircle2 size={20} /> : <DatabaseZap size={20} />}
          {isSeeding ? 'Sincronizando...' : seedSuccess ? 'Sincronizado!' : 'Sincronizar Dados Iniciais'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Modules Section */}
        <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden flex flex-col h-[500px]">
          <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
            <div className="flex items-center gap-3 text-blue-600">
              <Package size={20} />
              <h3 className="font-bold uppercase text-xs tracking-widest text-slate-800">Módulos SAP</h3>
            </div>
            <button 
              type="button"
              onClick={() => setShowModuleModal(true)} 
              className="p-2.5 bg-blue-600 text-white hover:bg-blue-700 rounded-xl transition-all shadow-md shadow-blue-600/20 active:scale-95"
            >
              <Plus size={20} />
            </button>
          </div>
          <div className="flex-1 p-6 space-y-3 overflow-y-auto">
            {modules.map(m => (
              <div key={m.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl group hover:bg-white hover:shadow-md border border-transparent hover:border-slate-100 transition-all">
                <div>
                  <div className="font-bold text-slate-800">{m.name}</div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{m.category}</div>
                </div>
                <button onClick={(e) => removeItem('module', m.id, e)} className="p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all bg-white rounded-lg shadow-sm border border-slate-50">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Industries Section */}
        <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden flex flex-col h-[500px]">
          <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
            <div className="flex items-center gap-3 text-amber-600">
              <Factory size={20} />
              <h3 className="font-bold uppercase text-xs tracking-widest text-slate-800">Indústrias</h3>
            </div>
            <button 
              type="button"
              onClick={() => setShowIndustryModal(true)} 
              className="p-2.5 bg-blue-600 text-white hover:bg-blue-700 rounded-xl transition-all shadow-md shadow-blue-600/20 active:scale-95"
            >
              <Plus size={20} />
            </button>
          </div>
          <div className="flex-1 p-6 space-y-3 overflow-y-auto">
            {industries.map(i => (
              <div key={i.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl group hover:bg-white hover:shadow-md border border-transparent hover:border-slate-100 transition-all">
                <span className="font-bold text-slate-800">{i.name}</span>
                <button onClick={(e) => removeItem('industry', i.id, e)} className="p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all bg-white rounded-lg shadow-sm border border-slate-100">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Roles Section */}
        <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden flex flex-col h-[500px]">
          <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
            <div className="flex items-center gap-3 text-emerald-600">
              <UserCircle2 size={20} />
              <h3 className="font-bold uppercase text-xs tracking-widest text-slate-800">Funções</h3>
            </div>
            <button 
              type="button"
              onClick={() => setShowRoleModal(true)} 
              className="p-2.5 bg-blue-600 text-white hover:bg-blue-700 rounded-xl transition-all shadow-md shadow-blue-600/20 active:scale-95"
            >
              <Plus size={20} />
            </button>
          </div>
          <div className="flex-1 p-6 space-y-3 overflow-y-auto">
            {roles.map(r => (
              <div key={r} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl group hover:bg-white hover:shadow-md border border-transparent hover:border-slate-100 transition-all">
                <span className="font-bold text-slate-800">{r}</span>
                <button onClick={(e) => removeItem('role', r, e)} className="p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all bg-white rounded-lg shadow-sm border border-slate-50">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* New Module Modal */}
      {showModuleModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="bg-slate-900 p-8 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <Package className="text-blue-400" />
                <h3 className="text-xl font-bold">Novo Módulo SAP</h3>
              </div>
              <button onClick={() => setShowModuleModal(false)} className="text-slate-400 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleAddModule} className="p-8 space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome do Módulo</label>
                <input autoFocus required name="name" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Categoria</label>
                <select name="category" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none">
                  <option value="FUNCTIONAL">Funcional</option>
                  <option value="TECHNICAL">Técnico</option>
                  <option value="MANAGEMENT">Gerencial</option>
                </select>
              </div>
              <button type="submit" className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl shadow-xl">Adicionar Módulo</button>
            </form>
          </div>
        </div>
      )}

      {/* New Industry Modal */}
      {showIndustryModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="bg-slate-900 p-8 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <Factory className="text-amber-400" />
                <h3 className="text-xl font-bold">Nova Indústria</h3>
              </div>
              <button onClick={() => setShowIndustryModal(false)} className="text-slate-400 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleAddIndustry} className="p-8 space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome da Indústria</label>
                <input autoFocus required name="name" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none" />
              </div>
              <button type="submit" className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl shadow-xl">Adicionar Indústria</button>
            </form>
          </div>
        </div>
      )}

      {/* New Role Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="bg-slate-900 p-8 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <UserCircle2 className="text-emerald-400" />
                <h3 className="text-xl font-bold">Nova Função</h3>
              </div>
              <button onClick={() => setShowRoleModal(false)} className="text-slate-400 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleAddRole} className="p-8 space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome da Função</label>
                <input autoFocus required name="name" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none" />
              </div>
              <button type="submit" className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl shadow-xl">Adicionar Função</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsView;
