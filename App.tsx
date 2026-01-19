
import React, { useState, useEffect } from 'react';
import { UserRole, Candidate, AssessmentTemplate, AssessmentResult, SeniorityLevel, BlockType, Question, ImplementationType } from './types';
import Layout from './components/Layout';
import TestRunner from './components/TestRunner';
import Dashboard from './components/Dashboard';
import SettingsView from './components/SettingsView';
import QuestionBankView from './components/QuestionBankView';
import TemplatesView from './components/TemplatesView';
import { db } from './services/dbService';
import { generateDynamicQuestions } from './services/geminiService';
import { 
  Users, 
  Plus, 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  Copy, 
  RefreshCw,
  Search,
  Filter,
  Sparkles
} from 'lucide-react';
import { BLOCK_WEIGHTS } from './constants';

const App: React.FC = () => {
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [templates, setTemplates] = useState<AssessmentTemplate[]>([]);
  
  // Test view state
  const [isTakingTest, setIsTakingTest] = useState(false);
  const [currentCandidate, setCurrentCandidate] = useState<Candidate | null>(null);
  const [currentTemplate, setCurrentTemplate] = useState<AssessmentTemplate | null>(null);

  // New Candidate Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Initial data load
    setCandidates(db.getCandidates());
    setTemplates(db.getTemplates());

    // Auto-login for demo or public link
    const hash = window.location.hash;
    if (hash.startsWith('#/test/')) {
      const candId = hash.split('/')[2];
      const candList = db.getCandidates();
      const cand = candList.find(c => c.id === candId);
      
      if (cand && cand.status !== 'COMPLETED') {
        const tmplList = db.getTemplates();
        // Match template by module, industry, level AND implementation type
        const template = tmplList.find(t => 
          t.moduleId === cand.appliedModule && 
          t.industryId === cand.appliedIndustry && 
          t.level === cand.appliedLevel &&
          t.implementationType === cand.implementationType
        );
        if (template) {
          setCurrentCandidate(cand);
          setCurrentTemplate(template);
          setIsTakingTest(true);
          setUserRole(UserRole.CANDIDATE);
        }
      }
    } else {
      setUserRole(UserRole.ADMIN);
    }
  }, []);

  const handleCreateTest = async (candData: any) => {
    setIsLoading(true);
    try {
      const moduleId = candData.module;
      const industryName = candData.industry;
      const level = candData.level as SeniorityLevel;
      const implType = candData.implType as ImplementationType;
      
      const candId = `cand-${Date.now()}`;
      const blocks = Object.values(BlockType);
      const allQuestions: Question[] = [];

      for (const block of blocks) {
        // 80/20 strategy: Find matching bank questions first
        const bank = db.getBankQuestions(moduleId, industryName, implType).filter(q => 
          q.block === block && 
          q.seniority === level
        );

        const existingCount = 8;
        const selectedExisting = bank.sort(() => 0.5 - Math.random()).slice(0, existingCount);
        
        const dynamicNeeded = 10 - selectedExisting.length;
        let dynamic: Question[] = [];
        if (dynamicNeeded > 0) {
          dynamic = await generateDynamicQuestions(moduleId, industryName, level, implType, block, dynamicNeeded);
        }
        
        const weightedQuestions = [...selectedExisting, ...dynamic].map(q => ({
          ...q,
          weight: (BLOCK_WEIGHTS[moduleId] || BLOCK_WEIGHTS['default'])[block]
        }));

        allQuestions.push(...weightedQuestions);
      }

      const newCand: Candidate = {
        id: candId,
        name: candData.name,
        email: candData.email,
        appliedModule: moduleId,
        appliedIndustry: industryName,
        appliedLevel: level,
        implementationType: implType,
        testLink: `${window.location.origin}${window.location.pathname}#/test/${candId}`,
        status: 'PENDING'
      };

      const template: AssessmentTemplate = {
        id: `tmpl-${Date.now()}`,
        name: `Avaliação: ${moduleId.toUpperCase()} - ${level} (${implType})`,
        moduleId,
        industryId: industryName,
        level,
        implementationType: implType,
        questions: allQuestions,
        createdAt: new Date().toISOString()
      };

      db.saveTemplate(template);
      db.saveCandidate(newCand);
      
      setCandidates(db.getCandidates());
      setTemplates(db.getTemplates());
      setShowAddModal(false);
      alert('Avaliação criada com sucesso!');
    } catch (err) {
      console.error(err);
      alert('Erro ao criar avaliação.');
    } finally {
      setIsLoading(false);
    }
  };

  const onTestComplete = (result: AssessmentResult) => {
    setIsTakingTest(false);
    setCurrentCandidate(null);
    setCurrentTemplate(null);
    alert('Avaliação finalizada com sucesso! O RH será notificado.');
    window.location.hash = '';
    setCandidates(db.getCandidates());
    setActiveTab('dashboard');
  };

  if (isTakingTest && currentCandidate && currentTemplate) {
    return (
      <TestRunner 
        candidate={currentCandidate} 
        template={currentTemplate} 
        onComplete={onTestComplete} 
      />
    );
  }

  return (
    <Layout 
      userRole={userRole || UserRole.RH} 
      activeTab={activeTab} 
      setActiveTab={setActiveTab}
      onLogout={() => setUserRole(null)}
    >
      {activeTab === 'dashboard' && <Dashboard />}
      {activeTab === 'templates' && <TemplatesView />}
      {activeTab === 'config' && <SettingsView />}
      {activeTab === 'bank' && <QuestionBankView />}

      {activeTab === 'candidates' && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold text-slate-900">Gestão de Talentos</h2>
              <p className="text-slate-500">Status de progresso e links de acesso</p>
            </div>
            <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-600/30">
              <Plus size={20} /> Avaliar Candidato
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase">Candidato</th>
                  <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase">Perfil / Nível / Implementação</th>
                  <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase">Status</th>
                  <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {candidates.length === 0 ? (
                  <tr><td colSpan={4} className="px-8 py-12 text-center text-slate-400 italic">Nenhum candidato registrado.</td></tr>
                ) : (
                  candidates.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-8 py-6">
                        <div className="font-bold text-slate-800">{c.name}</div>
                        <div className="text-xs text-slate-500">{c.email}</div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-wrap gap-2">
                          <span className="px-2 py-1 bg-blue-50 text-blue-600 text-[9px] font-bold rounded uppercase">{c.appliedModule}</span>
                          <span className="px-2 py-1 bg-amber-50 text-amber-600 text-[9px] font-bold rounded uppercase">{c.appliedLevel}</span>
                          <span className="px-2 py-1 bg-green-50 text-green-600 text-[9px] font-bold rounded uppercase">{c.implementationType}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 font-bold text-[10px] rounded-full uppercase border ${
                          c.status === 'COMPLETED' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                        }`}>
                          {c.status === 'COMPLETED' ? <CheckCircle2 size={12} /> : <Clock size={12} />} {c.status}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => { navigator.clipboard.writeText(c.testLink); alert('Link copiado!'); }} className="p-3 text-slate-400 hover:text-blue-600">
                            <Copy size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New Candidate Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="bg-slate-900 p-8 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Nova Avaliação</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white p-2">✕</button>
            </div>
            
            <form onSubmit={(e) => { e.preventDefault(); handleCreateTest(Object.fromEntries(new FormData(e.currentTarget))); }} className="p-8 space-y-5">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                <input required name="name" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">E-mail</label>
                <input required type="email" name="email" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Módulo</label>
                  <select name="module" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none appearance-none">
                    {db.getModules().map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Senioridade</label>
                  <select name="level" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none appearance-none">
                    {Object.values(SeniorityLevel).map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Indústria</label>
                  <select name="industry" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none appearance-none">
                    {db.getIndustries().map(i => <option key={i.id} value={i.name}>{i.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Implementação</label>
                  <select name="implType" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none appearance-none">
                    {Object.values(ImplementationType).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div className="pt-4">
                <button disabled={isLoading} type="submit" className="w-full py-5 bg-blue-600 text-white font-bold rounded-2xl shadow-xl shadow-blue-600/30 hover:bg-blue-700 transition-all flex items-center justify-center gap-3">
                  {isLoading ? <RefreshCw className="animate-spin" size={20} /> : <><Sparkles size={18} /> Criar e Gerar 80/20</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;
