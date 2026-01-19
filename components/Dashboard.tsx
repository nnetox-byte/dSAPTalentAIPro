
import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { AssessmentResult, Candidate, BlockType } from '../types';
import { db } from '../services/dbService';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const Dashboard: React.FC = () => {
  const results = db.getResults();
  const candidates = db.getCandidates();

  const stats = useMemo(() => {
    const total = candidates.length;
    const completed = candidates.filter(c => c.status === 'COMPLETED').length;
    const avgScore = results.length > 0 ? results.reduce((acc, r) => acc + r.score, 0) / results.length : 0;
    
    return { total, completed, avgScore };
  }, [candidates, results]);

  const radarData = useMemo(() => {
    if (results.length === 0) return [];
    
    // Average scores by block
    const blocks = Object.values(BlockType);
    return blocks.map(block => {
      const filtered = results.filter(r => r.blockScores[block] !== undefined);
      const avg = filtered.length > 0 
        ? filtered.reduce((acc, r) => acc + (r.blockScores[block] || 0), 0) / filtered.length 
        : 0;
      return { subject: block, A: avg, fullMark: 10 };
    });
  }, [results]);

  const seniorityData = useMemo(() => {
    const counts = candidates.reduce((acc, c) => {
      acc[c.appliedLevel] = (acc[c.appliedLevel] || 0) + 1;
      return acc;
    }, {} as any);
    return Object.keys(counts).map(key => ({ name: key, value: counts[key] }));
  }, [candidates]);

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Visão Geral de Talentos</h2>
          <p className="text-slate-500">Métricas e performance consolidada dos candidatos</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center min-w-[120px]">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Total</span>
            <span className="text-2xl font-bold text-slate-900">{stats.total}</span>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center min-w-[120px]">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Concluídos</span>
            <span className="text-2xl font-bold text-green-600">{stats.completed}</span>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center min-w-[120px]">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Média Geral</span>
            <span className="text-2xl font-bold text-blue-600">{stats.avgScore.toFixed(1)}</span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Radar Chart: Skills Balance */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Performance Média por Pilar</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis angle={30} domain={[0, 10]} />
                <Radar name="Média Candidatos" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart: Seniority Mix */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Distribuição de Senioridade</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={seniorityData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {seniorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Latest Evaluations Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800">Avaliações Recentes</h3>
          <button className="text-blue-600 font-semibold text-sm hover:underline">Ver todas</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase">Candidato</th>
                <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase">Módulo</th>
                <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase">Data</th>
                <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase">Score</th>
                <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {results.slice(-5).reverse().map((res) => {
                const cand = candidates.find(c => c.id === res.candidateId);
                return (
                  <tr key={res.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-8 py-4">
                      <div className="font-semibold text-slate-800">{cand?.name}</div>
                      <div className="text-xs text-slate-500">{cand?.email}</div>
                    </td>
                    <td className="px-8 py-4">
                      <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded uppercase">
                        {cand?.appliedModule}
                      </span>
                    </td>
                    <td className="px-8 py-4 text-sm text-slate-500">
                      {new Date(res.completedAt).toLocaleDateString()}
                    </td>
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${res.score >= 35 ? 'bg-green-500' : 'bg-amber-500'}`} 
                            style={{ width: `${(res.score / 50) * 100}%` }}
                          ></div>
                        </div>
                        <span className="font-bold text-slate-800">{res.score}/50</span>
                      </div>
                    </td>
                    <td className="px-8 py-4">
                      <span className="px-2 py-1 bg-green-50 text-green-600 text-[10px] font-bold rounded uppercase">
                        Concluído
                      </span>
                    </td>
                  </tr>
                );
              })}
              {results.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-8 py-12 text-center text-slate-400 italic">
                    Nenhuma avaliação concluída até o momento.
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
