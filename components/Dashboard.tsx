import React, { useMemo, useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { AssessmentResult, Candidate, BlockType } from '../types';
import { db } from '../services/dbService';
import { FileText, ChevronRight, Calculator, ExternalLink, Info, TrendingUp, Target } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

interface DashboardProps {
  onViewReport: (candidateId: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onViewReport }) => {
  const [results, setResults] = useState<AssessmentResult[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [res, cands] = await Promise.all([db.getResults(), db.getCandidates()]);
        setResults(res || []);
        setCandidates(cands || []);
      } catch (e) {
        console.error("Erro dashboard:", e);
      }
    };
    loadData();
  }, []);

  const stats = useMemo(() => {
    const total = candidates.length;
    const completed = candidates.filter(c => c.status === 'COMPLETED').length;
    const avgScore = results.length > 0 ? results.reduce((acc, r) => acc + r.score, 0) / results.length : 0;
    
    return { total, completed, avgScore };
  }, [candidates, results]);

  const radarData = useMemo(() => {
    const blocks = Object.values(BlockType);
    if (results.length === 0) {
      return blocks.map(b => ({ subject: b, A: 0, B: 10, fullMark: 10 }));
    }
    
    return blocks.map(block => {
      const filtered = results.filter(r => r.blockScores && r.blockScores[block] !== undefined);
      const avg = filtered.length > 0 
        ? filtered.reduce((acc, r) => acc + (r.blockScores[block] || 0), 0) / filtered.length 
        : 0;
      return { subject: block, A: Number(avg.toFixed(1)), B: 10, fullMark: 10 };
    });
  }, [results]);

  const seniorityData = useMemo(() => {
    if (candidates.length === 0) return [];
    const counts = candidates.reduce((acc, c) => {
      acc[c.appliedLevel] = (acc[c.appliedLevel] || 0) + 1;
      return acc;
    }, {} as any);
    return Object.keys(counts).map(key => ({ name: key, value: counts[key] }));
  }, [candidates]);

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Visão Geral de Talentos</h2>
          <p className="text-slate-500 font-medium">Métricas e performance consolidada dos candidatos</p>
        </div>
        <div className="flex flex-wrap gap-4">
          <div className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-100 flex flex-col items-center min-w-[140px] border-b-4 border-b-slate-200">
            <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Total de Candidatos</span>
            <span className="text-3xl font-black text-slate-900">{stats.total}</span>
          </div>
          <div className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-100 flex flex-col items-center min-w-[140px] border-b-4 border-b-green-200">
            <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Entrevistas Concluídas</span>
            <span className="text-3xl font-black text-green-600">{stats.completed}</span>
          </div>
          <div className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-100 flex flex-col items-center min-w-[140px] border-b-4 border-b-blue-200 group relative">
            <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Performance Média</span>
            <span className="text-3xl font-black text-blue-600">{stats.avgScore.toFixed(1)}</span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 relative overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Equilíbrio por Pilar</h3>
              <p className="text-xs text-slate-500">Média de performance consolidada por área de conhecimento</p>
            </div>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} />
                <PolarRadiusAxis angle={30} domain={[0, 10]} />
                <Radar 
                  name="Média Candidatos" 
                  dataKey="A" 
                  stroke="#3b82f6" 
                  fill="#3b82f6" 
                  fillOpacity={0.6} 
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 h-full flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 mb-8 flex items-center gap-2">
            <Target size={20} className="text-amber-500" />
            Mix de Senioridade
          </h3>
          <div className="flex-1 h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={seniorityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {seniorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
          <h3 className="text-lg font-bold text-slate-800">Últimas Avaliações Finalizadas</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-50">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Candidato</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Contexto SAP</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Performance</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Relatório</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {results.length > 0 ? results.slice(-10).reverse().map((res) => {
                const cand = candidates.find(c => c.id === res.candidateId);
                const scorePercentage = (res.score / 50) * 100;
                return (
                  <tr key={res.id} className="hover:bg-slate-50/80 transition-all group">
                    <td className="px-8 py-6">
                      <div className="font-bold text-slate-800">{cand?.name || 'Candidato Excluído'}</div>
                      <div className="text-xs text-slate-400 font-medium">{cand?.email}</div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-wrap gap-1.5">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[9px] font-black rounded uppercase tracking-tighter border border-blue-100">{cand?.appliedModule}</span>
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-[9px] font-black rounded uppercase tracking-tighter border border-amber-100">{cand?.appliedLevel}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="flex-1 w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-1000 ${res.score >= 35 ? 'bg-green-500' : res.score >= 20 ? 'bg-amber-500' : 'bg-red-500'}`} 
                            style={{ width: `${scorePercentage}%` }}
                          ></div>
                        </div>
                        <span className="font-black text-slate-800 text-base">{res.score.toFixed(1)}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button 
                        onClick={() => onViewReport(cand?.id || '')}
                        className="p-3 text-blue-600 bg-white border border-blue-100 hover:bg-blue-600 hover:text-white rounded-2xl transition-all shadow-sm active:scale-95 ml-auto"
                      >
                        <ExternalLink size={18} />
                      </button>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center">
                    <p className="text-slate-400 font-medium italic text-sm">Nenhuma avaliação concluída até o momento.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;