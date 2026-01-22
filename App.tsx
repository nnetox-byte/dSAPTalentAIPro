
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { UserRole, Candidate, AssessmentTemplate, AssessmentResult, SeniorityLevel, BlockType, Question, ImplementationType, LinkedInAnalysis, SAPModule, Industry } from './types';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import SettingsView from './components/SettingsView';
import QuestionBankView from './components/QuestionBankView';
import TemplatesView from './components/TemplatesView';
import CandidateReportView from './components/CandidateReportView';
import LinkedInAnalysisDetail from './components/LinkedInAnalysisDetail';
import ComparisonView from './components/ComparisonView';
import TestWelcome from './components/TestWelcome';
import TestRunner from './components/TestRunner';
import { db } from './services/dbService';
import { analyzeLinkedInProfile, generateBulkQuestions, generateSAPScenario } from './services/geminiService';
import { 
  Plus, 
  Sparkles,
  Linkedin,
  Loader2,
  Trash2,
  FileText,
  BrainCircuit,
  X,
  Check,
  Wand2,
  ToggleLeft,
  ToggleRight,
  ChevronLeft,
  ChevronRight,
  Link2,
  Users,
  Search,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Info,
  RefreshCw,
  Filter
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
  
  // Estados de Prova (Modo Candidato)
  const [candidateMode, setCandidateMode] = useState<Candidate | null>(null);
  const [templateMode, setTemplateMode] = useState<AssessmentTemplate | null>(null);
  const [testStarted, setTestStarted] = useState(false);
  const [isTestComplete, setIsTestComplete] = useState(false);

  // Filtros de Candidatos
  const [filterCandModule, setFilterCandModule] = useState<string>('ALL');
  const [filterCandLevel, setFilterCandLevel] = useState<string>('ALL');
  const [filterCandIndustry, setFilterCandIndustry] = useState<string>('ALL');

  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Seleção para Comparação
  const [compareList, setCompareList] = useState<string[]>([]);
  
  // UI States
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [isLoadingAction, setIsLoadingAction] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [includeScenario, setIncludeScenario] = useState(true);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [searchTermAnalyses, setSearchTermAnalyses] = useState('');
  const [pendingAnalysisCandidateId, setPendingAnalysisCandidateId] = useState<string | null>(null);

  const initApp = useCallback(async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const candId = urlParams.get('test');

    if (candId) {
      setIsLoadingApp(true);
      try {
        const cand = await db.getCandidate(candId);
        if (cand) {
          setCandidateMode(cand);
          if (cand.status === 'COMPLETED') {
            setIsTestComplete(true);
          } else if (cand.templateId) {
            const tmpl = await db.getTemplate(cand.templateId);
            if (tmpl) setTemplateMode(tmpl);
          }
        }
      } catch (e) { 
        console.error("Erro modo candidato:", e); 
      } finally { 
        setIsLoadingApp(false); 
      }
      return; 
    }

    setIsLoadingApp(true);
    try {
      const [cands, analyses, mods, inds, tmpls, ress] = await Promise.all([
        db.getCandidates().catch(() => []), 
        db.getLinkedInAnalyses().catch(() => []),
        db.getModules().catch(() => []),
        db.getIndustries().catch(() => []),
        db.getTemplates().catch(() => []),
        db.getResults().catch(() => [])
      ]);
      setCandidates(cands || []);
      setLinkedinAnalyses(analyses || []);
      setModules(mods || []);
      setIndustries(inds || []);
      setTemplates(tmpls || []);
      setResults(ress || []);
      setUserRole(UserRole.ADMIN);
    } catch (error) { 
      console.error("Erro ao carregar app:", error);
      setUserRole(UserRole.ADMIN); 
    } finally { 
      setIsLoadingApp(false); 
    }
  }, []);

  useEffect(() => { initApp(); }, [initApp]);

  // Lógica de Filtro e Paginação
  const filteredCandidatesList = useMemo(() => {
    return candidates.filter(c => {
      const matchModule = filterCandModule === 'ALL' || c.appliedModule === filterCandModule;
      const matchLevel = filterCandLevel === 'ALL' || c.appliedLevel === filterCandLevel;
      const matchIndustry = filterCandIndustry === 'ALL' || c.appliedIndustry === filterCandIndustry;
      return matchModule && matchLevel && matchIndustry;
    });
  }, [candidates, filterCandModule, filterCandLevel, filterCandIndustry]);

  const paginatedCandidates = useMemo(() => {
    const sorted = [...filteredCandidatesList].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sorted.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredCandidatesList, currentPage, itemsPerPage]);

  const totalPagesCandidates = Math.ceil(filteredCandidatesList.length / itemsPerPage);

  const toggleCompare = (id: string) => {
    setCompareList(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleCopyLink = (id: string) => {
    const link = `${window.location.origin}/?test=${id}`;
    navigator.clipboard.writeText(link);
    setCopyFeedback(id);
    setTimeout(() => setCopyFeedback(null), 2000);
  };

  const handleViewDISC = (candidate: Candidate) => {
    const analysis = linkedinAnalyses.find(a => a.candidateId === candidate.id);
    if (analysis) {
      setSelectedAnalysisId(analysis.id);
      setActiveTab('linkedin_detail');
    } else {
      setPendingAnalysisCandidateId(candidate.id);
      setShowAnalysisModal(true);
    }
  };

  const handleDeleteCandidate = async (id: string) => {
    if (confirm("Excluir candidato permanentemente?")) {
      await db.deleteCandidate(id);
      initApp();
    }
  };

  const handleCreateCandidate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoadingAction(true);
    setStatusMessage("Criando teste com IA...");
    const formData = new FormData(e.currentTarget);
    try {
      const name = formData.get('name') as string;
      const email = formData.get('email') as string;
      const moduleId = formData.get('module') as string;
      const level = formData.get('level') as SeniorityLevel;
      const industryId = formData.get('industry') as string;
      const jobContext = formData.get('jobContext') as string;

      const counts = {
        [BlockType.MASTER_DATA]: 5, [BlockType.PROCESS]: 5,
        [BlockType.SOFT_SKILL]: 5, [BlockType.SAP_ACTIVATE]: 5,
        [BlockType.CLEAN_CORE]: 5
      };

      const newQuestions = await generateBulkQuestions(moduleId, industryId, level, ImplementationType.PRIVATE, counts, jobContext);
      let scenarios: any[] = [];
      if (includeScenario) {
        const newScenario = await generateSAPScenario(moduleId, level, industryId, ImplementationType.PRIVATE);
        await db.saveBankScenario(newScenario);
        scenarios = [newScenario];
      }

      const templateId = `pack-${moduleId}-${level}-${Date.now()}`;
      await db.saveTemplate({
        id: templateId,
        name: `Pack IA: ${moduleId.toUpperCase()} ${level}`,
        moduleId, industryId, level, implementationType: ImplementationType.PRIVATE,
        questions: newQuestions,
        scenarios,
        createdAt: new Date().toISOString()
      });

      const candidateId = `cand-${Date.now()}`;
      await db.saveCandidate({
        id: candidateId, name, email, appliedModule: moduleId, appliedIndustry: industryId, appliedLevel: level,
        implementationType: ImplementationType.PRIVATE, status: 'PENDING', templateId,
        testLink: `${window.location.origin}/?test=${candidateId}`,
        createdAt: new Date().toISOString(),
        jobContext
      });
      
      await initApp();
      setShowAddModal(false);
    } catch (error: any) {
      alert("Erro: " + error.message);
    } finally {
      setIsLoadingAction(false);
      setStatusMessage(null);
    }
  };

  const handleCreateAnalysis = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoadingAction(true);
    setStatusMessage("Analisando LinkedIn...");
    const formData = new FormData(e.currentTarget);
    const profileLink = formData.get('linkedinUrl') as string;
    try {
      const newAnalysis = await analyzeLinkedInProfile(profileLink);
      if (pendingAnalysisCandidateId) newAnalysis.candidateId = pendingAnalysisCandidateId;
      await db.saveLinkedInAnalysis(newAnalysis);
      await initApp();
      setShowAnalysisModal(false);
    } catch (error: any) {
      alert("Erro na análise.");
    } finally {
      setIsLoadingAction(false);
      setStatusMessage(null);
    }
  };

  if (isLoadingApp) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8">
      <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
      <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Sincronizando...</p>
    </div>
  );

  if (candidateMode) {
    if (isTestComplete) return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-xl w-full bg-white rounded-[40px] shadow-2xl p-12 text-center border">
          <CheckCircle2 size={64} className="text-green-500 mx-auto mb-6" />
          <h2 className="text-3xl font-black text-slate-900 mb-4">Avaliação Concluída</h2>
          <p className="text-slate-600 font-medium mb-8">Obrigado! Seus resultados foram salvos e enviados ao RH.</p>
        </div>
      </div>
    );
    if (!templateMode) return <div>Modelo não encontrado.</div>;
    return !testStarted ? (
      <TestWelcome candidate={candidateMode} template={templateMode} onStart={() => setTestStarted(true)} />
    ) : (
      <TestRunner candidate={candidateMode} template={templateMode} onComplete={() => setIsTestComplete(true)} />
    );
  }

  return (
    <Layout userRole={userRole || UserRole.RH} activeTab={activeTab} setActiveTab={setActiveTab} onLogout={() => window.location.reload()}>
      {activeTab === 'dashboard' && <Dashboard onViewReport={(id) => { setSelectedCandidateId(id); setActiveTab('report'); }} />}
      
      {activeTab === 'candidates' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Candidatos</h2>
            <div className="flex gap-3">
              {compareList.length > 0 && (
                <button onClick={() => setActiveTab('compare')} className="px-6 py-3 bg-indigo-600 text-white font-black rounded-2xl flex items-center gap-2 shadow-lg">
                  <Users size={20} /> Comparar ({compareList.length})
                </button>
              )}
              <button onClick={() => setShowAddModal(true)} className="px-6 py-3 bg-blue-600 text-white font-black rounded-2xl flex items-center gap-2 shadow-lg">
                <Plus size={20} /> Novo Teste
              </button>
            </div>
          </div>

          {/* Filtros Restaurados */}
          <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Módulo</label>
              <select value={filterCandModule} onChange={(e) => setFilterCandModule(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl font-bold text-xs outline-none">
                <option value="ALL">Todos os Módulos</option>
                {modules.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nível</label>
              <select value={filterCandLevel} onChange={(e) => setFilterCandLevel(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl font-bold text-xs outline-none">
                <option value="ALL">Qualquer</option>
                {Object.values(SeniorityLevel).map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Indústria</label>
              <select value={filterCandIndustry} onChange={(e) => setFilterCandIndustry(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl font-bold text-xs outline-none">
                <option value="ALL">Todas</option>
                {industries.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
            </div>
            <button onClick={() => { setFilterCandModule('ALL'); setFilterCandLevel('ALL'); setFilterCandIndustry('ALL'); }} className="py-2.5 bg-slate-100 text-slate-500 font-bold rounded-xl text-xs">Limpar Filtros</button>
          </div>

          {/* Tabela Restaurada com Paginação e Ações */}
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden min-h-[500px] flex flex-col">
            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  <tr className="border-b border-slate-100">
                    <th className="px-8 py-5 text-center w-12"><Check size={14} className="mx-auto" /></th>
                    <th className="px-8 py-5">Candidato</th>
                    <th className="px-8 py-5 text-center">Status</th>
                    <th className="px-8 py-5">Contexto</th>
                    <th className="px-8 py-5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {paginatedCandidates.map((c) => (
                    <tr key={c.id} className={`hover:bg-slate-50 transition-colors ${compareList.includes(c.id) ? 'bg-indigo-50/30' : ''}`}>
                      <td className="px-8 py-5 text-center">
                        <button onClick={() => toggleCompare(c.id)} className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center ${compareList.includes(c.id) ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200'}`}>
                          {compareList.includes(c.id) && <Check size={12} strokeWidth={4} />}
                        </button>
                      </td>
                      <td className="px-8 py-5">
                        <div className="font-bold text-slate-800">{c.name}</div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase">{c.email}</div>
                      </td>
                      <td className="px-8 py-5 text-center">
                        <span className={`px-2.5 py-1 text-[9px] font-black rounded-lg border uppercase tracking-widest ${c.status === 'COMPLETED' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                         <div className="flex gap-2">
                            <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-2 py-1 rounded uppercase tracking-tighter">{c.appliedModule}</span>
                            <span className="text-[10px] font-black text-blue-500 bg-blue-50 px-2 py-1 rounded uppercase tracking-tighter border border-blue-100">{c.appliedLevel}</span>
                         </div>
                      </td>
                      <td className="px-8 py-5 text-right flex justify-end gap-2">
                        <button onClick={() => handleCopyLink(c.id)} className={`p-2.5 rounded-xl border ${copyFeedback === c.id ? 'bg-green-600 border-green-700 text-white' : 'bg-white border-slate-100 text-slate-400 hover:text-blue-600'}`}>
                          {copyFeedback === c.id ? <Check size={16} /> : <Link2 size={16}/>}
                        </button>
                        <button onClick={() => {setSelectedCandidateId(c.id); setActiveTab('report');}} disabled={c.status !== 'COMPLETED'} className="p-2.5 bg-white border border-slate-100 text-slate-400 hover:text-green-600 rounded-xl disabled:opacity-30">
                          <FileText size={16}/>
                        </button>
                        <button onClick={() => handleViewDISC(c)} className="p-2.5 bg-white border border-slate-100 text-slate-400 hover:text-indigo-600 rounded-xl">
                          <BrainCircuit size={16}/>
                        </button>
                        <button onClick={() => handleDeleteCandidate(c.id)} className="p-2.5 bg-white border border-slate-100 text-slate-400 hover:text-red-500 rounded-xl">
                          <Trash2 size={16}/>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-6 bg-slate-50 border-t flex justify-between items-center text-xs font-bold text-slate-400">
               <div className="flex items-center gap-4">
                 <span>Exibir:</span>
                 <select value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value))} className="bg-white border rounded-lg p-1 outline-none">
                    <option value={10}>10</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                 </select>
                 <span>Total: {filteredCandidatesList.length}</span>
               </div>
               <div className="flex items-center gap-4">
                 <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="p-1 hover:text-blue-600"><ChevronLeft size={16} /></button>
                 <span>Página {currentPage} de {totalPagesCandidates || 1}</span>
                 <button onClick={() => setCurrentPage(p => Math.min(totalPagesCandidates, p + 1))} className="p-1 hover:text-blue-600"><ChevronRight size={16} /></button>
               </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'linkedin_analyses' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Análise DISC</h2>
            <button onClick={() => setShowAnalysisModal(true)} className="px-6 py-3 bg-indigo-600 text-white font-black rounded-2xl flex items-center gap-2">
              <Linkedin size={20} /> Nova Análise
            </button>
          </div>

          {/* Cards Informativos DISC Restaurados */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { l: 'D', t: 'Dominância', d: 'Como lida com problemas e desafios.', c: 'bg-red-50 text-red-600 border-red-100' },
              { l: 'I', t: 'Influência', d: 'Como lida com pessoas e as influencia.', c: 'bg-amber-50 text-amber-600 border-amber-100' },
              { l: 'S', t: 'Estabilidade', d: 'Como lida com mudanças e ritmo.', c: 'bg-green-50 text-green-600 border-green-100' },
              { l: 'C', t: 'Conformidade', d: 'Como lida com regras e processos.', c: 'bg-blue-50 text-blue-600 border-blue-100' },
            ].map(item => (
              <div key={item.l} className={`p-5 rounded-3xl border ${item.c} shadow-sm group hover:scale-[1.02] transition-all`}>
                <div className="flex items-center gap-3 mb-2">
                  <span className="w-8 h-8 rounded-xl bg-white flex items-center justify-center font-black text-sm shadow-sm">{item.l}</span>
                  <h4 className="font-black text-xs uppercase tracking-widest">{item.t}</h4>
                </div>
                <p className="text-[10px] font-medium leading-relaxed opacity-80">{item.d}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
             <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b">
                   <tr>
                      <th className="px-8 py-5">Perfil</th>
                      <th className="px-8 py-5">Estilo Predominante</th>
                      <th className="px-8 py-5">Data</th>
                      <th className="px-8 py-5 text-right">Ação</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                   {linkedinAnalyses.map(a => (
                      <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                         <td className="px-8 py-5 font-bold text-slate-800">{a.profileLink}</td>
                         <td className="px-8 py-5">
                            <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-full border border-indigo-100 uppercase">
                              {a.disc?.predominant || 'N/A'}
                            </span>
                         </td>
                         <td className="px-8 py-5 text-[10px] text-slate-400 font-bold uppercase">{new Date(a.analyzedAt).toLocaleDateString()}</td>
                         <td className="px-8 py-5 text-right">
                            <button onClick={()=>{setSelectedAnalysisId(a.id); setActiveTab('linkedin_detail');}} className="p-2 text-slate-400 hover:text-indigo-600"><Zap size={20}/></button>
                         </td>
                      </tr>
                   ))}
                </tbody>
             </table>
          </div>
        </div>
      )}

      {activeTab === 'templates' && <TemplatesView />}
      {activeTab === 'bank' && <QuestionBankView />}
      {activeTab === 'config' && <SettingsView />}
      {activeTab === 'report' && selectedCandidateId && <CandidateReportView candidateId={selectedCandidateId} onBack={() => setActiveTab('candidates')} />}
      {activeTab === 'linkedin_detail' && selectedAnalysisId && <LinkedInAnalysisDetail analysisId={selectedAnalysisId} onBack={() => setActiveTab('linkedin_analyses')} />}
      {activeTab === 'compare' && <ComparisonView candidates={candidates.filter(c => compareList.includes(c.id))} results={results} linkedinAnalyses={linkedinAnalyses} onBack={() => setActiveTab('candidates')} />}

      {/* Modais Restaurados */}
      {showAddModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
           <div className="bg-white w-full max-w-2xl rounded-[32px] p-8 shadow-2xl overflow-hidden border">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">Novo Teste Personalizado</h3>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400"><X size={24} /></button>
              </div>
              <form onSubmit={handleCreateCandidate} className="space-y-4 max-h-[80vh] overflow-y-auto pr-2">
                 <div className="grid grid-cols-2 gap-4">
                   <input name="name" placeholder="Nome" required className="w-full p-3 bg-slate-50 border rounded-xl outline-none" />
                   <input name="email" type="email" placeholder="E-mail" required className="w-full p-3 bg-slate-50 border rounded-xl outline-none" />
                   <select name="module" className="w-full p-3 bg-slate-50 border rounded-xl outline-none">
                      {modules.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                   </select>
                   <select name="level" className="w-full p-3 bg-slate-50 border rounded-xl outline-none">
                      {Object.values(SeniorityLevel).map(l => <option key={l} value={l}>{l}</option>)}
                   </select>
                 </div>
                 <textarea name="jobContext" placeholder="Contexto da Vaga (Opcional)..." className="w-full p-3 bg-slate-50 border rounded-xl outline-none h-24" />
                 <button type="submit" disabled={isLoadingAction} className="w-full py-4 bg-blue-600 text-white font-black rounded-xl">
                    {isLoadingAction ? "Gerando Prova..." : "Criar Teste IA"}
                 </button>
              </form>
           </div>
        </div>
      )}

      {showAnalysisModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
           <div className="bg-white w-full max-w-md rounded-[32px] p-8 shadow-2xl overflow-hidden border">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">Análise LinkedIn</h3>
                <button onClick={() => setShowAnalysisModal(false)} className="text-slate-400"><X size={24} /></button>
              </div>
              <form onSubmit={handleCreateAnalysis} className="space-y-4">
                 <input name="linkedinUrl" placeholder="Link do Perfil LinkedIn" required className="w-full p-3 bg-slate-50 border rounded-xl outline-none" />
                 <button type="submit" disabled={isLoadingAction} className="w-full py-4 bg-[#0077b5] text-white font-black rounded-xl">
                    {isLoadingAction ? "Mapeando..." : "Iniciar Análise IA"}
                 </button>
              </form>
           </div>
        </div>
      )}

      {statusMessage && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[300] bg-slate-900 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4">
          <Loader2 className="animate-spin text-blue-400" size={20} />
          <span className="text-xs font-black uppercase tracking-widest">{statusMessage}</span>
        </div>
      )}
    </Layout>
  );
};

export default App;
