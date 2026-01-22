
import React, { useState, useEffect, useMemo, useCallback } from 'react';
// Fix: Corrected import path to parent directory for types
import { UserRole, Candidate, AssessmentTemplate, AssessmentResult, SeniorityLevel, BlockType, Question, ImplementationType, LinkedInAnalysis, SAPModule, Industry } from '../types';
// Fix: Corrected relative import paths for sibling components
import Layout from './Layout';
import Dashboard from './Dashboard';
import SettingsView from './SettingsView';
import QuestionBankView from './QuestionBankView';
import TemplatesView from './TemplatesView';
import CandidateReportView from './CandidateReportView';
import LinkedInAnalysisDetail from './LinkedInAnalysisDetail';
import ComparisonView from './ComparisonView';
import TestWelcome from './TestWelcome';
import TestRunner from './TestRunner';
// Fix: Corrected relative import paths for services in parent directory
import { db } from '../services/dbService';
import { analyzeLinkedInProfile, generateBulkQuestions, generateSAPScenario } from '../services/geminiService';
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
  Home,
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

  // Paginação State
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [searchTermAnalyses, setSearchTermAnalyses] = useState('');
  const [pendingAnalysisCandidateId, setPendingAnalysisCandidateId] = useState<string | null>(null);

  const initApp = useCallback(async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const candId = urlParams.get('test');
    const pathParts = window.location.pathname.split('/test/');
    const pathCandId = pathParts.length > 1 ? pathParts[1] : null;
    const finalCandId = candId || pathCandId;

    if (finalCandId) {
      setIsLoadingApp(true);
      try {
        const cand = await db.getCandidate(finalCandId);
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
        return; 
      }
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

  // Lógica de Filtro Aplicada antes da paginação
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

  const clearCandFilters = () => {
    setFilterCandModule('ALL');
    setFilterCandLevel('ALL');
    setFilterCandIndustry('ALL');
    setCurrentPage(1);
  };

  const filteredAnalyses = useMemo(() => {
    if (!linkedinAnalyses) return [];
    return linkedinAnalyses.filter(a => {
      const link = a.profileLink?.toLowerCase() || '';
      const mod = a.suggestedModule?.toLowerCase() || '';
      const search = searchTermAnalyses.toLowerCase();
      return link.includes(search) || mod.includes(search);
    }).sort((a, b) => new Date(b.analyzedAt || 0).getTime() - new Date(a.analyzedAt || 0).getTime());
  }, [linkedinAnalyses, searchTermAnalyses]);

  const selectedCandidatesForCompare = useMemo(() => 
    candidates.filter(c => compareList.includes(c.id)),
  [candidates, compareList]);

  const handleCopyLink = (link: string, id: string) => {
    let finalLink = link;
    if (link.includes('/test/')) {
      finalLink = `${window.location.origin}/?test=${id}`;
    } else if (!link.includes('?test=')) {
      finalLink = `${window.location.origin}/?test=${id}`;
    }
    
    navigator.clipboard.writeText(finalLink);
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

  const toggleCompare = (id: string) => {
    setCompareList(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const isEligibleForCompare = (candidate: Candidate) => {
    const hasResult = candidate.status === 'COMPLETED';
    const hasDisc = linkedinAnalyses.some(a => a.candidateId === candidate.id);
    return hasResult || hasDisc;
  };

  const handleCreateAnalysis = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const profileLink = formData.get('linkedinUrl') as string;
    if (!profileLink) return;
    
    setIsLoadingAction(true);
    setErrorMessage(null);
    setStatusMessage("A IA está decodificando o DNA profissional...");
    
    try {
      const newAnalysis = await analyzeLinkedInProfile(profileLink);
      if (pendingAnalysisCandidateId) {
        newAnalysis.candidateId = pendingAnalysisCandidateId;
      }
      const saveRes = await db.saveLinkedInAnalysis(newAnalysis);
      if (!saveRes.success) throw new Error(saveRes.error);

      await initApp();
      setShowAnalysisModal(false);
      setPendingAnalysisCandidateId(null);
      setSelectedAnalysisId(newAnalysis.id);
      setActiveTab('linkedin_detail');
    } catch (error: any) {
      console.error("Erro na análise DISC:", error);
      setErrorMessage(error.message || "Erro ao analisar perfil. Verifique o link e tente novamente.");
    } finally {
      setIsLoadingAction(false);
      setStatusMessage(null);
    }
  };

  const handleCreateCandidate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoadingAction(true);
    setStatusMessage("Desenhando Pack IA exclusivo...");
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const moduleId = formData.get('module') as string;
    const level = formData.get('level') as SeniorityLevel;
    const industryId = formData.get('industry') as string;
    const implType = formData.get('implType') as ImplementationType;
    const jobContext = formData.get('jobContext') as string;

    try {
      const counts = {
        [BlockType.MASTER_DATA]: 5, [BlockType.PROCESS]: 5,
        [BlockType.SOFT_SKILL]: 5, [BlockType.SAP_ACTIVATE]: 5,
        [BlockType.CLEAN_CORE]: 5
      };

      const newQuestions = await generateBulkQuestions(moduleId, industryId, level, implType, counts, jobContext);
      let scenarios: any[] = [];
      if (includeScenario) {
        setStatusMessage("Verificando banco de cenários...");
        const bankScenarios = await db.getBankScenarios();
        const existing = bankScenarios.find(s => 
          s.moduleId === moduleId && 
          s.level === level && 
          s.industry === industryId
        );

        if (existing) {
          setStatusMessage("Cenário padrão localizado...");
          scenarios = [existing];
        } else {
          setStatusMessage("Cenário inédito: Desenhando via IA...");
          const newScenario = await generateSAPScenario(moduleId, level, industryId, implType);
          await db.saveBankScenario(newScenario);
          scenarios = [newScenario];
        }
      }

      const templateId = `pack-${moduleId}-${level}-${Date.now()}`;
      await db.saveTemplate({
        id: templateId,
        name: `Pack IA: ${moduleId.toUpperCase()} ${level}`,
        moduleId, industryId, level, implementationType: implType,
        questions: newQuestions,
        scenarios,
        createdAt: new Date().toISOString()
      });

      const candidateId = `cand-${Date.now()}`;
      const testLink = `${window.location.origin}/?test=${candidateId}`;
      await db.saveCandidate({
        id: candidateId, name, email, appliedModule: moduleId, appliedIndustry: industryId, appliedLevel: level,
        implementationType: implType, status: 'PENDING', templateId,
        testLink,
        createdAt: new Date().toISOString(),
        jobContext
      });
      
      await initApp();
      setShowAddModal(false);
    } catch (error: any) {
      console.error("Erro na criação:", error);
      alert("Erro ao criar teste: " + error.message);
    } finally {
      setIsLoadingAction(false);
      setStatusMessage(null);
    }
  };

  const deleteCandidate = async (id: string) => {
    if (confirm("Excluir candidato e todos os seus resultados?")) {
      try {
        await db.deleteCandidate(id);
        await initApp();
      } catch (err: any) {
        alert("Erro ao excluir candidato: " + err.message);
      }
    }
  };

  const deleteAnalysis = async (id: string) => {
    if (confirm("Excluir esta análise permanentemente?")) {
      setIsLoadingAction(true);
      setStatusMessage("Excluindo análise...");
      try {
        const result = await db.deleteLinkedInAnalysis(id);
        if (result.success) {
          await initApp();
        } else {
          alert("Erro ao excluir análise: " + result.error);
        }
      } catch (err: any) {
        alert("Erro inesperado ao excluir análise: " + err.message);
      } finally {
        setIsLoadingAction(false);
        setStatusMessage(null);
      }
    }
  };

  if (candidateMode) {
    if (isLoadingApp) return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8">
        <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
        <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Carregando Prova...</p>
      </div>
    );

    if (isTestComplete) return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-xl w-full bg-white rounded-[40px] shadow-2xl border border-slate-100 p-12 text-center">
          <CheckCircle2 size={64} className="text-green-500 mx-auto mb-6" />
          <h2 className="text-3xl font-black text-slate-900 mb-4">Teste Concluído</h2>
          <p className="text-slate-600 font-medium mb-8">Esta avaliação já foi finalizada. Obrigado por participar do nosso processo de seleção!</p>
          <div className="pt-8 border-t border-slate-50">
             <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Sua resposta foi enviada ao RH.</p>
             <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">Você já pode fechar esta janela com segurança.</p>
          </div>
        </div>
      </div>
    );

    if (!templateMode) return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
        <AlertTriangle size={64} className="text-amber-500 mx-auto mb-6" />
        <h2 className="text-2xl font-black text-slate-900 mb-4">Modelo não encontrado</h2>
        <p className="text-slate-500 mb-8">Não conseguimos localizar o conteúdo deste teste. Contate o recrutador.</p>
      </div>
    );

    if (!testStarted) {
      return <TestWelcome candidate={candidateMode} template={templateMode} onStart={() => setTestStarted(true)} />;
    }

    return <TestRunner candidate={candidateMode} template={templateMode} onComplete={() => setIsTestComplete(true)} />;
  }

  return (
    <Layout userRole={userRole || UserRole.RH} activeTab={activeTab} setActiveTab={setActiveTab} onLogout={() => window.location.reload()}>
      {activeTab === 'dashboard' && <Dashboard onViewReport={(id) => { setSelectedCandidateId(id); setActiveTab('report'); }} />}
      
      {activeTab === 'candidates' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Candidatos</h2>
              <p className="text-sm text-slate-500 font-medium">Gestão de testes e links</p>
            </div>
            <div className="flex gap-3">
              {compareList.length > 0 && (
                <button onClick={() => setActiveTab('compare')} className="px-6 py-3 bg-indigo-600 text-white font-black rounded-2xl flex items-center gap-2 shadow-lg shadow-indigo-600/20 animate-in slide-in-from-right">
                  <Users size={20} /> Comparar ({compareList.length})
                </button>
              )}
              <button onClick={() => setShowAddModal(true)} className="px-6 py-3 bg-blue-600 text-white font-black rounded-2xl flex items-center gap-2 shadow-lg shadow-blue-600/20 active:scale-95 transition-all">
                <Plus size={20} /> Novo Teste
              </button>
            </div>
          </div>

          {/* BARRA DE FILTROS (RESTAURADO E ATUALIZADO CONFORME IMAGEM) */}
          <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Módulo</label>
              <select 
                value={filterCandModule} 
                onChange={(e) => { setFilterCandModule(e.target.value); setCurrentPage(1); }} 
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl font-bold outline-none focus:ring-2 focus:ring-blue-500 text-xs text-slate-700"
              >
                <option value="ALL">Todos os Módulos</option>
                {/* Fix: Explicitly type module for map callback to resolve 'unknown' type error */}
                {modules.map((m: SAPModule) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sênioridade</label>
              <select 
                value={filterCandLevel} 
                onChange={(e) => { setFilterCandLevel(e.target.value); setCurrentPage(1); }} 
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl font-bold outline-none focus:ring-2 focus:ring-blue-500 text-xs text-slate-700"
              >
                <option value="ALL">Qualquer</option>
                {Object.values(SeniorityLevel).map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Indústria</label>
              <select 
                value={filterCandIndustry} 
                onChange={(e) => { setFilterCandIndustry(e.target.value); setCurrentPage(1); }} 
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl font-bold outline-none focus:ring-2 focus:ring-blue-500 text-xs text-slate-700"
              >
                <option value="ALL">Todas</option>
                {industries.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
            </div>
            <button 
              onClick={clearCandFilters} 
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2"
            >
              <X size={14} /> Limpar Filtros
            </button>
          </div>

          <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  <tr className="border-b border-slate-100">
                    <th className="px-8 py-5 text-center w-12"><Check size={14} className="mx-auto" /></th>
                    <th className="px-4 py-5 text-center w-12">#</th>
                    <th className="px-8 py-5">Candidato</th>
                    <th className="px-8 py-5 text-center">Status</th>
                    <th className="px-8 py-5">Contexto</th>
                    <th className="px-8 py-5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {paginatedCandidates.length > 0 ? paginatedCandidates.map((c, idx) => {
                    const eligible = isEligibleForCompare(c);
                    const selected = compareList.includes(c.id);
                    return (
                      <tr key={c.id} className={`hover:bg-slate-50 transition-colors group ${selected ? 'bg-indigo-50/30' : ''}`}>
                        <td className="px-8 py-5 text-center">
                          <button onClick={() => toggleCompare(c.id)} disabled={!eligible} className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${selected ? 'bg-indigo-600 border-indigo-600 text-white' : !eligible ? 'bg-slate-50 border-slate-100 cursor-not-allowed opacity-30' : 'bg-white border-slate-200 hover:border-indigo-400'}`}>
                            {selected && <Check size={12} strokeWidth={4} />}
                          </button>
                        </td>
                        <td className="px-4 py-5 text-center text-slate-300 font-bold">{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                        <td className="px-8 py-5">
                          <div className="font-bold text-slate-800">{c.name}</div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{c.email}</div>
                        </td>
                        <td className="px-8 py-5 text-center">
                          <span className={`px-2.5 py-1 text-[9px] font-black rounded-lg border uppercase tracking-widest ${c.status === 'COMPLETED' ? 'bg-green-50 text-green-600 border-green-100' : c.status === 'IN_PROGRESS' ? 'bg-amber-600 text-amber-600 border-amber-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                            {c.status}
                          </span>
                        </td>
                        <td className="px-8 py-5">
                           <div className="flex gap-2">
                              <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-2 py-1 rounded uppercase tracking-tighter">{c.appliedModule}</span>
                              <span className="text-[10px] font-black text-blue-500 bg-blue-50 px-2 py-1 rounded uppercase tracking-tighter border border-blue-100">{c.appliedLevel}</span>
                           </div>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => handleCopyLink(c.testLink, c.id)} className={`p-2.5 rounded-xl border transition-all shadow-sm ${copyFeedback === c.id ? 'bg-green-600 border-green-700 text-white' : 'bg-white border-slate-100 text-slate-400 hover:text-blue-600 hover:border-blue-200'}`} title="Copiar link do teste">
                              {copyFeedback === c.id ? <Check size={16} /> : <Link2 size={16}/>}
                            </button>
                            <button onClick={() => {setSelectedCandidateId(c.id); setActiveTab('report');}} disabled={c.status !== 'COMPLETED'} className={`p-2.5 rounded-xl border transition-all shadow-sm ${c.status === 'COMPLETED' ? 'bg-white border-slate-100 text-slate-400 hover:text-green-600 hover:border-green-200' : 'bg-slate-50 border-transparent text-slate-200 cursor-not-allowed'}`} title="Ver Resultado">
                              <FileText size={16}/>
                            </button>
                            <button onClick={() => handleViewDISC(c)} className="p-2.5 bg-white border border-slate-100 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 rounded-xl transition-all shadow-sm" title="Ver ou Criar DISC">
                              <BrainCircuit size={16}/>
                            </button>
                            <button onClick={() => deleteCandidate(c.id)} className="p-2.5 bg-white border border-slate-100 text-slate-400 hover:text-red-500 hover:border-red-200 rounded-xl transition-all shadow-sm" title="Excluir">
                              <Trash2 size={16}/>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr><td colSpan={6} className="px-8 py-20 text-center text-slate-400 italic">Nenhum candidato encontrado para estes filtros.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="bg-slate-50/50 border-t border-slate-100 px-8 py-5 flex items-center justify-between">
              <select value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 outline-none">
                {[10, 50, 100].map(val => <option key={val} value={val}>{val}</option>)}
              </select>
              <div className="flex gap-2">
                <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-2 text-slate-400 hover:text-blue-600 disabled:opacity-30"><ChevronLeft size={20} /></button>
                <div className="flex items-center px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Pág {currentPage} de {totalPagesCandidates || 1}</div>
                <button disabled={currentPage >= totalPagesCandidates} onClick={() => setCurrentPage(p => p + 1)} className="p-2 text-slate-400 hover:text-blue-600 disabled:opacity-30"><ChevronRight size={20} /></button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'linkedin_analyses' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Análise DISC</h2>
              <p className="text-sm text-slate-500 font-medium italic">DNA comportamental via Inteligência Artificial</p>
            </div>
            <button onClick={() => { setPendingAnalysisCandidateId(null); setShowAnalysisModal(true); }} className="px-6 py-3 bg-indigo-600 text-white font-black rounded-2xl flex items-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-95 transition-all">
              <Linkedin size={20} /> Nova Análise
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
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

          <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center">
              <div className="relative max-w-md w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input value={searchTermAnalyses} onChange={(e) => setSearchTermAnalyses(e.target.value)} placeholder="Buscar perfil..." className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>
            
            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  <tr className="border-b border-slate-100">
                    <th className="px-8 py-5">Perfil LinkedIn</th>
                    <th className="px-8 py-5">Predominante</th>
                    <th className="px-8 py-5">Data</th>
                    <th className="px-8 py-5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredAnalyses.length > 0 ? filteredAnalyses.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="font-bold text-slate-800 flex items-center gap-2">
                          <Linkedin size={14} className="text-[#0077b5]" /> 
                          <span className="truncate max-w-[200px]">{a.profileLink}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-full border border-indigo-100 uppercase">
                          {a.disc?.predominant || 'N/A'}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-[10px] text-slate-400 font-bold uppercase">
                        {new Date(a.analyzedAt || 0).toLocaleDateString()}
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => {setSelectedAnalysisId(a.id); setActiveTab('linkedin_detail');}} className="p-2.5 text-slate-400 hover:text-indigo-600 bg-white border border-slate-100 rounded-xl transition-all shadow-sm"><Zap size={16}/></button>
                          <button onClick={(e) => { e.stopPropagation(); deleteAnalysis(a.id); }} className="p-2.5 text-slate-400 hover:text-red-500 bg-white border border-slate-100 rounded-xl transition-all shadow-sm"><Trash2 size={16}/></button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={4} className="px-8 py-20 text-center text-slate-400 italic">Nenhuma análise encontrada.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'report' && selectedCandidateId && <CandidateReportView candidateId={selectedCandidateId} onBack={() => setActiveTab('candidates')} />}
      {activeTab === 'linkedin_detail' && selectedAnalysisId && <LinkedInAnalysisDetail analysisId={selectedAnalysisId} onBack={() => setActiveTab('linkedin_analyses')} />}
      {activeTab === 'compare' && <ComparisonView candidates={selectedCandidatesForCompare} results={results} linkedinAnalyses={linkedinAnalyses} onBack={() => setActiveTab('candidates')} />}
      {activeTab === 'templates' && <TemplatesView />}
      {activeTab === 'bank' && <QuestionBankView />}
      {activeTab === 'config' && <SettingsView />}

      {/* Modal Nova Análise DISC */}
      {showAnalysisModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in duration-200 border border-slate-200">
            <div className="bg-[#0077b5] p-8 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <Linkedin size={24} />
                <h3 className="text-xl font-bold">Análise DISC IA</h3>
              </div>
              <button onClick={() => { setShowAnalysisModal(false); setPendingAnalysisCandidateId(null); }} className="text-white/60 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleCreateAnalysis} className="p-8 space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">URL do LinkedIn</label>
                <input 
                  autoFocus 
                  required 
                  name="linkedinUrl" 
                  placeholder="https://linkedin.com/in/perfil"
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-[#0077b5] transition-all" 
                />
                {pendingAnalysisCandidateId && (
                  <p className="text-[10px] text-blue-600 font-bold mt-2 flex items-center gap-1 italic">
                    <Info size={12} /> Esta análise será vinculada ao candidato selecionado.
                  </p>
                )}
              </div>
              
              {errorMessage && (
                <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-xs font-bold rounded-xl animate-in shake">
                  {errorMessage}
                </div>
              )}

              <button 
                disabled={isLoadingAction} 
                type="submit" 
                className="w-full py-5 bg-[#0077b5] text-white font-black rounded-2xl shadow-xl flex items-center justify-center gap-3 hover:bg-[#00669c] disabled:opacity-50 transition-all"
              >
                {isLoadingAction ? <RefreshCw className="animate-spin" /> : <Zap />}
                {isLoadingAction ? "Mapeando DNA..." : "Iniciar Análise Comportamental"}
              </button>
              <p className="text-[9px] text-center text-slate-400 font-bold uppercase tracking-widest">Utilizamos IA para ler dados públicos e traçar o perfil DISC.</p>
            </form>
          </div>
        </div>
      )}

      {/* Modal Adicionar Candidato */}
      {showAddModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in duration-200 border border-slate-200">
             <div className="bg-slate-900 p-8 flex items-center justify-between text-white">
                <div className="flex items-center gap-3">
                  <Wand2 className="text-blue-400" />
                  <h3 className="text-xl font-bold tracking-tight">Novo Teste Personalizado</h3>
                </div>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white transition-colors"><X size={24} /></button>
             </div>
             <form onSubmit={handleCreateCandidate} className="p-8 space-y-6 max-h-[85vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-1.5">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                     <input required name="name" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none" />
                   </div>
                   <div className="space-y-1.5">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail</label>
                     <input required type="email" name="email" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none" />
                   </div>
                   <div className="space-y-1.5">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Módulo SAP</label>
                     <select name="module" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold">
                       {/* Fix: Explicitly type module for map callback to resolve 'unknown' type error */}
                       {modules.map((m: SAPModule) => <option key={m.id} value={m.id}>{m.name}</option>)}
                     </select>
                   </div>
                   <div className="space-y-1.5">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sênioridade</label>
                     <select name="level" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold">
                       {Object.values(SeniorityLevel).map(l => <option key={l} value={l}>{l}</option>)}
                     </select>
                   </div>
                   <div className="space-y-1.5">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Indústria</label>
                     <select name="industry" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold">
                       {/* Fix: Explicitly type industry for map callback to resolve 'unknown' type error */}
                       {industries.map((i: Industry) => <option key={i.id} value={i.id}>{i.name}</option>)}
                     </select>
                   </div>
                   <div className="space-y-1.5">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Implementação</label>
                     <select name="implType" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold">
                       {Object.values(ImplementationType).map(t => <option key={t} value={t}>{t}</option>)}
                     </select>
                   </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Informações Específicas da Vaga (Contexto para IA)</label>
                  <textarea 
                    name="jobContext" 
                    placeholder="Ex: Vaga exige conhecimento profundo em Reforma Tributária brasileira ou integrações via SAP BTP com sistemas externos..." 
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none h-24 text-sm font-medium focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                  <p className="text-[9px] text-slate-400 font-bold uppercase italic">* A IA utilizará este campo para personalizar aproximadamente 20% das questões geradas.</p>
                </div>

                <div className="p-6 bg-blue-50/50 rounded-3xl border border-blue-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <BrainCircuit className="text-blue-600" />
                    <div>
                      <h4 className="text-xs font-black text-blue-900 uppercase">Gerar Cenário Prático Aberto</h4>
                      <p className="text-[10px] text-blue-600 font-bold uppercase tracking-tighter">A IA irá criar um caso de uso real para o candidato dissertar.</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => setIncludeScenario(!includeScenario)} className="p-1">
                    {includeScenario ? <ToggleRight size={40} className="text-blue-600" /> : <ToggleLeft size={40} className="text-slate-300" />}
                  </button>
                </div>

                <button disabled={isLoadingAction} type="submit" className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl shadow-xl flex items-center justify-center gap-3 hover:bg-blue-700 disabled:opacity-50">
                  {isLoadingAction ? <RefreshCw className="animate-spin" /> : <Sparkles />}
                  {isLoadingAction ? "Desenhando Prova..." : "Criar e Enviar Teste"}
                </button>
             </form>
          </div>
        </div>
      )}

      {/* Overlay de Status (Toast Global) */}
      {statusMessage && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[300] bg-slate-900 text-white px-8 py-4 rounded-2xl shadow-2xl border border-slate-700 animate-in slide-in-from-bottom-8 flex items-center gap-4">
          <Loader2 className="animate-spin text-blue-400" size={20} />
          <span className="text-xs font-black uppercase tracking-widest">{statusMessage}</span>
        </div>
      )}
    </Layout>
  );
};

export default App;
