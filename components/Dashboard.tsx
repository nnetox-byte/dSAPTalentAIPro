
import React, { useMemo, useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { AssessmentResult, Candidate, BlockType, SAPModule, Industry, SeniorityLevel, ImplementationType } from '../types';
import { db } from '../services/dbService';
import { FileText, ChevronRight, Calculator, ExternalLink, Info, TrendingUp, Target, Filter, Layers, Cloud } from 'lucide-react';

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
        // Se um bloco específico for selecionado, a média é baseada na nota daquele bloco (0-10)
        avgScore = filteredResults.reduce((acc, r) => acc + (r.blockScores[filterBlock as BlockType] || 0), 0) / filteredResults.length;
      } else {
        // Caso contrário, média da nota total do teste (0-50)
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

        {/* Filters Bar - Identical to Question Bank */}
        <div className="bg-white p-4 md:p-6 rounded-[24px] border border-slate-100 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="space-y-1">
            <label className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase ml-1">Bloco de Avaliação</label>
            <select value={filterBlock} onChange={(e) => setFilterBlock(e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs md:text-sm outline-none font-semibold text-slate-700 focus:ring-2 focus:ring-blue-500 transition-all">
              <option value="ALL">Todos os Blocos</option>
              {Object.values(BlockType).map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase ml-1">Módulo SAP</label>
            <select value={filterModule} onChange={(e) => setFilterModule(e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs md:text-sm outline-none font-semibold text-slate-700 focus:ring-2 focus:ring-blue-500 transition-all">
              <option value="ALL">Todos os Módulos</option>
              {modules.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase ml-1">Sênioridade</label>
            <select value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs md:text-sm outline-none font-semibold text-slate-700 focus:ring-2 focus:ring-blue-500 transition-all">
              <option value="ALL">Senioridade</option>
              {Object.values(SeniorityLevel).map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase ml-1">Indústria</label>
            <select value={filterIndustry} onChange={(e) => setFilterIndustry(e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs md:text-sm outline-none font-semibold text-slate-700 focus:ring-2 focus:ring-blue-500 transition-all">
              <option value="ALL">Todas as Indústrias</option>
              {industries.map(i => <option key={i.id} value={i.name}>{i.name}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase ml-1">Implementação</label>
            <select value={filterImpl} onChange={(e) => setFilterImpl(e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs md:text-sm outline-none font-semibold text-slate-700 focus:ring-2 focus:ring-blue-500 transition-all">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-[32px] shadow-sm border border-slate-100 relative overflow-hidden">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-800">Equilíbrio por Pilar</h3>
            <p className="text-xs text-slate-500">
              {filterBlock !== 'ALL' ? `Visualizando foco em: ${filterBlock}` : 'Média de performance consolidada por área'}
            </p>
          </div>
          <div className="h-[300px] md:h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} />
                <PolarRadiusAxis angle={30} domain={[0, 10]} />
                <Radar name="Média" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-[32px] shadow-sm border border-slate-100 h-full flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Target size={20} className="text-amber-500" />
            Senioridade
          </h3>
          <div className="flex-1 h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={seniorityData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={8} dataKey="value">
                  {seniorityData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 md:px-8 md:py-6 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-800">Avaliações Filtradas</h3>
          <div className="text-xs font-bold text-slate-400">Total: {filteredResults.length} resultados</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[600px]">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="px-6 md:px-8 py-4">Candidato</th>
                <th className="px-6 md:px-8 py-4">Contexto</th>
                <th className="px-6 md:px-8 py-4">{filterBlock !== 'ALL' ? `Nota ${filterBlock}` : 'Nota Total'}</th>
                <th className="px-6 md:px-8 py-4 text-right">Relatório</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredResults.length > 0 ? filteredResults.slice().reverse().map((res) => {
                const cand = filteredCandidates.find(c => c.id === res.candidateId);
                return (
                  <tr key={res.id} className="hover:bg-slate-50/80 transition-all group">
                    <td className="px-6 md:px-8 py-4">
                      <div className="font-bold text-slate-800 text-sm">{cand?.name || '---'}</div>
                      <div className="text-[10px] text-slate-400 font-medium">{cand?.email}</div>
                    </td>
                    <td className="px-6 md:px-8 py-4">
                      <div className="flex gap-1.5">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[9px] font-black rounded uppercase border border-blue-100">{cand?.appliedModule}</span>
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-[9px] font-black rounded uppercase border border-amber-100">{cand?.appliedLevel}</span>
                      </div>
                    </td>
                    <td className="px-6 md:px-8 py-4 font-black text-slate-800 text-sm">
                      {filterBlock !== 'ALL' 
                        ? (res.blockScores[filterBlock as BlockType] || 0).toFixed(1)
                        : res.score.toFixed(1)
                      }
                      {filterBlock !== 'ALL' && <span className="text-[10px] text-slate-300 ml-1">/10</span>}
                    </td>
                    <td className="px-6 md:px-8 py-4 text-right">
                      <button onClick={() => onViewReport(cand?.id || '')} className="p-2.5 text-blue-600 bg-white border border-blue-100 hover:bg-blue-600 hover:text-white rounded-xl transition-all shadow-sm">
                        <ExternalLink size={16} />
                      </button>
                    </td>
                  </tr>
                );
              }) : (
                <tr><td colSpan={4} className="px-8 py-12 text-center text-slate-400 italic text-sm">Nenhum resultado corresponde aos filtros selecionados.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
