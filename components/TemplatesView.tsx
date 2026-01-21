
import React, { useState, useEffect } from 'react';
import { FileText, Eye, Trash2, Calendar, X, Layers, Cloud, CheckCircle, Info } from 'lucide-react';
import { db } from '../services/dbService';
import { AssessmentTemplate, Question } from '../types';

const TemplatesView: React.FC = () => {
  // Use an empty array for initial state and load data in useEffect
  const [templates, setTemplates] = useState<AssessmentTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<AssessmentTemplate | null>(null);

  // Added useEffect to load templates asynchronously
  useEffect(() => {
    const loadData = async () => {
      const tmpls = await db.getTemplates();
      setTemplates(tmpls);
    };
    loadData();
  }, []);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Excluir este modelo de avaliação permanentemente?')) {
      const updated = templates.filter(t => t.id !== id);
      setTemplates(updated);
      localStorage.setItem('sap_eval_templates', JSON.stringify(updated));
    }
  };

  const openDetails = (tmpl: AssessmentTemplate) => {
    setSelectedTemplate(tmpl);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-bold text-slate-900">Modelos de Avaliação</h2>
        <p className="text-slate-500">Histórico de provas geradas dinamicamente ou pacotes fixos</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.length === 0 ? (
          <div className="col-span-full bg-white rounded-3xl p-12 text-center border-2 border-dashed border-slate-200">
            <FileText size={48} className="mx-auto text-slate-200 mb-4" />
            <p className="text-slate-400 font-medium">Nenhum modelo gerado ainda.</p>
          </div>
        ) : (
          templates.map((tmpl) => (
            <div key={tmpl.id} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                  <FileText size={24} />
                </div>
                <button onClick={(e) => handleDelete(tmpl.id, e)} className="p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                  <Trash2 size={20} />
                </button>
              </div>
              
              <h3 className="font-bold text-slate-800 text-lg mb-1 truncate">{tmpl.name}</h3>
              <div className="flex gap-2 mb-4">
                <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-black rounded uppercase tracking-tighter">{tmpl.moduleId}</span>
                <span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-[10px] font-black rounded uppercase tracking-tighter border border-amber-100">{tmpl.level}</span>
                <span className="px-2 py-0.5 bg-green-50 text-green-600 text-[10px] font-black rounded uppercase tracking-tighter border border-green-100">{tmpl.implementationType}</span>
              </div>

              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                  <Calendar size={14} className="text-slate-400" />
                  <span>Gerado em: {new Date(tmpl.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                  <FileText size={14} className="text-slate-400" />
                  <span>{tmpl.questions.length} Questões Analisadas</span>
                </div>
              </div>

              <button 
                onClick={() => openDetails(tmpl)}
                className="w-full py-4 bg-slate-50 text-slate-700 font-bold rounded-2xl hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <Eye size={18} />
                Visualizar Detalhes
              </button>
            </div>
          ))
        )}
      </div>

      {/* Modal de Detalhes do Modelo */}
      {selectedTemplate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
          <div className="bg-slate-50 w-full max-w-4xl max-h-[90vh] rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in duration-200 flex flex-col">
            {/* Header */}
            <div className="bg-[#0f172a] p-8 flex items-center justify-between text-white shrink-0">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/20 text-blue-400 rounded-2xl border border-blue-500/30">
                  <FileText size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold">{selectedTemplate.name}</h3>
                  <div className="flex gap-2 mt-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{selectedTemplate.moduleId}</span>
                    <span className="text-slate-600">•</span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{selectedTemplate.level}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedTemplate(null)} className="text-slate-500 hover:text-white transition-colors bg-white/5 p-2 rounded-xl">
                <X size={24} />
              </button>
            </div>

            {/* Content List */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Estrutura de Questões ({selectedTemplate.questions.length})</h4>
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-white border border-slate-200 text-slate-500 text-[10px] font-bold rounded-full">80% Banco</span>
                  <span className="px-3 py-1 bg-white border border-slate-200 text-slate-500 text-[10px] font-bold rounded-full">20% IA Dinâmica</span>
                </div>
              </div>

              {selectedTemplate.questions.map((q, idx) => (
                <div key={q.id} className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm relative group hover:border-blue-200 transition-colors">
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[9px] font-black rounded-full uppercase tracking-tighter flex items-center gap-1 border border-blue-100">
                      <Layers size={10} /> {q.block}
                    </span>
                    <span className="px-2 py-0.5 bg-green-50 text-green-600 text-[9px] font-black rounded-full uppercase tracking-tighter flex items-center gap-1 border border-green-100">
                      <Cloud size={10} /> Peso: {q.weight || 1}
                    </span>
                  </div>
                  
                  <h5 className="text-slate-800 font-bold mb-5 leading-relaxed">
                    <span className="text-slate-300 mr-2">{idx + 1}.</span> {q.text}
                  </h5>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {q.options.map((opt, i) => (
                      <div 
                        key={i} 
                        className={`text-xs p-4 rounded-xl flex items-center gap-3 border transition-all ${
                          i === q.correctAnswerIndex 
                            ? 'bg-green-50 text-green-700 font-bold border-green-200 shadow-sm ring-1 ring-green-100' 
                            : 'bg-slate-50 text-slate-500 border-transparent opacity-60'
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] shrink-0 font-black ${
                          i === q.correctAnswerIndex ? 'bg-green-600 text-white shadow-lg' : 'bg-slate-200 text-slate-400'
                        }`}>
                          {String.fromCharCode(65 + i)}
                        </div>
                        {opt}
                        {i === q.correctAnswerIndex && <CheckCircle size={14} className="ml-auto text-green-600" />}
                      </div>
                    ))}
                  </div>

                  {q.explanation && (
                    <div className="mt-5 p-4 bg-blue-50/50 rounded-2xl border border-blue-100 flex gap-3 items-start">
                      <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg">
                         <Info size={14} />
                      </div>
                      <p className="text-[11px] text-blue-800 font-medium leading-relaxed">
                        <span className="font-black uppercase tracking-widest mr-2">Justificativa:</span>
                        {q.explanation}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Footer Action */}
            <div className="p-8 bg-white border-t border-slate-100 flex justify-between items-center shrink-0">
               <div className="text-xs text-slate-400 font-medium">
                  Este modelo serve como base fixa ou snapshot para futuras auditorias.
               </div>
               <button 
                onClick={() => setSelectedTemplate(null)}
                className="px-8 py-3 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all active:scale-95"
               >
                 Fechar Detalhes
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplatesView;
