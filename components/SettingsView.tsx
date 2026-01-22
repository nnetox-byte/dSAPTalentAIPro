
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, X, Settings2, Package, Factory, Loader2, RefreshCw, ShieldCheck, Key, List, Check, Edit3 } from 'lucide-react';
import { db } from '../services/dbService';
import { SAPModule, Industry } from '../types';

const SettingsView: React.FC = () => {
  const [modules, setModules] = useState<SAPModule[]>([]);
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [dbProfiles, setDbProfiles] = useState<any[]>([]);
  const [features, setFeatures] = useState<any[]>([]);
  
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Estados dos Modais
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [showIndustryModal, setShowIndustryModal] = useState(false);
  const [showFeatureModal, setShowFeatureModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  
  // Estado para Edição de Perfil
  const [editingProfile, setEditingProfile] = useState<any>(null);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [ms, inds, profs, feats] = await Promise.all([
        db.getModules(), 
        db.getIndustries(),
        db.getProfilesWithFeatures(),
        db.getFeatures()
      ]);
      setModules(ms || []);
      setIndustries(inds || []);
      setDbProfiles(profs || []);
      setFeatures(feats || []);
    } catch (e) {
      console.error("Erro ao carregar configurações:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const nome = formData.get('nome') as string;
    const descricao = formData.get('descricao') as string;

    if (nome) {
      setIsSaving(true);
      try {
        await db.saveProfile(editingProfile?.id, nome, descricao, selectedFeatures);
        await loadData();
        setShowProfileModal(false);
        setEditingProfile(null);
        setSelectedFeatures([]);
      } catch (err: any) {
        alert("Erro ao salvar perfil: " + err.message);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleAddModule = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const category = formData.get('category') as any;

    if (name) {
      setIsSaving(true);
      try {
        const newModule: SAPModule = {
          id: name.toLowerCase().replace(/\s+/g, '_'),
          name,
          category
        };
        const updated = [...modules, newModule];
        await db.saveModules(updated);
        await loadData();
        setShowModuleModal(false);
      } catch (err: any) {
        alert("Erro ao salvar módulo: " + err.message);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleAddIndustry = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;

    if (name) {
      setIsSaving(true);
      try {
        const newIndustry: Industry = {
          id: name.toLowerCase().replace(/\s+/g, '_'),
          name
        };
        const updated = [...industries, newIndustry];
        await db.saveIndustries(updated);
        await loadData();
        setShowIndustryModal(false);
      } catch (err: any) {
        alert("Erro ao salvar indústria: " + err.message);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleAddFeature = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const nome = formData.get('nome') as string;
    const slug = formData.get('slug') as string;

    if (nome && slug) {
      setIsSaving(true);
      try {
        await db.saveFeature(nome, slug);
        await loadData();
        setShowFeatureModal(false);
      } catch (err: any) {
        alert("Erro ao salvar funcionalidade: " + err.message);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const removeItem = async (type: 'module' | 'industry' | 'feature' | 'profile', id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm('Deseja realmente remover este item permanentemente?')) {
      setIsSaving(true);
      try {
        if (type === 'module') await db.deleteModule(id);
        else if (type === 'industry') await db.deleteIndustry(id);
        else if (type === 'feature') await db.deleteFeature(id);
        else if (type === 'profile') await db.deleteProfile(id);
        await loadData();
      } catch (err: any) {
        alert("Erro ao excluir registro: " + err.message);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const toggleFeature = (id: string) => {
    setSelectedFeatures(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 relative z-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-600/20">
            <Settings2 size={28} />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-slate-900">Configurações do Sistema</h2>
            <p className="text-slate-500 font-medium">Gerenciamento de parâmetros e permissões de acesso</p>
          </div>
        </div>
        <button 
          onClick={loadData}
          disabled={isLoading || isSaving}
          className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-2xl shadow-sm hover:bg-slate-50 disabled:opacity-50 transition-all"
        >
          <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} /> 
          Sincronizar Banco
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Perfis de Acesso */}
        <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden flex flex-col h-[600px]">
          <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
            <div className="flex items-center gap-3 text-indigo-600">
              <ShieldCheck size={24} />
              <div>
                <h3 className="font-bold uppercase text-xs tracking-widest text-slate-800">Perfis de Acesso</h3>
                <p className="text-[10px] text-slate-400 font-medium tracking-tight">Cargos e grupos de permissão</p>
              </div>
            </div>
            <button 
              disabled={isSaving}
              onClick={() => { setEditingProfile(null); setSelectedFeatures([]); setShowProfileModal(true); }} 
              className="p-3 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl transition-all shadow-md shadow-indigo-600/20 active:scale-95 disabled:opacity-50"
            >
              <Plus size={20} />
            </button>
          </div>
          <div className="flex-1 p-6 space-y-4 overflow-y-auto bg-slate-50/30">
            {dbProfiles.map(p => (
              <div key={p.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm group hover:border-indigo-200 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold">
                      {p.nome?.charAt(0) || '?'}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800">{p.nome}</h4>
                      <p className="text-[10px] text-slate-400 font-medium line-clamp-1">{p.descricao || 'Sem descrição'}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button 
                      onClick={() => { 
                        setEditingProfile(p); 
                        setSelectedFeatures(p.funcionalidades?.map((f: any) => f.funcionalidade_id) || []); 
                        setShowProfileModal(true); 
                      }} 
                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                    >
                      <Edit3 size={18} />
                    </button>
                    <button 
                      onClick={(e) => removeItem('profile', p.id, e)} 
                      className="p-2 text-red-400 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-3 border-t border-slate-50">
                  {p.funcionalidades?.length > 0 ? (
                    p.funcionalidades.map((f: any) => {
                      const feat = features.find(feat => feat.id === f.funcionalidade_id);
                      return feat ? (
                        <span key={feat.id} className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[9px] font-black uppercase rounded border border-slate-200">
                          {feat.nome}
                        </span>
                      ) : null;
                    })
                  ) : (
                    <span className="text-[9px] text-slate-300 font-bold italic">Nenhuma funcionalidade associada</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Funcionalidades do Sistema */}
        <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden flex flex-col h-[600px]">
          <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
            <div className="flex items-center gap-3 text-emerald-600">
              <Key size={24} />
              <div>
                <h3 className="font-bold uppercase text-xs tracking-widest text-slate-800">Funcionalidades</h3>
                <p className="text-[10px] text-slate-400 font-medium tracking-tight">Ações e páginas controláveis</p>
              </div>
            </div>
            <button 
              disabled={isSaving}
              onClick={() => setShowFeatureModal(true)} 
              className="p-3 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl transition-all shadow-md shadow-emerald-600/20 active:scale-95 disabled:opacity-50"
            >
              <Plus size={20} />
            </button>
          </div>
          <div className="flex-1 p-6 space-y-3 overflow-y-auto">
            {features.map(f => (
              <div key={f.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl group hover:bg-white hover:shadow-md border border-transparent hover:border-slate-100 transition-all">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                    <List size={16} />
                  </div>
                  <div>
                    <div className="font-bold text-slate-800">{f.nome}</div>
                    <code className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{f.slug}</code>
                  </div>
                </div>
                <button 
                  disabled={isSaving}
                  onClick={(e) => removeItem('feature', f.id, e)} 
                  className="p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all bg-white rounded-lg shadow-sm border border-slate-100"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Módulos SAP */}
        <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden flex flex-col h-[500px]">
          <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
            <div className="flex items-center gap-3 text-blue-600">
              <Package size={20} />
              <h3 className="font-bold uppercase text-xs tracking-widest text-slate-800">Módulos SAP</h3>
            </div>
            <button 
              disabled={isSaving}
              onClick={() => setShowModuleModal(true)} 
              className="p-2.5 bg-blue-600 text-white hover:bg-blue-700 rounded-xl transition-all shadow-md shadow-blue-600/20 active:scale-95 disabled:opacity-50"
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
                <button 
                  disabled={isSaving}
                  onClick={(e) => removeItem('module', m.id, e)} 
                  className="p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all bg-white rounded-lg shadow-sm border border-slate-100"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Indústrias */}
        <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden flex flex-col h-[500px]">
          <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
            <div className="flex items-center gap-3 text-amber-600">
              <Factory size={20} />
              <h3 className="font-bold uppercase text-xs tracking-widest text-slate-800">Indústrias</h3>
            </div>
            <button 
              disabled={isSaving}
              onClick={() => setShowIndustryModal(true)} 
              className="p-2.5 bg-blue-600 text-white hover:bg-blue-700 rounded-xl transition-all shadow-md shadow-blue-600/20 active:scale-95 disabled:opacity-50"
            >
              <Plus size={20} />
            </button>
          </div>
          <div className="flex-1 p-6 space-y-3 overflow-y-auto">
            {industries.map(i => (
              <div key={i.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl group hover:bg-white hover:shadow-md border border-transparent hover:border-slate-100 transition-all">
                <span className="font-bold text-slate-800">{i.name}</span>
                <button 
                  disabled={isSaving}
                  onClick={(e) => removeItem('industry', i.id, e)} 
                  className="p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all bg-white rounded-lg shadow-sm border border-slate-100"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modais de Inserção */}
      
      {/* Modal Módulo */}
      {showModuleModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
           <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in duration-300">
              <div className="bg-blue-600 p-8 flex items-center justify-between text-white">
                <div className="flex items-center gap-3">
                  <Package size={24} />
                  <h3 className="text-xl font-bold tracking-tight">Novo Módulo SAP</h3>
                </div>
                <button onClick={() => setShowModuleModal(false)} className="text-white/60 hover:text-white transition-colors"><X size={24} /></button>
              </div>
              <form onSubmit={handleAddModule} className="p-8 space-y-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">NOME DO MÓDULO</label>
                  <input required name="name" placeholder="Ex: EWM" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-medium" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">CATEGORIA</label>
                  <select name="category" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold">
                    <option value="TECHNICAL">TECHNICAL</option>
                    <option value="FUNCTIONAL">FUNCTIONAL</option>
                    <option value="MANAGEMENT">MANAGEMENT</option>
                  </select>
                </div>
                <button type="submit" disabled={isSaving} className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl flex items-center justify-center gap-3 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50">
                  {isSaving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                  Salvar Módulo
                </button>
              </form>
           </div>
        </div>
      )}

      {/* Modal Indústria */}
      {showIndustryModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
           <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in duration-300">
              <div className="bg-amber-600 p-8 flex items-center justify-between text-white">
                <div className="flex items-center gap-3">
                  <Factory size={24} />
                  <h3 className="text-xl font-bold tracking-tight">Nova Indústria</h3>
                </div>
                <button onClick={() => setShowIndustryModal(false)} className="text-white/60 hover:text-white transition-colors"><X size={24} /></button>
              </div>
              <form onSubmit={handleAddIndustry} className="p-8 space-y-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">NOME DA INDÚSTRIA</label>
                  <input required name="name" placeholder="Ex: Automotiva" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-amber-500 font-medium" />
                </div>
                <button type="submit" disabled={isSaving} className="w-full py-4 bg-amber-600 text-white font-black rounded-2xl shadow-xl flex items-center justify-center gap-3 hover:bg-amber-700 transition-all active:scale-95 disabled:opacity-50">
                  {isSaving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                  Salvar Indústria
                </button>
              </form>
           </div>
        </div>
      )}

      {/* Modal Funcionalidade */}
      {showFeatureModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
           <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in duration-300">
              <div className="bg-emerald-600 p-8 flex items-center justify-between text-white">
                <div className="flex items-center gap-3">
                  <Key size={24} />
                  <h3 className="text-xl font-bold tracking-tight">Nova Funcionalidade</h3>
                </div>
                <button onClick={() => setShowFeatureModal(false)} className="text-white/60 hover:text-white transition-colors"><X size={24} /></button>
              </div>
              <form onSubmit={handleAddFeature} className="p-8 space-y-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">NOME EXIBIDO</label>
                  <input required name="nome" placeholder="Ex: Gestão de Banco" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 font-medium" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">SLUG (CÓDIGO)</label>
                  <input required name="slug" placeholder="Ex: bank_management" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-sm" />
                </div>
                <button type="submit" disabled={isSaving} className="w-full py-4 bg-emerald-600 text-white font-black rounded-2xl shadow-xl flex items-center justify-center gap-3 hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50">
                  {isSaving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                  Salvar Funcionalidade
                </button>
              </form>
           </div>
        </div>
      )}

      {/* Modal Perfil de Acesso */}
      {showProfileModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
           <div className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in duration-300 flex flex-col max-h-[90vh]">
              <div className="bg-indigo-600 p-8 flex items-center justify-between text-white shrink-0">
                <div className="flex items-center gap-3">
                  <ShieldCheck size={24} />
                  <h3 className="text-xl font-bold tracking-tight">{editingProfile ? 'Editar Perfil' : 'Novo Perfil de Acesso'}</h3>
                </div>
                <button onClick={() => setShowProfileModal(false)} className="text-white/60 hover:text-white transition-colors"><X size={24} /></button>
              </div>
              <form onSubmit={handleSaveProfile} className="p-8 space-y-6 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">NOME DO PERFIL</label>
                    <input required name="nome" defaultValue={editingProfile?.nome} placeholder="Ex: RH Avançado" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">DESCRIÇÃO BREVE</label>
                    <input name="descricao" defaultValue={editingProfile?.descricao} placeholder="O que este perfil pode fazer?" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium" />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Funcionalidades Permitidas</h4>
                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{selectedFeatures.length} selecionadas</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {features.map(f => {
                      const isSelected = selectedFeatures.includes(f.id);
                      return (
                        <button 
                          key={f.id}
                          type="button"
                          onClick={() => toggleFeature(f.id)}
                          className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all text-left ${
                            isSelected ? 'bg-indigo-50 border-indigo-400 shadow-sm' : 'bg-slate-50 border-transparent hover:border-slate-100'
                          }`}
                        >
                          <div>
                            <div className={`font-bold text-xs ${isSelected ? 'text-indigo-900' : 'text-slate-600'}`}>{f.nome}</div>
                            <code className="text-[9px] font-black text-slate-400 uppercase opacity-60">{f.slug}</code>
                          </div>
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center border-2 ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'}`}>
                            {isSelected && <Check size={12} className="text-white" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button type="submit" disabled={isSaving} className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50">
                  {isSaving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                  {editingProfile ? 'Atualizar Perfil' : 'Criar Perfil'}
                </button>
              </form>
           </div>
        </div>
      )}
      
      {isLoading && (
        <div className="fixed inset-0 z-[300] bg-slate-900/10 backdrop-blur-[2px] flex items-center justify-center">
          <div className="bg-white p-6 rounded-3xl shadow-2xl flex items-center gap-4 border border-slate-100 animate-in zoom-in duration-300">
            <Loader2 className="animate-spin text-blue-600" size={32} />
            <p className="text-sm font-black text-slate-700 uppercase tracking-widest">Aguarde...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsView;
