
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { UserRole, Candidate, AssessmentTemplate, AssessmentResult, SeniorityLevel, BlockType, Question, ImplementationType, LinkedInAnalysis, SAPModule, Industry, Profile } from './types';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import SettingsView from './components/SettingsView';
import QuestionBankView from './components/QuestionBankView';
import TemplatesView from './components/TemplatesView';
import CandidateReportView from './components/CandidateReportView';
import LinkedInAnalysisDetail from './components/LinkedInAnalysisDetail';
import LinkedInAnalysisView from './components/LinkedInAnalysisView'; 
import ComplianceSecurityView from './components/ComplianceSecurityView';
import ComparisonView from './components/ComparisonView';
import TestWelcome from './components/TestWelcome';
import TestRunner from './components/TestRunner';
import Login from './components/Login';
import UserManagementView from './components/UserManagementView';
import { db } from './services/dbService';
import { analyzeLinkedInProfile, generateBulkQuestions, generateSAPScenario } from './services/geminiService';
import { 
  Plus, 
  Sparkles,
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
  AlertTriangle,
  CheckCircle2,
  Crown,
  Filter,
  Search,
  User
} from 'lucide-react';

const App: React.FC = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Estados de dados
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [linkedinAnalyses, setLinkedinAnalyses] = useState<LinkedInAnalysis[]>([]);
  const [modules, setModules] = useState<SAPModule[]>([]);
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [templates, setTemplates] = useState<AssessmentTemplate[]>([]);
  const [results, setResults] = useState<AssessmentResult[]>([]);
  const [isLoadingApp, setIsLoadingApp] = useState(true);

  // Estados de Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Filtros de Candidatos
  const [filterCandModule, setFilterCandModule] = useState<string>('ALL');
  const [filterCandLevel, setFilterCandLevel] = useState<string>('ALL');

  // Seleção e UI
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isLoadingAction, setIsLoadingAction] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [includeScenario, setIncludeScenario] = useState(true);
  
  // Estados de Prova (Modo Candidato)
  const [candidateMode, setCandidateMode] = useState<Candidate | null>(null);
  const [templateMode, setTemplateMode] = useState<AssessmentTemplate | null>(null);
  const [testStarted, setTestStarted] = useState(false);
  const [isTestComplete, setIsTestComplete] = useState(false);
  const [testNotFound, setTestNotFound] = useState(false);

  const loadInternalData = async () => {
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
    } catch (e) {
      console.error("Erro ao carregar dados:", e);
    }
  };

  const initApp = useCallback(async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const candId = urlParams.get('test');

    if (candId) {
      setIsAuthenticating(false);
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
        } else {
          setTestNotFound(true);
        }
      } catch (e) { 
        setTestNotFound(true);
      } finally { 
        setIsLoadingApp(false); 
      }
      return; 
    }

    setIsAuthenticating(true);
    setIsLoadingApp(true);
    try {
      const currentProfile = await db.getCurrentProfile();
      if (currentProfile) {
        setProfile(currentProfile);
        await loadInternalData();
      } else {
        setProfile(null);
      }
    } catch (e) {
      setProfile(null);
    } finally {
      setIsAuthenticating(false);
      setIsLoadingApp(false);
    }
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (!urlParams.get('test')) {
      const { data: { subscription } } = db.client.auth.onAuthStateChange((event) => {
        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
          initApp();
        } else if (event === 'SIGNED_OUT') {
          setProfile(null);
          setIsAuthenticating(false);
          setIsLoadingApp(false);
        }
      });
      return () => subscription.unsubscribe();
    } else {
      initApp();
    }
  }, [initApp]);

  const handleLogout = async () => {
    await db.signOut();
  };

  const hasAccess = (slug: string) => {
    if (activeTab === 'compliance') return true;
    return profile?.perfil?.funcionalidades?.includes(slug);
  };

  const handleCopyLink = (id: string) => {
    const link = `${window.location.origin}/?test=${id}`;
    navigator.clipboard.writeText(link);
    setCopyFeedback(id);
    setTimeout(() => setCopyFeedback(null), 2000);
  };

  const handleCreateCandidate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoadingAction(true);
    setStatusMessage("A IA está desenhando as questões...");
    const formData = new FormData(e.currentTarget);
    try {
      const name = formData.get('name') as string;
      const email = formData.get('email') as string;
      const moduleId = formData.get('module') as string;
      const level = formData.get('level') as SeniorityLevel;
      const industryId = formData.get('industry') as string;
      const implType = formData.get('implType') as ImplementationType;
      const jobContext = formData.get('jobContext') as string;

      const counts = {
        [BlockType.MASTER_DATA]: 5, [BlockType.PROCESS]: 5,
        [BlockType.SOFT_SKILL]: 5, [BlockType.SAP_ACTIVATE]: 5,
        [BlockType.CLEAN_CORE]: 5
      };

      const newQuestions = await generateBulkQuestions(moduleId, industryId, level, implType, counts, jobContext);
      let scenarios: any[] = [];
      if (includeScenario) {
        const newScenario = await generateSAPScenario(moduleId, level, industryId, implType);
        scenarios = [newScenario];
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
      await db.saveCandidate({
        id: candidateId, name, email, appliedModule: moduleId, appliedIndustry: industryId, appliedLevel: level,
        implementationType: implType, status: 'PENDING', templateId,
        testLink: `${window.location.origin}/?test=${candidateId}`,
        createdAt: new Date().toISOString(),
        jobContext
      });
      
      await loadInternalData();
      setShowAddModal(false);
    } catch (error: any) {
      alert("Erro ao criar candidato: " + error.message);
    } finally {
      setIsLoadingAction(false);
      setStatusMessage(null);
    }
  };

  const filteredCands = useMemo(() => {
    return candidates.filter(c => {
      const matchM = filterCandModule === 'ALL' || c.appliedModule === filterCandModule;
      const matchL = filterCandLevel === 'ALL' || c.appliedLevel === filterCandLevel;
      return matchM && matchL;
    });
  }, [candidates, filterCandModule, filterCandLevel]);

  const totalPages = Math.ceil(filteredCands.length / itemsPerPage);
  const paginatedCands = useMemo(() => {
    return filteredCands.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [filteredCands, currentPage, itemsPerPage]);

  const handlePrevPage = () => setCurrentPage(p => Math.max(1, p - 1));
  const handleNextPage = () => setCurrentPage(p => Math.min(totalPages, p + 1));

  const isCandidato = !!new URLSearchParams(window.location.search).get('test');
  if (isLoadingApp || (isAuthenticating && !isCandidato)) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 text-center">
      <Loader2 className="animate-spin text-blue-600 mb-6" size={56} />
      <p className="font-black text-slate-900 uppercase tracking-widest text-[10px]">Sincronizando Sistema...</p>
    </div>
  );

  if (candidateMode || testNotFound) {
    if (testNotFound) return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
        <AlertTriangle size={64} className="text-amber-500 mb-6" />
        <h2 className="text-2xl font-black text-slate-900">Link Inválido</h2>
      </div>
    );
    if (isTestComplete) return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
        <CheckCircle2 size={64} className="text-green-500 mx-auto mb-6" />
        <h2 className="text-3xl font-black text-slate-900">Avaliação Concluída</h2>
      </div>
    );
    if (!templateMode) return <div className="p-20 text-center font-bold">Erro de estrutura.</div>;
    return !testStarted ? <TestWelcome candidate={candidateMode!} template={templateMode} onStart={() => setTestStarted(true)} /> : <TestRunner candidate={candidateMode!} template={templateMode} onComplete={() => setIsTestComplete(true)} />;
  }

  if (!profile) return <Login onLoginSuccess={initApp} />;

  return (
    <Layout profile={profile} activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout}>
      {profile.perfil_id === 'super-admin-fixed' && (
        <div className="mb-8 p-6 bg-blue-700 rounded-[24px] text-white flex items-center gap-4 shadow-xl border border-blue-500">
          <div className="p-3 bg-white/20 rounded-xl"><Crown size={28} /></div>
          <div><h4 className="font-black text-sm uppercase tracking-widest">Super Admin</h4><p className="text-xs font-medium text-blue-100">{profile.email}</p></div>
        </div>
      )}

      {activeTab === 'dashboard' && hasAccess('dashboard') && <Dashboard onViewReport={(id) => { setSelectedCandidateId(id); setActiveTab('report'); }} />}
      
      {activeTab === 'candidates' && hasAccess('candidates') && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
             <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Candidatos</h2>
                <p className="text-slate-500 font-medium">Gestão de talentos e avaliações técnicas de alto nível</p>
             </div>
             <button onClick={() => setShowAddModal(true)} className="px-6 py-4 bg-blue-600 text-white font-black rounded-[20px] flex items-center gap-2 shadow-xl shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95">
                <Plus size={20} /> Novo Teste IA
             </button>
          </div>

          {/* BARRA DE FILTROS AVANÇADA */}
          <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                   <Filter size={12} /> Módulo SAP
                </label>
                <select 
                  value={filterCandModule} 
                  onChange={(e) => {setFilterCandModule(e.target.value); setCurrentPage(1);}} 
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-xs outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                >
                  <option value="ALL">Todos os Módulos</option>
                  {modules.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                   <Crown size={12} /> Senioridade
                </label>
                <select 
                  value={filterCandLevel} 
                  onChange={(e) => {setFilterCandLevel(e.target.value); setCurrentPage(1);}} 
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-xs outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                >
                  <option value="ALL">Todas as Senioridades</option>
                  {Object.values(SeniorityLevel).map(l => <option key={l} value={l}>{l}</option>)}
                </select>
             </div>
             <div className="flex items-end">
                <button 
                  onClick={() => {setFilterCandModule('ALL'); setFilterCandLevel('ALL'); setCurrentPage(1);}} 
                  className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-500 font-black rounded-2xl text-[10px] uppercase tracking-widest transition-all"
                >
                  Limpar Filtros
                </button>
             </div>
          </div>

          {/* TABELA DE CANDIDATOS ESTILIZADA */}
          <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
             <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100">
                      <tr>
                          <th className="px-10 py-6">Candidato / Identificação</th>
                          <th className="px-10 py-6 text-center">Status Global</th>
                          <th className="px-10 py-6">Foco Técnico</th>
                          <th className="px-10 py-6 text-right">Ações de Gestão</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {paginatedCands.length > 0 ? paginatedCands.map(c => {
                          const hasAnalysis = linkedinAnalyses.find(a => 
                            a.candidateId === c.id || 
                            a.profileLink.toLowerCase().includes(c.name.toLowerCase().split(' ')[0])
                          );
                          return (
                            <tr key={c.id} className="hover:bg-slate-50/50 transition-colors group">
                              <td className="px-10 py-6">
                                  <div className="flex items-center gap-4">
                                    <div className="w-11 h-11 bg-blue-100 text-blue-600 rounded-[14px] flex items-center justify-center font-black shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all">
                                      {c.name.charAt(0)}
                                    </div>
                                    <div>
                                      <div className="font-bold text-slate-900 text-sm">{c.name}</div>
                                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{c.email}</div>
                                    </div>
                                  </div>
                              </td>
                              <td className="px-10 py-6 text-center">
                                  <span className={`px-3 py-1 text-[9px] font-black rounded-xl border uppercase tracking-widest shadow-sm ${
                                    c.status === 'COMPLETED' ? 'bg-green-50 text-green-600 border-green-100' : 
                                    c.status === 'IN_PROGRESS' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                                    'bg-blue-50 text-blue-600 border-blue-100'
                                  }`}>
                                    {c.status}
                                  </span>
                              </td>
                              <td className="px-10 py-6">
                                  <div className="flex flex-wrap gap-2">
                                    <span className="text-[9px] font-black text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg uppercase tracking-tight border border-slate-200">{c.appliedModule}</span>
                                    <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg uppercase tracking-tight border border-blue-100">{c.appliedLevel}</span>
                                  </div>
                              </td>
                              <td className="px-10 py-6 text-right">
                                  <div className="flex justify-end gap-2.5">
                                    <button 
                                      onClick={() => {
                                        if (hasAnalysis) {
                                          setSelectedAnalysisId(hasAnalysis.id);
                                          setActiveTab('linkedin_detail');
                                        } else {
                                          setActiveTab('linkedin_analyses');
                                        }
                                      }} 
                                      className={`p-3 rounded-2xl border transition-all ${hasAnalysis ? 'bg-indigo-50 border-indigo-200 text-indigo-600 shadow-md shadow-indigo-100' : 'bg-white border-slate-100 text-slate-300 hover:text-indigo-600 hover:border-indigo-100 hover:bg-indigo-50'}`}
                                      title={hasAnalysis ? "Ver Análise DISC Completa" : "Iniciar Análise Comportamental"}
                                    >
                                      <BrainCircuit size={16}/>
                                    </button>
                                    
                                    <button 
                                      onClick={() => handleCopyLink(c.id)} 
                                      className={`p-3 rounded-2xl border transition-all ${copyFeedback === c.id ? 'bg-green-600 border-green-700 text-white shadow-lg shadow-green-200' : 'bg-white border-slate-100 text-slate-400 hover:text-blue-600 hover:bg-blue-50'}`} 
                                      title="Copiar Link Seguro para o Candidato"
                                    >
                                      {copyFeedback === c.id ? <Check size={16} /> : <Link2 size={16}/>}
                                    </button>
                                    
                                    <button 
                                      onClick={() => {setSelectedCandidateId(c.id); setActiveTab('report');}} 
                                      disabled={c.status !== 'COMPLETED'} 
                                      className="p-3 bg-white border border-slate-100 text-slate-400 hover:text-green-600 hover:bg-green-50 hover:border-green-100 rounded-2xl disabled:opacity-20 shadow-sm transition-all" 
                                      title="Ver Relatório de Desempenho"
                                    >
                                      <FileText size={16}/>
                                    </button>
                                    
                                    <button 
                                      onClick={async () => {if(confirm("Deseja realmente excluir este candidato e todos os seus dados? Esta ação é irreversível.")){await db.deleteCandidate(c.id); loadInternalData();}}} 
                                      className="p-3 bg-white border border-slate-100 text-slate-400 hover:text-red-500 hover:bg-red-50 hover:border-red-100 rounded-2xl shadow-sm transition-all" 
                                      title="Excluir Registro permanentemente"
                                    >
                                      <Trash2 size={16}/>
                                    </button>
                                  </div>
                              </td>
                            </tr>
                          );
                      }) : (
                        <tr>
                          <td colSpan={4} className="px-10 py-32 text-center">
                            <div className="flex flex-col items-center gap-4 text-slate-300">
                                <Search size={48} className="opacity-20" />
                                <p className="font-bold italic text-sm">Nenhum candidato localizado com os filtros ativos.</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                </table>
             </div>
             
             {/* BARRA DE PAGINAÇÃO INTEGRADA */}
             {totalPages > 1 && (
               <div className="px-10 py-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Página {currentPage} de {totalPages}</span>
                  <div className="flex gap-3">
                     <button 
                       onClick={handlePrevPage} 
                       disabled={currentPage === 1} 
                       className="p-3 bg-white border border-slate-100 rounded-[14px] text-slate-400 hover:text-blue-600 hover:border-blue-100 disabled:opacity-30 transition-all shadow-sm"
                     >
                        <ChevronLeft size={18} />
                     </button>
                     <button 
                       onClick={handleNextPage} 
                       disabled={currentPage === totalPages} 
                       className="p-3 bg-white border border-slate-100 rounded-[14px] text-slate-400 hover:text-blue-600 hover:border-blue-100 disabled:opacity-30 transition-all shadow-sm"
                     >
                        <ChevronRight size={18} />
                     </button>
                  </div>
               </div>
             )}
          </div>
        </div>
      )}

      {activeTab === 'linkedin_analyses' && hasAccess('linkedin_analyses') && (
        <LinkedInAnalysisView onViewDetail={(id) => { setSelectedAnalysisId(id); setActiveTab('linkedin_detail'); }} />
      )}
      
      {activeTab === 'templates' && hasAccess('templates') && <TemplatesView />}
      {activeTab === 'access_management' && hasAccess('access_management') && <UserManagementView />}
      {activeTab === 'config' && hasAccess('config') && <SettingsView />}
      {activeTab === 'bank' && hasAccess('bank') && <QuestionBankView />}
      {activeTab === 'report' && selectedCandidateId && <CandidateReportView candidateId={selectedCandidateId} onBack={() => setActiveTab('candidates')} />}
      {activeTab === 'linkedin_detail' && selectedAnalysisId && <LinkedInAnalysisDetail analysisId={selectedAnalysisId} onBack={() => setActiveTab('linkedin_analyses')} />}
      
      {activeTab === 'compliance' && <ComplianceSecurityView />}

      {/* MODAL ADICIONAR CANDIDATO (ALTA FIDELIDADE) */}
      {showAddModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
           <div className="bg-white w-full max-w-3xl rounded-[40px] shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in duration-300 flex flex-col max-h-[90vh]">
              <div className="bg-blue-600 p-8 flex items-center justify-between text-white shrink-0">
                 <div className="flex items-center gap-4">
                   <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                      <Plus size={24} />
                   </div>
                   <div>
                      <h3 className="text-2xl font-black tracking-tight">Nova Avaliação IA</h3>
                      <p className="text-blue-100 text-[10px] font-black uppercase tracking-widest mt-0.5">Configuração estratégica de teste</p>
                   </div>
                 </div>
                 <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={28} /></button>
              </div>
              <form onSubmit={handleCreateCandidate} className="p-10 space-y-8 overflow-y-auto">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo do Candidato</label>
                      <input required name="name" placeholder="Ex: Nelson Neto" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail para Envio do Link</label>
                      <input required type="email" name="email" placeholder="nelson@exemplo.com" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Especialidade (Módulo SAP)</label>
                      <select name="module" required className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-black text-xs transition-all">
                        {modules.map(m => <option key={m.id} value={m.id}>{m.name.toUpperCase()}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nível de Experiência Alvo</label>
                      <select name="level" required className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-black text-xs transition-all">
                        {Object.values(SeniorityLevel).map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Setor de Atuação (Indústria)</label>
                      <select name="industry" required className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-black text-xs transition-all">
                        {industries.map(i => <option key={i.id} value={i.id}>{i.name.toUpperCase()}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Modelo de Deployment</label>
                      <select name="implType" required className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-black text-xs transition-all">
                        {Object.values(ImplementationType).map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
                      </select>
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contexto Específico do Projeto / Vaga</label>
                    <textarea name="jobContext" placeholder="Descreva os desafios técnicos que o profissional enfrentará no dia-a-dia para que a IA gere questões hiper-personalizadas..." className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-medium h-28 transition-all" />
                 </div>

                 <div className="flex items-center gap-6 p-6 bg-blue-50 rounded-[32px] border border-blue-100">
                    <div onClick={() => setIncludeScenario(!includeScenario)} className="cursor-pointer">
                      {includeScenario ? <ToggleRight className="text-blue-600" size={44} /> : <ToggleLeft className="text-slate-300" size={44} />}
                    </div>
                    <div>
                       <h4 className="text-xs font-black text-blue-900 uppercase tracking-widest">Incluir Caso Prático (Case Study)</h4>
                       <p className="text-[10px] text-blue-700 font-medium mt-1">A IA criará um desafio de arquitetura aberto para avaliar raciocínio estratégico e resolução de problemas.</p>
                    </div>
                 </div>

                 <button disabled={isLoadingAction} type="submit" className="w-full py-6 bg-blue-600 text-white font-black rounded-3xl shadow-2xl shadow-blue-600/30 flex items-center justify-center gap-4 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 text-lg uppercase tracking-widest">
                   {isLoadingAction ? <Loader2 className="animate-spin" /> : <Sparkles />}
                   {isLoadingAction ? "Desenhando Teste Estratégico..." : "Gerar Teste e Ativar Candidato"}
                 </button>
              </form>
           </div>
        </div>
      )}

      {/* OVERLAY DE STATUS GLOBAL */}
      {statusMessage && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[300] bg-slate-900 text-white px-10 py-5 rounded-[24px] shadow-2xl flex items-center gap-5 border border-slate-700 animate-in slide-in-from-bottom-6 duration-500">
          <div className="p-3 bg-blue-600 rounded-xl">
            <Loader2 className="animate-spin text-white" size={24} />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest block text-blue-400">Processamento IA Delaware</span>
            <span className="text-sm font-bold">{statusMessage}</span>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;
