
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

  if (!candidate || !result) return null;

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-bold uppercase text-[9px] md:text-[10px] tracking-widest bg-white px-3 py-2 md:px-4 md:py-2 rounded-xl shadow-sm border border-slate-100"
        >
          <ArrowLeft size={16} /> Voltar
        </button>

        <div className={`flex items-center gap-2 px-5 py-2 rounded-2xl border-2 font-black text-[10px] md:text-xs uppercase tracking-widest shadow-md ${
          approvalData.approved ? 'bg-green-50 border-green-200 text-green-600' : 'bg-red-50 border-red-200 text-red-600'
        }`}>
          {approvalData.approved ? <CheckCircle size={16} /> : <XCircle size={16} />}
          {approvalData.approved ? 'Aprovado' : 'Não Recomendado'}
        </div>
      </div>

      <div className="bg-white rounded-[32px] md:rounded-[40px] p-6 md:p-10 border border-slate-100 shadow-xl flex flex-col md:flex-row gap-6 md:gap-10 items-center text-center md:text-left">
        <div className="w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-[24px] md:rounded-[32px] flex items-center justify-center text-4xl md:text-5xl font-black shadow-lg shrink-0">
          {candidate.name.charAt(0)}
        </div>
        <div className="flex-1 space-y-3 md:space-y-4">
          <h2 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tight">{candidate.name}</h2>
          <div className="flex flex-wrap justify-center md:justify-start gap-3 md:gap-4 text-slate-500 font-bold text-[11px] md:text-sm">
            <span className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 whitespace-nowrap"><Mail size={14} className="text-blue-500" /> {candidate.email}</span>
            <span className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100"><Briefcase size={14} className="text-blue-500" /> {candidate.appliedModule}</span>
          </div>
        </div>
        <div className="bg-slate-900 p-6 md:p-8 rounded-[24px] md:rounded-[32px] text-center min-w-[160px] md:min-w-[200px] shadow-xl">
          <div className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pontuação Final</div>
          <div className={`text-4xl md:text-6xl font-black tracking-tighter ${approvalData.approved ? 'text-blue-400' : 'text-red-400'}`}>
            {result.score.toFixed(1)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        <div className="bg-white p-6 md:p-10 rounded-[32px] md:rounded-[40px] border border-slate-100 shadow-sm flex flex-col">
          <h3 className="text-lg md:text-xl font-bold text-slate-800 flex items-center gap-3 mb-6">
            <Cpu size={24} className="text-blue-500" /> Competências
          </h3>
          <div className="h-[250px] md:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={chartData}>
                <PolarGrid stroke="#f1f5f9" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 9, fontWeight: 800 }} />
                <PolarRadiusAxis angle={30} domain={[0, 10]} stroke="#e2e8f0" />
                <Radar name="Performance" dataKey="score" stroke={approvalData.approved ? "#3b82f6" : "#ef4444"} fill={approvalData.approved ? "#3b82f6" : "#ef4444"} fillOpacity={0.5} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-6 grid grid-cols-2 gap-3">
            {chartData.map(item => (
              <div key={item.subject} className="p-3 md:p-4 bg-slate-50 rounded-[20px] md:rounded-[24px] border border-slate-100 flex flex-col items-center">
                <span className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest text-center mb-1">{item.subject}</span>
                <span className={`text-lg md:text-xl font-black ${item.score >= 7 ? 'text-green-600' : item.score >= 4 ? 'text-amber-600' : 'text-red-600'}`}>
                  {item.score.toFixed(1)}
                  <span className="text-slate-300 text-[10px] ml-1 font-bold">/10</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900 p-6 md:p-10 rounded-[32px] md:rounded-[40px] shadow-2xl text-white flex flex-col">
          <h3 className="text-lg md:text-xl font-bold flex items-center gap-3 mb-6 md:mb-8">
            <Sparkles size={24} className="text-blue-400" /> Análise IA
          </h3>
          <div className="flex-1">
            {loadingAI ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <RefreshCw size={40} className="animate-spin text-blue-400" />
                <p className="font-black text-[10px] uppercase tracking-widest animate-pulse">Analisando...</p>
              </div>
            ) : (
              <p className="text-slate-300 text-base md:text-lg leading-relaxed font-medium italic">"{recommendation}"</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateReportView;
