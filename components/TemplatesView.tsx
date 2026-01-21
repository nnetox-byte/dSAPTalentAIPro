
import React, { useState, useEffect } from 'react';
import { FileText, Eye, Trash2, Calendar, X, Layers, Cloud, CheckCircle, Info, BrainCircuit, RefreshCw, DatabaseBackup, Sparkles } from 'lucide-react';
import { db } from '../services/dbService';
import { AssessmentTemplate, Question } from '../types';

const TemplatesView: React.FC = () => {
  const [templates, setTemplates] = useState<AssessmentTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<AssessmentTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [localDataFound, setLocalDataFound] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const tmpls = await db.getTemplates();
      setTemplates(tmpls);
      
      const local = localStorage.getItem('sap_eval_templates');
      if (local && tmpls.length === 0) {
        setLocalDataFound(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleMigrate = async () => {
    const local = localStorage.getItem('sap_eval_templates');
    if (!local) return;
    
    setIsLoading(true);
    try {
      const parsed = JSON.parse(local) as AssessmentTemplate[];
      for (const t of parsed) {
        await db.saveTemplate(t);
      }
      localStorage.removeItem('sap_eval_templates');
      setLocalDataFound(false);
      await loadData();
      alert('Dados migrados com sucesso para o Supabase!');
    } catch (e) {
      alert('Erro na migração.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Excluir este modelo de teste permanentemente?')) {
      try {
        await db.deleteTemplate(id);
        await loadData();
      } catch (err) {
        setTemplates(prev => prev.filter(t => t.id !== id));
      }
    }
  };

  const openDetails = (tmpl: AssessmentTemplate) => {
    setSelectedTemplate(tmpl);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Modelos de Testes</h2>
          <p className="text-slate-500 font-medium">Snapshots de provas aplicadas ou pacotes fixos</p>
        </div>
        <button onClick={loadData} className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-blue-600 shadow-sm transition-all">
          <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      {localDataFound && (
        <div className="p-6 bg-indigo-600 rounded-[32px] text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-indigo-600/20 animate-in slide-in-from-top-4">
          <div className="flex items-center gap-4 text-center md:text-left">
            <div className="p-4 bg-white/20 rounded-2xl">
              <DatabaseBackup size={32} />
            </div>
            <div>
              <h4 className="text-lg font-bold">Migração de Dados Disponível</h4>
              <p className="text-indigo-100 text-sm">Detectamos modelos de testes antigos salvos localmente. Deseja sincronizá-los com o Supabase agora?</p>
            </div>
          </div>
          <button onClick={handleMigrate} className="px-8 py-4 bg-white text-indigo-600 font-black rounded-2xl shadow-lg hover:bg-indigo-50 transition-all shrink-0 active:scale-95">
            Sincronizar Modelos
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-4">
          <RefreshCw className="animate-spin text-blue-500" size={40} />
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Consultando Supabase...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.length === 0 ? (
            <div className="col-span-full bg-white rounded-[40px] p-24 text-center border-2 border-dashed border-slate-100">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <FileText size={40} className="text-slate-200" />
              </div>
              <p className="text-slate-400 font-bold italic mb-2">Nenhum modelo disponível no banco de dados.</p>
              <p className="text-xs text-slate-300 font-medium">Os modelos são gerados ao criar novos testes para candidatos.</p>
            </div>
          ) : (
            templates.map((tmpl) => {
              const isPackAI = tmpl.name.startsWith('Pack AI:');
              return (
                <div key={tmpl.id} className={`bg-white rounded-[32px] p-8 border ${isPackAI ? 'border-blue-100' : 'border-slate-100'} shadow-sm hover:shadow-xl transition-all group relative border-b-4 ${isPackAI ? 'border-b-blue-500 hover:border-b-blue-600' : 'hover:border-b-blue-500'}`}>
                  <div className="flex items-center justify-between mb-6">
                    <div className={`w-14 h-14 ${isPackAI ? 'bg-blue-600 text-white shadow-blue-200' : 'bg-blue-50 text-blue-600'} rounded-2xl flex items-center justify-center shadow-sm border ${isPackAI ? 'border-blue-700' : 'border-blue-100'}`}>
                      {isPackAI ? <Sparkles size={28} /> : <FileText size={28} />}
                    </div>
                    <div className="flex gap-2">
                      {isPackAI && <span className="px-2 py-1 bg-blue-50 text-blue-600 text-[8px] font-black rounded uppercase border border-blue-100">PACK IA</span>}
                      <button onClick={(e) => handleDelete(tmpl.id, e)} className="p-2 text-slate-200 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                  
                  <h3 className="font-black text-slate-900 text-lg mb-2 leading-tight">{tmpl.name}</h3>
                  
                  <div className="flex flex-wrap gap-2 mb-6">
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-500 text-[9px] font-black rounded-lg uppercase tracking-widest">{tmpl.moduleId}</span>
                    <span className="px-2.5 py-1 bg-amber-50 text-amber-600 text-[9px] font-black rounded-lg uppercase tracking-widest border border-amber-100">{tmpl.level}</span>
                  </div>

                  <div className="space-y-3 mb-8">
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                      <Calendar size={14} /> {new Date(tmpl.createdAt).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                      <Layers size={14} /> {tmpl.questions?.length || 0} Questões
                    </div>
                    {tmpl.scenarios && tmpl.scenarios.length > 0 && (
                      <div className="flex items-center gap-2 text-[10px] text-indigo-400 font-black uppercase tracking-widest">
                        <BrainCircuit size={14} /> Case Prático Incluído
                      </div>
                    )}
                  </div>

                  <button 
                    onClick={() => openDetails(tmpl)}
                    className={`w-full py-4 ${isPackAI ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-900 hover:bg-slate-800'} text-white font-black rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95`}
                  >
                    <Eye size={18} /> Visualizar Estrutura
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Modal de Detalhes do Modelo */}
      {selectedTemplate && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
          <div className="bg-slate-50 w-full max-w-5xl max-h-[92vh] rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in duration-300 flex flex-col border border-slate-200">
            {/* Header */}
            <div className="bg-slate-900 p-8 md:p-10 flex items-center justify-between text-white shrink-0 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-12 opacity-5">
                <FileText size={180} />
              </div>
              <div className="flex items-center gap-6 relative z-10">
                <div className="p-4 bg-blue-600 rounded-3xl shadow-xl shadow-blue-600/20">
                  <FileText size={32} />
                </div>
                <div>
                  <h3 className="text-2xl font-black tracking-tight">{selectedTemplate.name}</h3>
                  <div className="flex gap-3 mt-2">
                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">{selectedTemplate.moduleId}</span>
                    <span className="text-slate-700">|</span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{selectedTemplate.level}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedTemplate(null)} className="text-slate-400 hover:text-white transition-colors bg-white/5 p-3 rounded-2xl active:scale-90">
                <X size={28} />
              </button>
            </div>

            {/* Questions List */}
            <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 bg-white/50">
              {selectedTemplate.questions && selectedTemplate.questions.length > 0 ? (
                selectedTemplate.questions.map((q, idx) => (
                  <div key={q.id || idx} className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm relative group hover:border-blue-200 transition-all">
                    <div className="flex flex-wrap items-center gap-3 mb-6">
                      <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black rounded-full uppercase tracking-widest border border-blue-100 flex items-center gap-2">
                        <Layers size={14} /> {q.block}
                      </span>
                    </div>
                    <h5 className="text-xl font-bold text-slate-800 mb-8 leading-snug">
                      <span className="text-slate-200 mr-3 text-2xl font-black">#{idx + 1}</span> 
                      {q.text}
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {q.options.map((opt, i) => (
                        <div key={i} className={`p-5 rounded-2xl flex items-center gap-4 border-2 transition-all ${i === q.correctAnswerIndex ? 'bg-green-50 border-green-500 shadow-lg' : 'bg-slate-50 border-transparent opacity-80'}`}>
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${i === q.correctAnswerIndex ? 'bg-green-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
                            {String.fromCharCode(65 + i)}
                          </div>
                          <span className={`text-sm md:text-base font-bold ${i === q.correctAnswerIndex ? 'text-green-900' : 'text-slate-600'}`}>{opt}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-20 text-center text-slate-300 italic">Estrutura de questões não encontrada.</div>
              )}
            </div>

            {/* Footer */}
            <div className="p-8 bg-white border-t border-slate-100 flex justify-center shrink-0">
               <button onClick={() => setSelectedTemplate(null)} className="px-12 py-5 bg-slate-900 text-white font-black rounded-[24px] hover:bg-slate-800 transition-all shadow-xl">Fechar Visualização</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplatesView;
