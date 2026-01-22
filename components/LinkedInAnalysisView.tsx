
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Linkedin, 
  Search, 
  Plus, 
  BrainCircuit, 
  Trash2, 
  Eye, 
  Sparkles, 
  Loader2, 
  X, 
  ExternalLink,
  Info,
  Zap,
  CheckCircle2,
  ChevronRight,
  Target,
  Users,
  Clock,
  ShieldCheck
} from 'lucide-react';
import { db } from '../services/dbService';
import { analyzeLinkedInProfile } from '../services/geminiService';
import { LinkedInAnalysis } from '../types';

interface LinkedInAnalysisViewProps {
  onViewDetail: (id: string) => void;
}

const LinkedInAnalysisView: React.FC<LinkedInAnalysisViewProps> = ({ onViewDetail }) => {
  const [analyses, setAnalyses] = useState<LinkedInAnalysis[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const loadAnalyses = async () => {
    setIsLoading(true);
    try {
      const data = await db.getLinkedInAnalyses();
      setAnalyses(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAnalyses();
  }, []);

  const handleAnalyze = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const url = formData.get('profileUrl') as string;

    if (!url) return;

    setIsAnalyzing(true);
    setStatusMessage("A IA está navegando e interpretando o perfil...");
    try {
      const result = await analyzeLinkedInProfile(url);
      await db.saveLinkedInAnalysis(result);
      await loadAnalyses();
      setShowModal(false);
      onViewDetail(result.id);
    } catch (err: any) {
      alert("Erro na análise: " + err.message);
    } finally {
      setIsAnalyzing(false);
      setStatusMessage(null);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Excluir esta análise permanentemente?")) {
      await db.client.from('linkedin_analyses').delete().eq('id', id);
      loadAnalyses();
    }
  };

  const filteredAnalyses = useMemo(() => {
    return analyses.filter(a => 
      a.profileLink.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.executiveSummary.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [analyses, searchTerm]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Análise DISC & LinkedIn</h2>
          <p className="text-slate-500 font-medium">Mapeamento comportamental e técnico via IA</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="px-6 py-3 bg-indigo-600 text-white font-black rounded-2xl flex items-center gap-2 shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95"
        >
          <Plus size={20} /> Nova Análise IA
        </button>
      </div>

      {/* CARDS EXPLICATIVOS DO MÉTODO DISC */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-[32px] border border-red-100 shadow-sm border-l-4 border-l-red-500 hover:shadow-md transition-all">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-red-50 text-red-600 rounded-lg flex items-center justify-center font-black">D</div>
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Dominância</h4>
          </div>
          <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
            Foco em <strong>resultados</strong>, assertividade e desafios. Perfil decidio, competitivo e direto.
          </p>
        </div>

        <div className="bg-white p-6 rounded-[32px] border border-amber-100 shadow-sm border-l-4 border-l-amber-500 hover:shadow-md transition-all">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center font-black">I</div>
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Influência</h4>
          </div>
          <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
            Foco em <strong>pessoas</strong>, entusiasmo e comunicação. Persuasivo, otimista e sociável.
          </p>
        </div>

        <div className="bg-white p-6 rounded-[32px] border border-green-100 shadow-sm border-l-4 border-l-green-500 hover:shadow-md transition-all">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-green-50 text-green-600 rounded-lg flex items-center justify-center font-black">S</div>
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Estabilidade</h4>
          </div>
          <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
            Foco em <strong>colaboração</strong>, paciência e lealdade. Bom ouvinte, metódico e confiável.
          </p>
        </div>

        <div className="bg-white p-6 rounded-[32px] border border-blue-100 shadow-sm border-l-4 border-l-blue-500 hover:shadow-md transition-all">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center font-black">C</div>
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Conformidade</h4>
          </div>
          <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
            Foco em <strong>processos</strong>, precisão e lógica. Detalhista, disciplinado e analítico.
          </p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-[24px] border border-slate-100 shadow-sm flex items-center gap-4">
        <div className="p-2 text-slate-400"><Search size={20} /></div>
        <input 
          type="text" 
          placeholder="Buscar por nome ou link do perfil..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 bg-transparent border-none outline-none font-medium text-slate-600"
        />
      </div>

      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-4">
          <Loader2 className="animate-spin text-indigo-600" size={40} />
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Sincronizando Perfis...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAnalyses.length > 0 ? filteredAnalyses.map((analysis) => (
            <div 
              key={analysis.id} 
              onClick={() => onViewDetail(analysis.id)}
              className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl transition-all cursor-pointer group relative border-b-4 border-b-indigo-500"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  <Linkedin size={28} />
                </div>
                <button 
                  onClick={(e) => handleDelete(analysis.id, e)}
                  className="p-2 text-slate-200 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={20} />
                </button>
              </div>

              <div className="space-y-2 mb-6">
                <h3 className="font-black text-slate-900 text-lg line-clamp-1">{analysis.profileLink.replace('https://www.linkedin.com/in/', '').replace('/', '')}</h3>
                <div className="flex gap-2">
                  <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[8px] font-black rounded uppercase border border-indigo-100">
                    {analysis.disc.predominant}
                  </span>
                  <span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-[8px] font-black rounded uppercase border border-amber-100">
                    {analysis.suggestedLevel}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-500 font-medium leading-relaxed italic line-clamp-3 mb-6">
                "{analysis.executiveSummary}"
              </p>

              <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                <span className="text-[9px] font-black text-slate-300 uppercase">{new Date(analysis.analyzedAt).toLocaleDateString()}</span>
                <div className="flex items-center gap-1 text-indigo-600 font-black text-[10px] uppercase tracking-widest group-hover:gap-2 transition-all">
                  Ver DISC <ChevronRight size={14} />
                </div>
              </div>
            </div>
          )) : (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-400 bg-white rounded-[40px] border-2 border-dashed border-slate-100">
               <BrainCircuit size={48} className="mb-4 opacity-20" />
               <p className="font-bold italic">Nenhuma análise encontrada.</p>
               <button onClick={() => setShowModal(true)} className="mt-4 text-indigo-600 font-black text-xs uppercase tracking-widest hover:underline">Começar Primeira Análise</button>
            </div>
          )}
        </div>
      )}

      {/* MODAL NOVA ANÁLISE */}
      {showModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden border border-slate-200">
            <div className="bg-indigo-600 p-8 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <Sparkles className="text-indigo-200" size={24} />
                <h3 className="text-xl font-bold tracking-tight">Nova Análise LinkedIn</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-indigo-200 hover:text-white transition-colors"><X size={24} /></button>
            </div>
            <form onSubmit={handleAnalyze} className="p-8 space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">URL DO PERFIL LINKEDIN</label>
                <div className="relative">
                  <Linkedin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input 
                    required 
                    name="profileUrl" 
                    placeholder="https://linkedin.com/in/usuario" 
                    className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium" 
                  />
                </div>
              </div>

              <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex gap-3">
                <Zap className="text-indigo-600 shrink-0" size={18} />
                <p className="text-[10px] text-indigo-700 font-medium leading-relaxed">
                  Nossa IA processará o histórico, posts e fotos públicas para gerar um perfil DISC completo e sugerir o melhor fit para o ecossistema SAP.
                </p>
              </div>

              <button 
                disabled={isAnalyzing} 
                type="submit" 
                className="w-full py-5 bg-indigo-600 text-white font-black rounded-2xl shadow-xl flex items-center justify-center gap-3 hover:bg-indigo-700 disabled:opacity-50 transition-all active:scale-95"
              >
                {isAnalyzing ? <Loader2 className="animate-spin" /> : <BrainCircuit size={20} />}
                {isAnalyzing ? "Processando Perfil..." : "Iniciar Análise via IA"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* STATUS OVERLAY */}
      {isAnalyzing && (
        <div className="fixed inset-0 z-[300] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-8">
           <div className="bg-white px-10 py-8 rounded-[32px] shadow-2xl flex flex-col items-center gap-4 text-center max-w-sm border border-slate-200 animate-in zoom-in duration-300">
              <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl">
                <Loader2 size={40} className="animate-spin" />
              </div>
              <div>
                <h4 className="text-lg font-black text-slate-900">Análise em Andamento</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Conectando aos modelos Gemini 3 Flash</p>
              </div>
              <p className="text-xs font-medium text-slate-500 italic">"{statusMessage}"</p>
           </div>
        </div>
      )}
    </div>
  );
};

export default LinkedInAnalysisView;
