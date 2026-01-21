import React, { useMemo, useState, useEffect } from 'react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid 
} from 'recharts';
import { Candidate, AssessmentResult, BlockType, LinkedInAnalysis } from '../types';
import { ArrowLeft, Users, Zap, Award, Target, BrainCircuit, Activity, CheckCircle2, Clock, MessageSquareQuote, Loader2, Sparkles, Info, Calculator, ShieldCheck } from 'lucide-react';
import { generateCandidateRecommendation } from '../services/geminiService';

interface ComparisonViewProps {
  candidates: Candidate[];
  results: AssessmentResult[];
  linkedinAnalyses: LinkedInAnalysis[];
  onBack: () => void;
}

const ComparisonView: React.FC<ComparisonViewProps> = ({ candidates, results, linkedinAnalyses, onBack }) => {
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
  const [recommendations, setRecommendations] = useState<Record<string, string>>({});
  const [loadingRecs, setLoadingRecs] = useState(false);

  const formatDiscLabel = (val: string) => {
    if (!val) return 'N/A';
    const v = val.toUpperCase();
    if (v.includes('DOMIN') && !v.includes('(D)')) return 'DOMINÂNCIA (D)';
    if (v.includes('INFLU') && !v.includes('(I)')) return 'INFLUÊNCIA (I)';
    if (v.includes('ESTAB') && !v.includes('(S)')) return 'ESTABILIDADE (S)';
    if (v.includes('CONFOR') && !v.includes('(C)')) return 'CONFORMIDADE (C)';
    return v;
  };

  useEffect(() => {
    const fetchRecs = async () => {
      setLoadingRecs(true);
      const recs: Record<string, string> = {};
      
      await Promise.all(candidates.map(async (cand) => {
        const res = results.find(r => r.candidateId === cand.id);
        if (res) {
          try {
            const rec = await generateCandidateRecommendation(cand, res);
            recs[cand.id] = rec;
          } catch (e) {
            recs[cand.id] = "Não foi possível gerar a recomendação no momento.";
          }
        }
      }));
      
      setRecommendations(recs);
      setLoadingRecs(false);
    };

    if (candidates.length > 0) {
      fetchRecs();
    }
  }, [candidates, results]);

  // Dados para Gráfico Radar (Pilares Técnicos)
  const radarData = useMemo(() => {
    return Object.values(BlockType).map(block => {
      const entry: any = { subject: block };
      candidates.forEach(cand => {
        const res = results.find(r => r.candidateId === cand.id);
        entry[cand.name] = res?.blockScores?.[block] || 0;
      });
      return entry;
    });
  }, [candidates, results]);

  // Dados para Gráfico de Barras (Perfil DISC)
  const discData = useMemo(() => {
    return [
      { factor: 'Dominância' },
      { factor: 'Influência' },
      { factor: 'Estabilidade' },
      { factor: 'Conformidade' }
    ].map(item => {
      const entry: any = { ...item };
      candidates.forEach(cand => {
        const analysis = linkedinAnalyses.find(a => a.candidateId === cand.id || a.profileLink.toLowerCase().includes(cand.name.toLowerCase().split(' ')[0]));
        if (analysis) {
          if (item.factor === 'Dominância') entry[cand.name] = analysis.disc.scores.dominance;
          if (item.factor === 'Influência') entry[cand.name] = analysis.disc.scores.influence;
          if (item.factor === 'Estabilidade') entry[cand.name] = analysis.disc.scores.steadiness;
          if (item.factor === 'Conformidade') entry[cand.name] = analysis.disc.scores.compliance;
        } else {
          entry[cand.name] = 0;
        }
      });
      return entry;
    });
  }, [candidates, linkedinAnalyses]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-3 bg-white text-slate-500 hover:text-slate-800 rounded-2xl shadow-sm border border-slate-100 transition-all active:scale-95">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Comparativo de Talentos</h2>
            <p className="text-sm text-slate-500 font-medium tracking-tight">Análise técnica e comportamental side-by-side</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl border border-slate-700">
          <Users size={16} /> {candidates.length} Selecionados
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 md:p-10 rounded-[40px] border border-slate-100 shadow-xl relative overflow-hidden">
          <div className="mb-8">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3">
              <Target size={24} className="text-blue-600" /> Balanço de Soft/Hard Skills
            </h3>
            <p className="text-xs text-slate-500 mt-1 font-medium">Pontuação por pilar técnico (Escala 0-10)</p>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#f1f5f9" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 800 }} />
                <PolarRadiusAxis angle={30} domain={[0, 10]} />
                {candidates.map((cand, idx) => (
                  <Radar 
                    key={cand.id}
                    name={cand.name} 
                    dataKey={cand.name} 
                    stroke={COLORS[idx % COLORS.length]} 
                    fill={COLORS[idx % COLORS.length]} 
                    fillOpacity={0.25} 
                    strokeWidth={3}
                  />
                ))}
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                <Legend iconType="circle" />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 md:p-10 rounded-[40px] border border-slate-100 shadow-xl relative overflow-hidden">
          <div className="mb-8">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3">
              <Activity size={24} className="text-amber-500" /> DNA Comportamental (DISC)
            </h3>
            <p className="text-xs text-slate-500 mt-1 font-medium">Mapeamento de perfil gerado via IA/LinkedIn</p>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={discData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="factor" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                <YAxis hide domain={[0, 100]} />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '16px', border: 'none' }} />
                <Legend iconType="circle" />
                {candidates.map((cand, idx) => (
                  <Bar 
                    key={cand.id} 
                    dataKey={cand.name} 
                    fill={COLORS[idx % COLORS.length]} 
                    radius={[8, 8, 0, 0]} 
                    barSize={24}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl overflow-hidden">
        <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-3">
            <Zap size={24} className="text-blue-500" /> Matriz de Decisão Side-by-Side
          </h3>
          {loadingRecs && <div className="flex items-center gap-2 text-blue-600 text-[10px] font-black uppercase tracking-widest"><Loader2 className="animate-spin" size={14} /> IA Gerando Veredito...</div>}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Dimensão</th>
                {candidates.map((cand, idx) => (
                  <th key={cand.id} className="px-10 py-6 min-w-[280px]">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full border-4 border-white shadow-sm" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                      <span className="font-black text-slate-900 uppercase text-xs tracking-tight">{cand.name}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="px-10 py-6 text-xs font-bold text-slate-500 uppercase tracking-tighter">Status Atual</td>
                {candidates.map(cand => (
                  <td key={cand.id} className="px-10 py-6">
                    <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${cand.status === 'COMPLETED' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                      {cand.status}
                    </span>
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-10 py-6 text-xs font-bold text-slate-500 uppercase tracking-tighter">Score Técnico Total</td>
                {candidates.map(cand => {
                  const res = results.find(r => r.candidateId === cand.id);
                  const normalized = res ? (res.score / 50) * 100 : 0;
                  return (
                    <td key={cand.id} className="px-10 py-6">
                      {res ? (
                        <div className="flex items-baseline gap-1">
                          <span className="font-black text-2xl text-slate-900">{normalized.toFixed(1)}</span>
                          <span className="text-[10px] font-bold text-slate-300">%</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-slate-300 italic text-sm">
                           <Clock size={14} /> Aguardando teste
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
              <tr>
                <td className="px-10 py-6 text-xs font-bold text-slate-500 uppercase tracking-tighter">Perfil DISC</td>
                {candidates.map(cand => {
                  const analysis = linkedinAnalyses.find(a => a.candidateId === cand.id || a.profileLink.toLowerCase().includes(cand.name.toLowerCase().split(' ')[0]));
                  return (
                    <td key={cand.id} className="px-10 py-6">
                      {analysis ? (
                        <span className="px-4 py-1.5 bg-blue-50 text-blue-600 text-[10px] font-black rounded-xl uppercase border border-blue-100">
                          {formatDiscLabel(analysis.disc.predominant)}
                        </span>
                      ) : <span className="text-slate-200 italic text-sm">Não analisado</span>}
                    </td>
                  );
                })}
              </tr>
              <tr>
                <td className="px-10 py-6 text-xs font-bold text-slate-500 uppercase tracking-tighter">Sênioridade Aplicada</td>
                {candidates.map(cand => (
                  <td key={cand.id} className="px-10 py-6 font-black text-slate-700 text-sm">
                    {cand.appliedLevel}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-10 py-6 text-xs font-bold text-slate-500 uppercase tracking-tighter">Módulo Principal</td>
                {candidates.map(cand => (
                  <td key={cand.id} className="px-10 py-6">
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-black rounded-lg uppercase">
                      {cand.appliedModule}
                    </span>
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-10 py-6 text-xs font-bold text-slate-500 uppercase tracking-tighter">Veredito Estratégico</td>
                {candidates.map(cand => (
                  <td key={cand.id} className="px-10 py-6 bg-indigo-50/30">
                    {loadingRecs ? (
                      <div className="flex items-center gap-2 text-slate-300 animate-pulse">
                        <Loader2 className="animate-spin" size={14} />
                        <span className="text-[10px] font-bold uppercase">Gerando...</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-indigo-600">
                          <Sparkles size={14} />
                          <span className="text-[10px] font-black uppercase tracking-widest">Indicação IA</span>
                        </div>
                        <p className="text-[11px] leading-relaxed text-slate-700 font-medium italic border-l-2 border-indigo-200 pl-3">
                          {recommendations[cand.id] || "Pendente de avaliação técnica para processar veredito."}
                        </p>
                      </div>
                    )}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Racional de Pontuação */}
      <div className="bg-slate-50 border border-slate-200 rounded-[32px] p-8 md:p-10 space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 text-blue-600">
            <Calculator size={24} />
          </div>
          <h3 className="text-xl font-bold text-slate-800">Metodologia do Score Técnico Total</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
            <div className="flex items-center gap-2 text-blue-600 mb-3">
              <ShieldCheck size={18} />
              <span className="text-xs font-black uppercase tracking-widest">Peso 1: Questões IA</span>
            </div>
            <p className="text-[13px] text-slate-600 font-medium leading-relaxed">
              <strong>70% da nota final (35 pts)</strong>. Baseado na acurácia em questões de múltipla escolha distribuídas por pilares críticos: 
              <em> Clean Core, SAP Activate, Processos e Dados Mestres.</em>
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
            <div className="flex items-center gap-2 text-amber-600 mb-3">
              <BrainCircuit size={18} />
              <span className="text-xs font-black uppercase tracking-widest">Peso 2: Cenário Prático</span>
            </div>
            <p className="text-[13px] text-slate-600 font-medium leading-relaxed">
              <strong>30% da nota final (15 pts)</strong>. Avaliação subjetiva via LLM da resposta aberta do candidato, focando em arquitetura, 
              viabilidade técnica e aderência às melhores práticas SAP.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
            <div className="flex items-center gap-2 text-indigo-600 mb-3">
              <Info size={18} />
              <span className="text-xs font-black uppercase tracking-widest">Normalização</span>
            </div>
            <p className="text-[13px] text-slate-600 font-medium leading-relaxed">
              A soma máxima é de <strong>50 pontos reais</strong>. O percentual exibido na matriz é o resultado de 
              <code className="bg-slate-50 px-1 py-0.5 rounded mx-1 text-indigo-600 font-bold">(Pontos / 50) * 100</code>, 
              gerando o índice comparativo de senioridade.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComparisonView;