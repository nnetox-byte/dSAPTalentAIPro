import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  ResponsiveContainer, Tooltip 
} from 'recharts';
import { Candidate, AssessmentResult, BlockType, SeniorityLevel } from '../types';
import { db } from '../services/dbService';
import { generateCandidateRecommendation } from '../services/geminiService';
import { ArrowLeft, Mail, Briefcase, Award, Sparkles, RefreshCw, FileText, CheckCircle, ShieldCheck, Cpu, XCircle, AlertTriangle, Layers } from 'lucide-react';
import React, { useState, useEffect, useMemo } from 'react';

interface CandidateReportViewProps {
  candidateId: string;
  onBack: () => void;
}

const CandidateReportView: React.FC<CandidateReportViewProps> = ({ candidateId, onBack }) => {
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [recommendation, setRecommendation] = useState<string>('');
  const [loadingAI, setLoadingAI] = useState<boolean>(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [cands, res] = await Promise.all([db.getCandidates(), db.getResults()]);
        setCandidate(cands.find(c => c.id === candidateId) || null);
        setResult(res.find(r => r.candidateId === candidateId) || null);
      } catch (e) {
        console.error("Erro ao carregar relatório:", e);
      }
    };
    loadData();
  }, [candidateId]);

  useEffect(() => {
    if (candidate && result) {
      setLoadingAI(true);
      generateCandidateRecommendation(candidate, result)
        .then(setRecommendation)
        .finally(() => setLoadingAI(false));
    }
  }, [candidate, result]);

  const approvalData = useMemo(() => {
    if (!candidate || !result) return { approved: false, threshold: 0 };
    const thresholds = {
      [SeniorityLevel.JUNIOR]: 25.0,
      [SeniorityLevel.PLENO]: 35.0,
      [SeniorityLevel.SENIOR]: 42.5
    };
    const threshold = thresholds[candidate.appliedLevel] || 35.0;
    return { approved: result.score >= threshold, threshold };
  }, [candidate, result]);

  const chartData = useMemo(() => {
    if (!result) return [];
    return Object.values(BlockType).map(block => ({
      subject: block,
      score: Number((result.blockScores?.[block] || 0).toFixed(1)),
      fullMark: 10
    }));
  }, [result]);

  if (!candidate || !result) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400">
        <p>Dados não encontrados.</p>
        <button onClick={onBack} className="mt-4 text-blue-600 hover:underline">Voltar</button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex items-center justify-between">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-bold uppercase text-[10px] tracking-widest bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100"
        >
          <ArrowLeft size={16} /> Voltar para Lista
        </button>

        <div className={`flex items-center gap-2 px-6 py-2 rounded-2xl border-2 font-black text-xs uppercase tracking-widest shadow-lg ${
          approvalData.approved ? 'bg-green-50 border-green-200 text-green-600' : 'bg-red-50 border-red-200 text-red-600'
        }`}>
          {approvalData.approved ? <CheckCircle size={18} /> : <XCircle size={18} />}
          {approvalData.approved ? 'Aprovado' : 'Não Recomendado'}
        </div>
      </div>

      <div className="bg-white rounded-[40px] p-8 md:p-12 border border-slate-100 shadow-xl flex flex-col md:flex-row gap-10 items-start md:items-center relative overflow-hidden">
        <div className="w-32 h-32 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-[32px] flex items-center justify-center text-5xl font-black shadow-2xl z-10 shrink-0">
          {candidate.name.charAt(0)}
        </div>
        <div className="flex-1 space-y-4 z-10">
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">{candidate.name}</h2>
          <div className="flex flex-wrap gap-4 text-slate-500 font-bold text-sm">
            <span className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100"><Mail size={16} className="text-blue-500" /> {candidate.email}</span>
            <span className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100"><Briefcase size={16} className="text-blue-500" /> {candidate.appliedModule}</span>
            <span className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100"><Award size={16} className="text-amber-500" /> {candidate.appliedLevel}</span>
          </div>
        </div>
        <div className="bg-slate-900 p-8 rounded-[32px] text-center min-w-[200px] shadow-2xl z-10">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Pontuação Final</div>
          <div className={`text-6xl font-black tracking-tighter ${approvalData.approved ? 'text-blue-400' : 'text-red-400'}`}>
            {result.score.toFixed(1)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm flex flex-col min-h-[600px]">
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-3 mb-6">
            <Cpu size={24} className="text-blue-500" /> Equilíbrio de Competências
          </h3>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={chartData}>
                <PolarGrid stroke="#f1f5f9" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 800 }} />
                <PolarRadiusAxis angle={30} domain={[0, 10]} stroke="#e2e8f0" />
                <Radar name="Performance" dataKey="score" stroke={approvalData.approved ? "#3b82f6" : "#ef4444"} strokeWidth={3} fill={approvalData.approved ? "#3b82f6" : "#ef4444"} fillOpacity={0.5} />
                <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontWeight: 'bold' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-8 grid grid-cols-2 md:grid-cols-3 gap-3">
            {chartData.map(item => (
              <div key={item.subject} className="p-4 bg-slate-50 rounded-[24px] border border-slate-100 flex flex-col items-center group hover:bg-white hover:shadow-md transition-all">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center mb-1">{item.subject}</span>
                <span className={`text-xl font-black ${item.score >= 7 ? 'text-green-600' : item.score >= 4 ? 'text-amber-600' : 'text-red-600'}`}>
                  {item.score.toFixed(1)}
                  <span className="text-slate-300 text-xs ml-1 font-bold">/10</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900 p-10 rounded-[40px] shadow-2xl text-white flex flex-col min-h-[600px]">
          <h3 className="text-xl font-bold flex items-center gap-3 mb-8">
            <Sparkles size={24} className="text-blue-400" /> Análise Preditiva IA
          </h3>
          <div className="flex-1 overflow-y-auto">
            {loadingAI ? (
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <RefreshCw size={48} className="animate-spin text-blue-400" />
                <p className="font-black text-xs uppercase tracking-widest animate-pulse">Processando Insight...</p>
              </div>
            ) : (
              <p className="text-slate-300 text-lg leading-relaxed font-medium italic">"{recommendation}"</p>
            )}
          </div>
          
          <div className="mt-8 pt-8 border-t border-slate-800 space-y-4">
             <div className="flex items-center gap-3">
               <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl">
                 <ShieldCheck size={18} />
               </div>
               <div>
                 <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Score de Confiança</div>
                 <div className="text-sm font-bold">Validação via Gemini 1.5 Flash</div>
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateReportView;