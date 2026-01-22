
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  ResponsiveContainer, Tooltip 
} from 'recharts';
import { Candidate, AssessmentResult, BlockType, SeniorityLevel, AssessmentTemplate } from '../types';
import { db } from '../services/dbService';
import { generateCandidateRecommendation } from '../services/geminiService';
import { ArrowLeft, Mail, Briefcase, Award, Sparkles, RefreshCw, FileText, CheckCircle, ShieldCheck, Cpu, XCircle, AlertTriangle, Layers, MessageSquare, BrainCircuit, Loader2, Target } from 'lucide-react';
import React, { useState, useEffect, useMemo } from 'react';

interface CandidateReportViewProps {
  candidateId: string;
  onBack: () => void;
}

const CandidateReportView: React.FC<CandidateReportViewProps> = ({ candidateId, onBack }) => {
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [template, setTemplate] = useState<AssessmentTemplate | null>(null);
  const [recommendation, setRecommendation] = useState<string>('');
  const [loadingAI, setLoadingAI] = useState<boolean>(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [cands, res] = await Promise.all([db.getCandidates(), db.getResults()]);
        const currentCand = cands.find(c => c.id === candidateId) || null;
        const currentRes = res.find(r => r.candidateId === candidateId) || null;
        
        setCandidate(currentCand);
        setResult(currentRes);

        if (currentCand?.templateId) {
          const tmpl = await db.getTemplate(currentCand.templateId);
          setTemplate(tmpl);
        }
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

  if (!candidate || !result) return (
    <div className="flex flex-col items-center justify-center py-20">
      <Loader2 className="animate-spin text-blue-600 mb-4" size={40} />
      <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Carregando Relatório...</p>
    </div>
  );

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
            <Cpu size={24} className="text-blue-500" /> Competências por Pilar
          </h3>
          <div className="h-[250px] md:h-[300px] mb-8">
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

          {/* Cards de notas por Pilar (RESTAURADO) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.values(BlockType).map((block) => {
              const score = result.blockScores?.[block] || 0;
              return (
                <div key={block} className="p-5 bg-slate-50 rounded-[24px] border border-slate-100 flex flex-col items-center text-center hover:bg-white hover:shadow-md transition-all">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{block}</span>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-2xl font-black ${score >= 7 ? 'text-green-600' : score >= 5 ? 'text-amber-500' : 'text-red-500'}`}>
                      {score.toFixed(1)}
                    </span>
                    <span className="text-[10px] font-bold text-slate-300">/10</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-slate-900 p-6 md:p-10 rounded-[32px] md:rounded-[40px] shadow-2xl text-white flex flex-col">
          <h3 className="text-lg md:text-xl font-bold flex items-center gap-3 mb-6 md:mb-8">
            <Sparkles size={24} className="text-blue-400" /> Veredito da IA
          </h3>
          <div className="flex-1">
            {loadingAI ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <RefreshCw size={40} className="animate-spin text-blue-400" />
                <p className="font-black text-[10px] uppercase tracking-widest animate-pulse">Gerando Recomendação...</p>
              </div>
            ) : (
              <p className="text-slate-300 text-base md:text-lg leading-relaxed font-medium italic">"{recommendation}"</p>
            )}
          </div>
        </div>
      </div>

      {/* Seção de Cenário Prático / Case Study */}
      {result.scenarioResults && result.scenarioResults.length > 0 && (
        <div className="bg-white rounded-[32px] md:rounded-[40px] border border-slate-100 shadow-sm overflow-hidden animate-in slide-in-from-bottom-4">
          <div className="bg-indigo-600 p-6 md:p-8 flex items-center gap-4 text-white">
            <BrainCircuit size={32} />
            <div>
              <h3 className="text-xl md:text-2xl font-black">Avaliação de Cenário Prático</h3>
              <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest">Análise de Resolução de Problemas Complexos</p>
            </div>
          </div>
          
          <div className="p-6 md:p-10 space-y-10">
            {result.scenarioResults.map((sr, idx) => {
              const scenario = template?.scenarios?.find(s => s.id === sr.scenarioId);
              return (
                <div key={sr.id} className="space-y-8">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Cenário Apresentado */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <FileText size={14} /> Cenário Proposto
                      </div>
                      <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                        <h4 className="font-bold text-slate-800 mb-2">{scenario?.title || 'Cenário Técnico'}</h4>
                        <p className="text-sm text-slate-600 leading-relaxed italic">"{scenario?.description || 'Descrição do caso não disponível.'}"</p>
                      </div>
                    </div>

                    {/* Resposta do Candidato */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <MessageSquare size={14} /> Resposta do Candidato
                      </div>
                      <div className="p-6 bg-blue-50/30 rounded-3xl border border-blue-100 min-h-[150px]">
                        <p className="text-sm text-slate-700 font-medium whitespace-pre-wrap leading-relaxed">
                          {sr.answer}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Avaliação da IA sobre o Cenário */}
                  <div className="bg-slate-900 rounded-[32px] p-6 md:p-8 flex flex-col md:flex-row gap-6 md:gap-8 items-start">
                    <div className="flex flex-col items-center bg-indigo-600 p-6 rounded-2xl shrink-0 shadow-lg shadow-indigo-600/20">
                      <span className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-1">Nota Case</span>
                      <span className="text-4xl font-black text-white">{sr.score.toFixed(1)}</span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                        <Sparkles size={14} /> Feedback Técnico da IA
                      </div>
                      <p className="text-slate-300 text-sm md:text-base leading-relaxed font-medium italic">
                        "{sr.feedback}"
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidateReportView;
