
import React, { useMemo, useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { AssessmentResult, Candidate, BlockType, SAPModule, Industry, SeniorityLevel, ImplementationType } from '../types';
import { db } from '../services/dbService';
import { FileText, ChevronRight, Calculator, ExternalLink, Info, TrendingUp, Target, Filter, Layers, Cloud, Users, CheckCircle, Clock } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

interface DashboardProps {
  onViewReport: (candidateId: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onViewReport }) => {
  const [results, setResults] = useState<AssessmentResult[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [modules, setModules] = useState<SAPModule[]>([]);
  const [industries, setIndustries] = useState<Industry[]>([]);

  // Filter States
  const [filterBlock, setFilterBlock] = useState<string>('ALL');
  const [filterModule, setFilterModule] = useState<string>('ALL');
  const [filterLevel, setFilterLevel] = useState<string>('ALL');
  const [filterIndustry, setFilterIndustry] = useState<string>('ALL');
  const [filterImpl, setFilterImpl] = useState<string>('ALL');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [res, cands, mods, inds] = await Promise.all([
          db.getResults(), 
          db.getCandidates(),
          db.getModules(),
          db.getIndustries()
        ]);
        setResults(res || []);
        setCandidates(cands || []);
        setModules(mods || []);
        setIndustries(inds || []);
      } catch (e) {
        console.error("Erro dashboard:", e);
      }
    };
    loadData();
  }, []);

  // Filter Logic
  const filteredCandidates = useMemo(() => {
    return candidates.filter(c => {
      const matchModule = filterModule === 'ALL' || c.appliedModule === filterModule;
      const matchLevel = filterLevel === 'ALL' || c.appliedLevel === filterLevel;
      const matchIndustry = filterIndustry === 'ALL' || c.appliedIndustry === filterIndustry;
      const matchImpl = filterImpl === 'ALL' || c.implementationType === filterImpl;
      return matchModule && matchLevel && matchIndustry && matchImpl;
    });
  }, [candidates, filterModule, filterLevel, filterIndustry, filterImpl]);

  const filteredResults = useMemo(() => {
    const candIds = new Set(filteredCandidates.map(c => c.id));
    return results.filter(r => candIds.has(r.candidateId));
  }, [results, filteredCandidates]);

  const stats = useMemo(() => {
    const total = filteredCandidates.length;
    const completed = filteredCandidates.filter(c => c.status === 'COMPLETED').length;
    
    let avgScore = 0;
    if (filteredResults.length > 0) {
      if (filterBlock !== 'ALL') {
        avgScore = filteredResults.reduce((acc, r) => acc + (r.blockScores[filterBlock as BlockType] || 0), 0) / filteredResults.length;
      } else {
        avgScore = filteredResults.reduce((acc, r) => acc + r.score, 0) / filteredResults.length;
      }
    }
    
    return { total, completed, avgScore };
  }, [filteredCandidates, filteredResults, filterBlock]);

  const radarData = useMemo(() => {
    const blocks = filterBlock === 'ALL' ? Object.values(BlockType) : [filterBlock as BlockType];
    
    if (filteredResults.length === 0) {
      return blocks.map(b => ({ subject: b, A: 0, B: 10, fullMark: 10 }));
    }
    
    return blocks.map(block => {
      const filtered = filteredResults.filter(r => r.blockScores && r.blockScores[block] !== undefined);
      const avg = filtered.length > 0 
        ? filtered.reduce((acc, r) => acc + (r.blockScores[block] || 0), 0) / filtered.length 
        : 0;
      return { subject: block, A: Number(avg.toFixed(1)), B: 10, fullMark: 10 };
    });
  }, [filteredResults, filterBlock]);

  const seniorityData = useMemo(() => {
    if (filteredCandidates.length === 0) return [];
    const counts = filteredCandidates.reduce((acc, c) => {
      acc[c.appliedLevel] = (acc[c.appliedLevel] || 0) + 1;
      return acc;
    }, {} as any);
    return Object.keys(counts).map(key => ({ name: key, value: counts[key] }));
  }, [filteredCandidates]);

  return (
    <div className="space-y-6 md:space-y-8 pb-12 animate-in fade-in duration-500">
      <header className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Visão Geral de Talentos</h2>
            <p className="text-slate-500 text-sm md:text-base font-medium">Performance filtrada em tempo real</p>
          </div>
          <div className="flex items-center gap-2 text-blue-600 bg-blue-50 px-4 py-2 rounded-2xl border border-blue-100 text-xs font-black uppercase tracking-widest">
            <Filter size={16} /> Filtros Ativos
          </div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-[24px] border border-slate-100 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="space-y-1">
            <label className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase ml-1">Bloco de Avaliação</label>
            <select value={filterBlock} onChange={(e) => setFilterBlock(e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs md:text-sm outline-none font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 transition-all">
              <option value="ALL">Todos os Blocos</option>
              {Object.values(BlockType).map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase ml-1">Módulo SAP</label>
            <select value={filterModule} onChange={(e) => setFilterModule(e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs md:text-sm outline-none font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 transition-all">
              <option value="ALL">Todos os Módulos</option>
              {modules.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase ml-1">Sênioridade</label>
            <select value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs md:text-sm outline-none font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 transition-all">
              <option value="ALL">Senioridade</option>
              {Object.values(SeniorityLevel).map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase ml-1">Indústria</label>
            <select value={filterIndustry} onChange={(e) => setFilterIndustry(e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs md:text-sm outline-none font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 transition-all">
              <option value="ALL">Todas as Indústrias</option>
              {industries.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase ml-1">Implementação</label>
            <select value={filterImpl} onChange={(e) => setFilterImpl(e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs md:text-sm outline-none font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 transition-all">
              <option value="ALL">Todos os Tipos</option>
              {Object.values(ImplementationType).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:flex lg:flex-wrap gap-3 md:gap-4">
          <div className="bg-white p-4 md:p-6 rounded-[24px] shadow-sm border border-slate-100 flex flex-col items-center flex-1 border-b-4 border-b-slate-200">
            <span className="text-slate-400 text-[9px] md:text-[10px] font-black uppercase tracking-widest mb-1">Candidatos</span>
            <span className="text-2xl md:text-3xl font-black text-slate-900">{stats.total}</span>
          </div>
          <div className="bg-white p-4 md:p-6 rounded-[24px] shadow-sm border border-slate-100 flex flex-col items-center flex-1 border-b-4 border-b-green-200">
            <span className="text-slate-400 text-[9px] md:text-[10px] font-black uppercase tracking-widest mb-1">Concluídos</span>
            <span className="text-2xl md:text-3xl font-black text-green-600">{stats.completed}</span>
          </div>
          <div className="bg-white p-4 md:p-6 rounded-[24px] shadow-sm border border-slate-100 flex flex-col items-center flex-1 border-b-4 border-b-blue-200 col-span-2 lg:col-span-1">
            <span className="text-slate-400 text-[9px] md:text-[10px] font-black uppercase tracking-widest mb-1">
              {filterBlock !== 'ALL' ? `Média ${filterBlock}` : 'Média Geral'}
            </span>
            <span className="text-2xl md:text-3xl font-black text-blue-600">
              {stats.avgScore.toFixed(1)}
              {filterBlock !== 'ALL' && <span className="text-xs text-slate-300 ml-1">/10</span>}
            </span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Radar Chart */}
        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <Target className="text-blue-600" size={24} />
            <div>
              <h3 className="text-lg font-bold text-slate-800">Competências Médias</h3>
              <p className="text-xs text-slate-400 uppercase font-black tracking-widest">Desempenho por Pilar Técnico</p>
            </div>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#f1f5f9" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 800 }} />
                <PolarRadiusAxis angle={30} domain={[0, 10]} />
                <Radar name="Média Grupo" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} strokeWidth={3} />
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart / Seniority Breakdown */}
        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm flex flex-col">
          <div className="flex items-center gap-3 mb-8">
            <Layers className="text-amber-500" size={24} />
            <div>
              <h3 className="text-lg font-bold text-slate-800">Distribuição de Senioridade</h3>
              <p className="text-xs text-slate-400 uppercase font-black tracking-widest">Mix de talentos avaliados</p>
            </div>
          </div>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={seniorityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {seniorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none' }} />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Results Table */}
      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TrendingUp className="text-green-500" size={24} />
            <h3 className="text-xl font-bold text-slate-800 tracking-tight">Resultados Recentes</h3>
          </div>
          <button className="text-xs font-black text-blue-600 uppercase tracking-widest hover:underline">Ver Todos</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100">
              <tr>
                <th className="px-8 py-5">Candidato</th>
                <th className="px-8 py-5">Módulo</th>
                <th className="px-8 py-5">Senioridade</th>
                <th className="px-8 py-5 text-center">Score</th>
                <th className="px-8 py-5 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredResults.length > 0 ? filteredResults.slice(0, 5).map(r => {
                const cand = candidates.find(c => c.id === r.candidateId);
                return (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-8 py-5">
                      <div className="font-bold text-slate-800">{cand?.name || 'N/A'}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">{cand?.email || 'N/A'}</div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-500 text-[10px] font-black rounded-lg uppercase">
                        {cand?.appliedModule || 'N/A'}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <span className="px-2.5 py-1 bg-blue-50 text-blue-600 text-[10px] font-black rounded-lg uppercase border border-blue-100">
                        {cand?.appliedLevel || 'N/A'}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <div className={`text-xl font-black ${r.score >= 35 ? 'text-green-600' : 'text-blue-600'}`}>
                        {r.score.toFixed(1)}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button 
                        onClick={() => onViewReport(r.candidateId)}
                        className="p-2.5 text-slate-400 hover:text-blue-600 bg-white border border-slate-100 rounded-xl transition-all shadow-sm"
                      >
                        <ExternalLink size={18} />
                      </button>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center text-slate-400 italic">
                    Nenhum resultado processado com os filtros atuais.
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
