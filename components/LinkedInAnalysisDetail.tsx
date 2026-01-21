
import React, { useMemo, useState, useEffect } from 'react';
import { LinkedInAnalysis } from '../types';
import { db } from '../services/dbService';
import { ArrowLeft, Linkedin, BarChart3, User, Briefcase, FileText, Info, CheckCircle2, Target, Zap } from 'lucide-react';

interface LinkedInAnalysisDetailProps {
  analysisId: string;
  onBack: () => void;
}

const DISC_LABELS: Record<string, string> = {
  'D': 'Dominância (D)',
  'I': 'Influência (I)',
  'S': 'Estabilidade (S)',
  'C': 'Conformidade (C)',
  'Dominante': 'Dominância (D)',
  'Influente': 'Influência (I)',
  'Estável': 'Estabilidade (S)',
  'Conformidade': 'Conformidade (C)',
  'Dominance': 'Dominância (D)',
  'Influence': 'Influência (I)',
  'Steadiness': 'Estabilidade (S)',
  'Compliance': 'Conformidade (C)'
};

const getDiscLabel = (value: string) => {
  // Tenta mapear o valor direto ou a primeira letra se for apenas uma letra
  const normalized = value.trim();
  if (DISC_LABELS[normalized]) return DISC_LABELS[normalized];
  
  // Caso a IA mande apenas a letra
  const firstLetter = normalized.charAt(0).toUpperCase();
  return DISC_LABELS[firstLetter] || normalized;
};

