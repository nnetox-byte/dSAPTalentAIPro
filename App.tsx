
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { UserRole, Candidate, AssessmentTemplate, AssessmentResult, SeniorityLevel, BlockType, Question, ImplementationType, LinkedInAnalysis, SAPModule, Industry } from './types';
import Layout from './components/Layout';
import TestRunner from './components/TestRunner';
import TestWelcome from './components/TestWelcome';
import Dashboard from './components/Dashboard';
import SettingsView from './components/SettingsView';
import QuestionBankView from './components/QuestionBankView';
import TemplatesView from './components/TemplatesView';
import CandidateReportView from './components/CandidateReportView';
import LinkedInAnalysisDetail from './components/LinkedInAnalysisDetail';
import ComparisonView from './components/ComparisonView';
import { db } from './services/dbService';
import { analyzeLinkedInProfile, generateBulkQuestions, generateSAPScenario } from './services/geminiService';
import { 
  Plus, 
  Copy, 
  Sparkles,
  Linkedin,
  Loader2,
  ExternalLink,
  Trash2,
  FileText,
  BrainCircuit,
  X,
  Lock,
  Check,
  Info,
  Layers,
  Wand2,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';

const App: React.FC = () => {
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [linkedinAnalyses, setLinkedinAnalyses] = useState<LinkedInAnalysis[]>([]);
  const [modules, setModules] = useState<SAPModule[]>([]);
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [templates, setTemplates] = useState<AssessmentTemplate[]>([]);
  const [results, setResults] = useState<AssessmentResult[]>([]);
  const [isLoadingApp, setIsLoadingApp] = useState(true);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string | null>(null);
  const [compareList, setCompareList] = useState<string[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showLinkedInModal, setShowLinkedInModal] = useState(false);
  const [isLoadingAction, setIsLoadingAction] = useState(false);
  const [preSelectedCandidateId, setPreSelectedCandidateId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [includeScenario, setIncludeScenario] = useState(true);

  const formatDiscLabel = (val: string) => {
    if (!val) return 'N/A';
    const v = val.toUpperCase();
    if (v.includes('DOMIN') && !v.includes('(D)')) return 'DOMINÂNCIA (D)';
    if (v.includes('INFLU') && !v.includes('(I)')) return 'INFLUÊNCIA (I)';
    if (v.includes('ESTAB') && !v.includes('(S)')) return 'ESTABILIDADE (S)';
    if (v.includes('CONFOR') && !v.includes('(C)')) return 'CONFORMIDADE (C)';
    return v;
  };

  const initApp = useCallback(async () => {
    setIsLoadingApp(true);
    try {
      const [cands, analyses, mods, inds, tmpls, ress] = await Promise.all([
        db.getCandidates(), 
        db.getLinkedInAnalyses(),
        db.getModules(),
        db.getIndustries(),
        db.getTemplates(),
        db.getResults()
      ]);
      setCandidates(cands || []);
      setLinkedinAnalyses(analyses || []);
      setModules(mods || []);
      setIndustries(inds || []);
      setTemplates(tmpls || []);
      setResults(ress || []);
      setUserRole(UserRole.ADMIN);
    } catch (error) { 
      setUserRole(UserRole.ADMIN); 
    } finally { 
      setIsLoadingApp(false); 
    }
  }, []);

  useEffect(() => { initApp(); }, [initApp]);

  const handleDeleteCandidate = async (candidateId: string) => {
    if (!confirm('Deseja realmente excluir este candidato?')) return;
    setIsLoadingAction(true);
    try {
      const analysis = linkedinAnalyses.find(a => a.candidateId === candidateId);
      if (analysis) await db.deleteLinkedInAnalysis(analysis.id);
      await db.deleteResultByCandidate(candidateId);
      await db.deleteCandidate(candidateId);
      await initApp();
    } catch (error: any) {
      alert(`Erro na exclusão: ${error.message}`);
    } finally {
      setIsLoadingAction(false);
    }
  };

  const handleCreateLinkedInAnalysis = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoadingAction(true);
    const formData = new FormData(e.currentTarget);
    const profileLink = formData.get('profileLink') as string;
    const candidateId = preSelectedCandidateId || (formData.get('candidateId') as string);
    try {
      const analysis = await analyzeLinkedInProfile(profileLink);
      analysis.candidateId = candidateId;
      await db.saveLinkedInAnalysis(analysis);
      await initApp();
      setShowLinkedInModal(false);
      setPreSelectedCandidateId(null);
    } catch (err: any) {
      alert(`Erro na análise: ${err.message}`);
    } finally {
      setIsLoadingAction(false);
    }
  };

  const handleCreateCandidate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoadingAction(true);
    setStatusMessage("Preparando Avaliação Estratégica...");
    
    const formData = new FormData(e.currentTarget);
    const moduleId = formData.get('module') as string;
    const level = formData.get('level') as SeniorityLevel;
    const industryId = formData.get('industry') as string;
    const implType = formData.get('implType') as ImplementationType;

    try {
      setStatusMessage("Gemini está desenhando Pack IA exclusivo...");
      const counts = {
        [BlockType.MASTER_DATA]: 5, [BlockType.PROCESS]: 5,
        [BlockType.SOFT_SKILL]: 5, [BlockType.SAP_ACTIVATE]: 5,
        [BlockType.CLEAN_CORE]: 5
      };

      const newQuestions = await generateBulkQuestions(moduleId, industryId, level, implType, counts);
      let scenarios: any[] = [];
      
      if (includeScenario) {
        setStatusMessage("Adicionando Desafio Prático ao Pack...");
        const newScenario = await generateSAPScenario(moduleId, level, industryId, implType);
        scenarios = [newScenario];
      }

      const newTemplate: AssessmentTemplate = {
        id: `pack-${moduleId}-${level}-${industryId}-${Date.now()}`,
        name: `Pack IA: ${moduleId.toUpperCase()} ${level} (${includeScenario ? '+Case' : 'Apenas Q.'})`,
        moduleId, industryId, level, implementationType: implType,
        questions: newQuestions,
        scenarios: scenarios,
        createdAt: new Date().toISOString()
      };

      await db.saveTemplate(newTemplate);

      const newCand: Candidate = {
        id: `cand-${Date.now()}`,
        name: formData.get('name') as string,
        email: formData.get('email') as string,
        appliedModule: moduleId, appliedIndustry: industryId, appliedLevel: level,
        implementationType: implType, status: 'PENDING',
        templateId: newTemplate.id,
        testLink: `${window.location.origin}/test/${Date.now()}`,
        createdAt: new Date().toISOString()
      };

      await db.saveCandidate(newCand);
      await initApp();
      setShowAddModal(false);
    } catch (error: any) {
      alert(`Falha: ${error.message}`);
    } finally {
      setIsLoadingAction(false);
      setStatusMessage(null);
    }
  };

  const copyLink = (link: string, id: string) => {
    navigator.clipboard.writeText(link);
    setCopySuccess(id);
    setTimeout(() => setCopySuccess(null), 2000);
  };

  const toggleCompare = (id: string) => {
    setCompareList(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  if (isLoadingApp) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-900 text-white gap-4">
        <Loader2 className="animate-spin text-blue-500" size={40} />
        <p className="text-sm font-bold uppercase tracking-widest text-slate-400">Carregando Ecossistema SAP...</p>
      </div>
    );
  }

  return (
    <Layout userRole={userRole || UserRole.RH} activeTab={activeTab} setActiveTab={setActiveTab} onLogout={() => window.location.reload()}>
      {activeTab === 'dashboard' && <Dashboard onViewReport={(id) => { setSelectedCandidateId(id); setActiveTab('report'); }} />}
      
      {activeTab === 'candidates' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-3xl font-bold text-slate-900">Candidatos</h2>
            <div className="flex gap-3">
              {compareList.length >= 2 && (
                <button onClick={() => setActiveTab('comparison')} className="px-6 py-3 bg-slate-900 text-white font-black rounded-2xl flex items-center gap-2 shadow-xl animate-pulse">
                   Comparar ({compareList.length})
                </button>
              )}
              <button onClick={() => setShowAddModal(true)} className="px-6 py-3 bg-blue-600 text-white font-bold rounded-2xl flex items-center gap-2 shadow-lg"><Plus size={20} /> Novo Teste</button>
            </div>
          </div>
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400">
                <tr className="border-b">
                  <th className="px-8 py-5">Comparar</th>
                  <th className="px-8 py-5">Candidato</th>
                  <th className="px-8 py-5">Status</th>
                  <th className="px-8 py-5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {candidates.length > 0 ? candidates.map(c => {
                  const analysis = linkedinAnalyses.find(a => a.candidateId === c.id);
                  const result = results.find(r => r.candidateId === c.id);
                  return (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="px-8 py-5">
                        <input type="checkbox" checked={compareList.includes(c.id)} onChange={() => toggleCompare(c.id)} className="w-5 h-5 rounded border-slate-300 text-blue-600" />
                      </td>
                      <td className="px-8 py-5">
                        <div className="font-bold text-slate-800">{c.name}</div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{c.appliedModule} - {c.appliedLevel}</div>
                      </td>
                      <td className="px-8 py-5">
                        <span className={`px-2 py-1 text-[9px] font-black rounded-full uppercase border ${c.status === 'COMPLETED' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right flex justify-end gap-2">
                        {c.status === 'COMPLETED' ? (
                          <button onClick={() => { setSelectedCandidateId(c.id); setActiveTab('report'); }} className="p-2 text-green-600 bg-green-50 rounded-xl"><FileText size={16} /></button>
                        ) : (
                          <button onClick={() => copyLink(c.testLink, c.id)} className={`p-2 rounded-xl transition-all ${copySuccess === c.id ? 'text-green-600 bg-green-50' : 'text-blue-600 bg-blue-50'}`}>
                            {copySuccess === c.id ? <Check size={16} /> : <Copy size={16} />}
                          </button>
                        )}
                        {analysis ? (
                          <button onClick={() => { setSelectedAnalysisId(analysis.id); setActiveTab('linkedin_detail'); }} className="p-2 text-indigo-600 bg-indigo-50 rounded-xl"><BrainCircuit size={16} /></button>
                        ) : (
                          <button onClick={() => { setPreSelectedCandidateId(c.id); setShowLinkedInModal(true); }} className="p-2 text-slate-400 hover:text-indigo-600 bg-slate-50 rounded-xl"><BrainCircuit size={16} /></button>
                        )}
                        <button onClick={() => handleDeleteCandidate(c.id)} className="p-2 text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr><td colSpan={4} className="px-8 py-12 text-center text-slate-400 italic">Nenhum candidato.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'comparison' && <ComparisonView candidates={candidates.filter(c => compareList.includes(c.id))} results={results.filter(r => compareList.includes(r.candidateId))} linkedinAnalyses={linkedinAnalyses} onBack={() => setActiveTab('candidates')} />}
      {activeTab === 'linkedin_analyses' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-3xl font-bold text-slate-900">Análises DISC</h2>
            <button onClick={() => { setPreSelectedCandidateId(null); setShowLinkedInModal(true); }} className="px-6 py-3 bg-[#0077b5] text-white font-bold rounded-2xl flex items-center gap-2"><Linkedin size={20} /> Nova Análise</button>
          </div>
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400">
                <tr className="border-b">
                  <th className="px-8 py-5">Candidato</th>
                  <th className="px-8 py-5">Predominante</th>
                  <th className="px-8 py-5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {linkedinAnalyses.map(a => (
                  <tr key={a.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => { setSelectedAnalysisId(a.id); setActiveTab('linkedin_detail'); }}>
                    <td className="px-8 py-5 font-bold text-sm text-slate-700">{candidates.find(c => c.id === a.candidateId)?.name || 'N/A'}</td>
                    <td className="px-8 py-5"><span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-full uppercase border border-indigo-100">{formatDiscLabel(a.disc?.predominant)}</span></td>
                    <td className="px-8 py-5 text-right flex justify-end gap-2"><ExternalLink size={16} className="text-slate-300" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'linkedin_detail' && selectedAnalysisId && <LinkedInAnalysisDetail analysisId={selectedAnalysisId} onBack={() => setActiveTab('linkedin_analyses')} />}
      {activeTab === 'report' && selectedCandidateId && <CandidateReportView candidateId={selectedCandidateId} onBack={() => setActiveTab('candidates')} />}
      {activeTab === 'templates' && <TemplatesView />}
      {activeTab === 'bank' && <QuestionBankView />}
      {activeTab === 'config' && <SettingsView />}

      {/* Modal Criar Novo Candidato/Teste */}
      {showAddModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="bg-blue-600 p-8 flex items-center justify-between text-white">
              <h3 className="text-xl font-bold flex items-center gap-2"><Plus /> Novo Teste de Candidato</h3>
              <button onClick={() => setShowAddModal(false)}><X /></button>
            </div>
            <form onSubmit={handleCreateCandidate} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <input required name="name" placeholder="Nome Completo" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold" />
                <input required name="email" type="email" placeholder="Email Profissional" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold" />
              </div>

              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2">
                     <Wand2 size={16} className="text-blue-600" />
                     <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Critérios do Pack AI</h4>
                   </div>
                   <button 
                     type="button" 
                     onClick={() => setIncludeScenario(!includeScenario)}
                     className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all font-black text-[9px] uppercase tracking-widest border ${includeScenario ? 'bg-indigo-600 text-white border-indigo-700 shadow-md' : 'bg-white text-slate-400 border-slate-200'}`}
                   >
                     {includeScenario ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                     Incluir Desafio Prático
                   </button>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <select required name="module" className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-bold">
                    {modules.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                  <select required name="level" className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-bold">
                    {Object.values(SeniorityLevel).map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <select required name="implType" className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-bold">
                    {Object.values(ImplementationType).map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                  <select required name="industry" className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-bold">
                    {industries.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                  </select>
                </div>
              </div>

              {isLoadingAction && (
                <div className="p-4 bg-blue-50 rounded-2xl flex items-center gap-3 animate-in fade-in">
                  <Loader2 className="animate-spin text-blue-600" size={20} />
                  <p className="text-xs font-bold text-blue-800">{statusMessage}</p>
                </div>
              )}

              <button disabled={isLoadingAction} type="submit" className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-600/20 flex items-center justify-center gap-3">
                {isLoadingAction ? <Loader2 className="animate-spin" /> : <Sparkles size={22} />} 
                {isLoadingAction ? "Processando..." : "Gerar Teste e Link"}
              </button>
            </form>
          </div>
        </div>
      )}

      {showLinkedInModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-xl rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in">
            <div className="bg-[#0077b5] p-8 flex items-center justify-between text-white">
              <h3 className="text-xl font-bold flex items-center gap-2"><Linkedin /> Análise DISC IA</h3>
              <button onClick={() => { setShowLinkedInModal(false); setPreSelectedCandidateId(null); }}><X /></button>
            </div>
            <form onSubmit={handleCreateLinkedInAnalysis} className="p-8 space-y-6">
              <input required name="profileLink" placeholder="Link do LinkedIn" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold" />
              <button disabled={isLoadingAction} type="submit" className="w-full py-5 bg-[#0077b5] text-white font-black rounded-2xl shadow-xl">
                {isLoadingAction ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />} 
                {isLoadingAction ? "Analisando..." : "Gerar Análise"}
              </button>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;
