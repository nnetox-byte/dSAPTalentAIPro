
import React, { useState } from 'react';
import { FileText, Eye, Trash2, Calendar, User } from 'lucide-react';
import { db } from '../services/dbService';
import { AssessmentTemplate } from '../types';

const TemplatesView: React.FC = () => {
  const [templates, setTemplates] = useState<AssessmentTemplate[]>(db.getTemplates());

  const handleDelete = (id: string) => {
    if (confirm('Excluir este modelo de avaliação permanentemente?')) {
      const updated = templates.filter(t => t.id !== id);
      setTemplates(updated);
      localStorage.setItem('sap_eval_templates', JSON.stringify(updated));
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-bold text-slate-900">Modelos de Avaliação</h2>
        <p className="text-slate-500">Histórico de provas geradas dinamicamente ou fixas</p>
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
                <button onClick={() => handleDelete(tmpl.id)} className="p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                  <Trash2 size={20} />
                </button>
              </div>
              
              <h3 className="font-bold text-slate-800 text-lg mb-1 truncate">{tmpl.name}</h3>
              <div className="flex gap-2 mb-4">
                <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold rounded uppercase">{tmpl.moduleId}</span>
                <span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-[10px] font-bold rounded uppercase">{tmpl.level}</span>
              </div>

              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Calendar size={14} />
                  <span>Gerado em: {new Date(tmpl.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <FileText size={14} />
                  <span>{tmpl.questions.length} Questões</span>
                </div>
              </div>

              <button className="w-full py-3 bg-slate-50 text-slate-600 font-bold rounded-xl hover:bg-slate-100 transition-colors flex items-center justify-center gap-2">
                <Eye size={18} />
                Visualizar Detalhes
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TemplatesView;