const LinkedInAnalysisDetail: React.FC<LinkedInAnalysisDetailProps> = ({ analysisId, onBack }) => {
  const [analysis, setAnalysis] = useState<LinkedInAnalysis | null>(null);

  // Fixed: Load data asynchronously in useEffect
  useEffect(() => {
    const loadData = async () => {
      const analyses = await db.getLinkedInAnalyses();
      setAnalysis(analyses.find(a => a.id === analysisId) || null);
    };
    loadData();
  }, [analysisId]);

  if (!analysis) return null;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-bold uppercase text-[10px] tracking-widest bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100">
        <ArrowLeft size={16} /> Voltar para Histórico
      </button>

      <div className="bg-white rounded-[40px] p-10 border border-slate-100 shadow-xl overflow-hidden relative">
        <div className="absolute top-0 right-0 p-12 opacity-5 text-[#0077b5]">
          <Linkedin size={180} />
        </div>
        
        <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
          <div className="w-24 h-24 bg-[#0077b5] rounded-3xl flex items-center justify-center text-white text-3xl font-black shrink-0 shadow-xl shadow-blue-600/20">
            <Linkedin size={40} />
          </div>
          <div className="space-y-3">
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black rounded-full uppercase tracking-widest border border-blue-100">{analysis.suggestedModule}</span>
              <span className="px-3 py-1 bg-amber-50 text-amber-600 text-[10px] font-black rounded-full uppercase tracking-widest border border-amber-100">{analysis.suggestedLevel}</span>
            </div>
            <h2 className="text-3xl font-black text-slate-900 truncate max-w-xl">{analysis.profileLink}</h2>
            <p className="text-sm text-slate-500 font-medium italic">Análise realizada em {new Date(analysis.analyzedAt).toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* DISC Analysis Section */}
        <div className="bg-slate-900 rounded-[40px] p-10 text-white space-y-8 shadow-2xl">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold flex items-center gap-3"><BarChart3 size={24} className="text-blue-400" /> Perfil Comportamental DISC</h3>
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Estilo Predominante</span>
              <span className="text-lg font-bold text-blue-400">{getDiscLabel(analysis.disc.predominant)}</span>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 h-48 items-end border-b border-slate-800 pb-6">
            <div className="flex flex-col items-center gap-2">
              <div className="w-full bg-red-500 rounded-t-2xl transition-all shadow-lg shadow-red-500/20" style={{ height: `${analysis.disc.scores.dominance}%` }}></div>
              <div className="flex flex-col items-center">
                <span className="text-xs font-black text-red-400">D</span>
                <span className="text-[10px] font-bold text-red-500/80">{analysis.disc.scores.dominance}</span>
              </div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-full bg-amber-500 rounded-t-2xl transition-all shadow-lg shadow-amber-500/20" style={{ height: `${analysis.disc.scores.influence}%` }}></div>
              <div className="flex flex-col items-center">
                <span className="text-xs font-black text-amber-400">I</span>
                <span className="text-[10px] font-bold text-amber-500/80">{analysis.disc.scores.influence}</span>
              </div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-full bg-green-500 rounded-t-2xl transition-all shadow-lg shadow-green-500/20" style={{ height: `${analysis.disc.scores.steadiness}%` }}></div>
              <div className="flex flex-col items-center">
                <span className="text-xs font-black text-green-400">S</span>
                <span className="text-[10px] font-bold text-green-500/80">{analysis.disc.scores.steadiness}</span>
              </div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-full bg-blue-500 rounded-t-2xl transition-all shadow-lg shadow-blue-500/20" style={{ height: `${analysis.disc.scores.compliance}%` }}></div>
              <div className="flex flex-col items-center">
                <span className="text-xs font-black text-blue-400">C</span>
                <span className="text-[10px] font-bold text-blue-500/80">{analysis.disc.scores.compliance}</span>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="p-6 bg-slate-800/50 rounded-3xl border border-slate-700/50 space-y-2">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Zap size={14} className="text-blue-400" /> Descrição Profissional</h4>
              <p className="text-sm text-slate-300 leading-relaxed italic">"{analysis.disc.professionalDescription}"</p>
            </div>
            
            <div className="grid grid-cols-1 gap-4 text-xs">
              <div className="flex gap-4"><User className="text-slate-500 shrink-0" size={16} /> <span className="text-slate-400 font-bold uppercase tracking-tighter w-24">Foto:</span> <span className="text-slate-200">{analysis.disc.photoAnalysis}</span></div>
              <div className="flex gap-4"><FileText className="text-slate-500 shrink-0" size={16} /> <span className="text-slate-400 font-bold uppercase tracking-tighter w-24">Resumo:</span> <span className="text-slate-200">{analysis.disc.summaryAnalysis}</span></div>
              <div className="flex gap-4"><CheckCircle2 className="text-slate-500 shrink-0" size={16} /> <span className="text-slate-400 font-bold uppercase tracking-tighter w-24">Postagens:</span> <span className="text-slate-200">{analysis.disc.postsAnalysis}</span></div>
            </div>
          </div>
        </div>

        {/* Technical Fit Section */}
        <div className="bg-white rounded-[40px] p-10 border border-slate-100 shadow-sm space-y-8 flex flex-col">
          <div className="flex items-center gap-3 justify-between">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-3"><Briefcase size={24} className="text-blue-600" /> Fit Técnico SAP</h3>
            <div className="px-3 py-1 bg-green-50 text-green-600 text-[10px] font-black rounded-full border border-green-100">PROJEÇÃO TÉCNICA</div>
          </div>

          <div className="flex-1 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100">
                <div className="text-[9px] font-black text-slate-400 uppercase mb-1">Módulo</div>
                <div className="text-lg font-bold text-slate-800">{analysis.suggestedModule.toUpperCase()}</div>
              </div>
              <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100">
                <div className="text-[9px] font-black text-slate-400 uppercase mb-1">Senioridade</div>
                <div className="text-lg font-bold text-slate-800">{analysis.suggestedLevel}</div>
              </div>
            </div>

            <div className="p-6 bg-blue-50/50 rounded-[32px] border border-blue-100 space-y-3">
              <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2"><Target size={16} /> Resumo Executivo</h4>
              <p className="text-sm text-blue-900 font-medium leading-relaxed italic">"{analysis.executiveSummary}"</p>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Indústrias de Domínio</h4>
              <div className="flex flex-wrap gap-2">
                {analysis.industriesIdentified.map(ind => (
                  <span key={ind} className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-2xl border border-slate-200">{ind}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100">
             <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <Info size={18} className="text-blue-500" />
                <p className="text-[10px] text-slate-500 font-medium">Esta análise servirá como base para o recrutador ao criar uma nova avaliação técnica no menu de candidatos.</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LinkedInAnalysisDetail;
