
import React, { useState, useEffect } from 'react';
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
import { db } from './services/dbService';
import { generateDynamicQuestions, analyzeLinkedInProfile } from './services/geminiService';
import { 
  Plus, 
  Copy, 
  RefreshCw,
  Sparkles,
  FileText,
  Linkedin,
  Zap,
  Loader2,
  AlertTriangle,
  ExternalLink,
  BrainCircuit,
  Search,
  X,
  History,
  CheckCircle2,
  Trash2,
  CloudOff,
  Cloud,
  Wifi,
  WifiOff
} from 'lucide-react';
import { BLOCK_WEIGHTS } from './constants';

const App: React.FC = () => {
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [linkedinAnalyses, setLinkedinAnalyses] = useState<LinkedInAnalysis[]>([]);
  const [modules, setModules] = useState<SAPModule[]>([]);
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [templates, setTemplates] = useState<AssessmentTemplate[]>([]);
  const [isLoadingApp, setIsLoadingApp] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  
  const [showWelcomeScreen, setShowWelcomeScreen] = useState(false);
  const [isTakingTest, setIsTakingTest] = useState(false);
  const [currentCandidate, setCurrentCandidate] = useState<Candidate | null>(null);
  const [currentTemplate, setCurrentTemplate] = useState<AssessmentTemplate | null>(null);
  
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showLinkedInModal, setShowLinkedInModal] = useState(false);
  const [isAnalyzingLinkedIn, setIsAnalyzingLinkedIn] = useState(false);
  const [isLoadingAction, setIsLoadingAction] = useState(false);

  const [selectedModule, setSelectedModule] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('JUNIOR');
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [selectedImpl, setSelectedImpl] = useState(ImplementationType.PRIVATE);
  const [existingTemplate, setExistingTemplate] = useState<AssessmentTemplate | null>(null);

  const [syncedIds, setSyncedIds] = useState<Set<string>>(new Set());

  const checkCandidateStatus = async (candId: string) => {
    try {
      const cand = await db.getCandidate(candId);
      if (cand) {
        if (cand.status === 'COMPLETED') {
          setDbError("Avaliação já concluída.");
          return;
        }
        
        const allTemplates = await db.getTemplates();
        const template = allTemplates.find(t => t.id === cand.templateId) || 
                         allTemplates.find(t => t.id.includes(cand.id)) || 
                         allTemplates.find(t => t.moduleId === cand.appliedModule && t.level === cand.appliedLevel);
        
        if (template) {
          setCurrentCandidate(cand);
          setCurrentTemplate(template);
          setShowWelcomeScreen(true);
          setDbError(null);
        } else {
          setDbError("Modelo de avaliação não encontrado no servidor para este candidato.");
        }
      } else {
        setDbError("Candidato não encontrado no servidor Supabase.");
      }
    } catch (error) {
      setDbError("Erro de comunicação com o servidor.");
    }
  };

  useEffect(() => {
    const initApp = async () => {
      const hash = window.location.hash;
      const isTestRoute = hash.includes('/test/');

      if (isTestRoute) {
        setUserRole(UserRole.CANDIDATE);
        const parts = hash.split('/');
        const candId = parts[parts.indexOf('test') + 1];
        if (!candId) {
          setDbError("URL Inválida.");
          setIsLoadingApp(false);
          return;
        }
        await checkCandidateStatus(candId);
        setIsLoadingApp(false);
      } else {
        try {
          const [cands, analyses, mods, inds, tmpls] = await Promise.all([
            db.getCandidates(), 
            db.getLinkedInAnalyses(),
            db.getModules(),
            db.getIndustries(),
            db.getTemplates()
          ]);
          setCandidates(cands);
          setLinkedinAnalyses(analyses);
          setModules(mods);
          setIndustries(inds);
          setTemplates(tmpls);
          setSyncedIds(new Set(cands.map(c => c.id)));
          
          if (mods.length > 0) setSelectedModule(mods[0].id);
          if (inds.length > 0) setSelectedIndustry(inds[0].name);
          setUserRole(UserRole.ADMIN);
        } catch (error) { 
          setUserRole(UserRole.ADMIN); 
        } finally { 
          setIsLoadingApp(false); 
        }
      }
    };
    initApp();
  }, []);

  // Lógica de detecção de template existente aprimorada
  useEffect(() => {
    if (showAddModal) {
      const match = templates.find(t => 
        (t.moduleId === selectedModule) && 
        (t.level === selectedLevel) && 
        (t.industryId === selectedIndustry) && 
        (t.implementationType === selectedImpl)
      );
      setExistingTemplate(match || null);
    }
  }, [selectedModule, selectedLevel, selectedIndustry, selectedImpl, showAddModal, templates]);

  const handleCreateTest = async (candData: any) => {
    setIsLoadingAction(true);
    try {
      const { module, industry, level, implType, name, email } = candData;
      const candId = `cand-${Date.now()}`;
      let finalTemplateId = '';

      if (existingTemplate) {
        finalTemplateId = existingTemplate.id;
      } else {
        const blocks = [BlockType.MASTER_DATA, BlockType.PROCESS, BlockType.SOFT_SKILL, BlockType.SAP_ACTIVATE, BlockType.CLEAN_CORE];
        const allBankQuestions = await db.getBankQuestions();
        const bankQuestions = allBankQuestions.filter(q => q.module === module && q.seniority === level);
        
        // Paralelizar a geração de perguntas dinâmicas por bloco
        const blockPromises = blocks.map(async (block) => {
          const fromBank = bankQuestions.filter(q => q.block === block).sort(() => 0.5 - Math.random()).slice(0, 8);
          const dynamicCount = 10 - fromBank.length;
          let dynamic: Question[] = [];
          
          if (dynamicCount > 0) {
            dynamic = await generateDynamicQuestions(module, industry, level as SeniorityLevel, implType as ImplementationType, block, dynamicCount);
          }
          
          const weight = (BLOCK_WEIGHTS[module] || BLOCK_WEIGHTS['default'])[block];
          return [...fromBank, ...dynamic].map((q, idx) => ({ 
            ...q, 
            id: `q-${candId}-${block}-${idx}`, 
            weight 
          }));
        });

        const results = await Promise.all(blockPromises);
        const allTestQuestions = results.flat();

        const template: AssessmentTemplate = {
          id: `tmpl-${candId}`,
          name: `Avaliação ${module.toUpperCase()} - ${name}`,
          moduleId: module, 
          industryId: industry, 
          level: level as SeniorityLevel,
          implementationType: implType as ImplementationType, 
          questions: allTestQuestions,
          createdAt: new Date().toISOString()
        };
        
        const templateSync = await db.saveTemplate(template);
        if (!templateSync.success) throw new Error(templateSync.error);
        
        finalTemplateId = template.id;
        // Atualizar lista local de templates
        setTemplates(await db.getTemplates());
      }

      const newCand: Candidate = {
        id: candId, 
        name, 
        email, 
        appliedModule: module, 
        appliedIndustry: industry, 
        appliedLevel: level as SeniorityLevel,
        implementationType: implType as ImplementationType, 
        status: 'PENDING', 
        templateId: finalTemplateId,
        testLink: `${window.location.origin}${window.location.pathname}#/test/${candId}`,
        createdAt: new Date().toISOString()
      };

      const candSync = await db.saveCandidate(newCand);
      
      if (candSync.success) {
        setCandidates(prev => [newCand, ...prev]);
        setSyncedIds(prev => new Set([...prev, candId]));
        setShowAddModal(false);
        alert('Teste criado com sucesso!');
      } else {
        throw new Error(candSync.error);
      }
    } catch (e: any) {
      console.error("Erro no handleCreateTest:", e);
      alert(`Falha na criação: ${e.message || 'Erro desconhecido'}`);
    } finally { 
      setIsLoadingAction(false); 
    }
  };

  const handleSyncCandidate = async (cand: Candidate) => {
    setIsLoadingAction(true);
    const sync = await db.saveCandidate(cand);
    if (sync.success) {
       setSyncedIds(prev => new Set([...prev, cand.id]));
       alert("Sincronizado!");
    } else {
       alert(`Falha: ${sync.error}`);
    }
    setIsLoadingAction(false);
  };

  const handleDeleteCandidate = async (id: string, name: string) => {
    if (confirm(`Excluir ${name}?`)) {
      await db.deleteCandidate(id);
      setCandidates(prev => prev.filter(c => c.id !== id));
    }
  };

  const handleAnalyzeLinkedIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const profileLink = formData.get('profileLink') as string;
    if (!profileLink) return;
    setIsAnalyzingLinkedIn(true);
    try {
      const analysis = await analyzeLinkedInProfile(profileLink);
      await db.saveLinkedInAnalysis(analysis);
      setLinkedinAnalyses(await db.getLinkedInAnalyses());
      setShowLinkedInModal(false);
      setSelectedAnalysisId(analysis.id);
      setActiveTab('linkedin_detail');
    } catch (error) {
      alert("Erro ao analisar perfil.");
    } finally { setIsAnalyzingLinkedIn(false); }
  };

  if (isLoadingApp) return <div className="h-screen flex flex-col items-center justify-center bg-slate-900 text-white gap-4"><Loader2 className="animate-spin" /><p>Conectando...</p></div>;
  
  if (dbError) return (
    <div className="h-screen flex flex-col items-center justify-center p-8 text-center bg-slate-50">
      <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6"><WifiOff className="text-red-500" size={40} /></div>
      <h2 className="text-2xl font-bold text-slate-800 mb-2">Avaliação Indisponível</h2>
      <p className="text-slate-500 max-w-sm mb-8">{dbError}</p>
      <button onClick={() => window.location.reload()} className="px-8 py-3 bg-slate-900 text-white font-bold rounded-2xl flex items-center gap-2"><RefreshCw size={18} /> Tentar Novamente</button>
    </div>
  );

  if (userRole === UserRole.CANDIDATE && currentCandidate && currentTemplate) {
    if (showWelcomeScreen) return <TestWelcome candidate={currentCandidate} template={currentTemplate} onStart={() => { setShowWelcomeScreen(false); setIsTakingTest(true); }} />;
    if (isTakingTest) return <TestRunner candidate={currentCandidate} template={currentTemplate} onComplete={() => window.location.reload()} />;
  }

  return (
    <Layout userRole={userRole || UserRole.RH} activeTab={activeTab} setActiveTab={setActiveTab} onLogout={() => window.location.reload()}>
      {activeTab === 'dashboard' && <Dashboard onViewReport={(id) => { setSelectedCandidateId(id); setActiveTab('report'); }} />}
      
      {activeTab === 'candidates' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-3xl font-bold">Candidatos</h2>
            <button onClick={() => setShowAddModal(true)} className="px-6 py-3 bg-blue-600 text-white font-bold rounded-2xl shadow-lg flex items-center gap-2 hover:bg-blue-700 transition-all">
              <Plus size={20} /> Novo Teste
            </button>
          </div>
          <div className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400">
                <tr><th className="px-8 py-4">Sincronismo</th><th className="px-8 py-4">Candidato</th><th className="px-8 py-4">Perfil</th><th className="px-8 py-4">Status</th><th className="px-8 py-4 text-right">Ações</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {candidates.length === 0 ? (
                  <tr><td colSpan={5} className="px-8 py-20 text-center text-slate-400 italic">Nenhum candidato.</td></tr>
                ) : (
                  candidates.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2">
                          {syncedIds.has(c.id) ? (
                            <div className="flex items-center gap-2 text-green-500 font-bold text-[10px] uppercase"><Cloud size={18} /> <span>OK</span></div>
                          ) : (
                            <button onClick={() => handleSyncCandidate(c)} className="flex items-center gap-2 text-red-500 font-bold text-[10px] uppercase animate-pulse"><CloudOff size={18} /> <span>Local</span></button>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-5"><div className="font-bold">{c.name}</div><div className="text-xs text-slate-400">{c.email}</div></td>
                      <td className="px-8 py-5"><span className="px-2 py-1 bg-slate-100 text-[10px] font-bold rounded uppercase">{c.appliedModule} - {c.appliedLevel}</span></td>
                      <td className="px-8 py-5"><span className={`text-[10px] font-black uppercase ${c.status === 'COMPLETED' ? 'text-green-600' : 'text-amber-600'}`}>{c.status}</span></td>
                      <td className="px-8 py-5 text-right flex justify-end gap-2">
                        <button onClick={() => { navigator.clipboard.writeText(c.testLink); alert('Link copiado!'); }} className="p-2 bg-slate-50 rounded-lg hover:bg-blue-50 text-blue-600"><Copy size={16} /></button>
                        {c.status === 'COMPLETED' && <button onClick={() => { setSelectedCandidateId(c.id); setActiveTab('report'); }} className="p-2 bg-slate-50 rounded-lg hover:bg-green-50 text-green-600"><ExternalLink size={16} /></button>}
                        <button onClick={() => handleDeleteCandidate(c.id, c.name)} className="p-2 bg-slate-50 rounded-lg hover:bg-red-50 text-red-400 opacity-0 group-hover:opacity-100"><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'linkedin_analyses' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-3xl font-bold">Análise DISC LinkedIn</h2>
            <button onClick={() => setShowLinkedInModal(true)} className="px-6 py-3 bg-[#0077b5] text-white font-bold rounded-2xl shadow-lg flex items-center gap-2 hover:bg-[#005c8a] transition-all"><Linkedin size={20} /> Nova Análise</button>
          </div>
          <div className="bg-white rounded-[32px] overflow-hidden border border-slate-100 shadow-sm">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400">
                <tr><th className="px-8 py-5">Perfil</th><th className="px-8 py-5">Sugestão Técnica</th><th className="px-8 py-5">DISC Predominante</th><th className="px-8 py-5 text-right">Detalhes</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {linkedinAnalyses.map(a => (
                  <tr key={a.id} className="hover:bg-slate-50 transition-all group cursor-pointer" onClick={() => { setSelectedAnalysisId(a.id); setActiveTab('linkedin_detail'); }}>
                    <td className="px-8 py-5"><div className="flex items-center gap-3"><div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><Linkedin size={16} /></div><div className="font-bold text-slate-700 truncate max-w-[200px]">{a.profileLink}</div></div></td>
                    <td className="px-8 py-5"><div className="flex gap-1.5"><span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[9px] font-black rounded uppercase border border-blue-100">{a.suggestedModule}</span><span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-[9px] font-black rounded uppercase border border-amber-100">{a.suggestedLevel}</span></div></td>
                    <td className="px-8 py-5"><span className="font-bold text-slate-600 flex items-center gap-2"><BrainCircuit size={14} className="text-purple-500" />{a.disc.predominant}</span></td>
                    <td className="px-8 py-5 text-right"><div className="inline-flex p-2 bg-white rounded-xl border border-slate-100 group-hover:bg-blue-600 group-hover:text-white transition-all"><ExternalLink size={16} /></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'linkedin_detail' && selectedAnalysisId && <LinkedInAnalysisDetail analysisId={selectedAnalysisId} onBack={() => setActiveTab('linkedin_analyses')} />}
      {activeTab === 'config' && <SettingsView />}
      {activeTab === 'bank' && <QuestionBankView />}
      {activeTab === 'templates' && <TemplatesView />}
      {activeTab === 'report' && selectedCandidateId && <CandidateReportView candidateId={selectedCandidateId} onBack={() => setActiveTab('dashboard')} />}

      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-xl rounded-[32px] p-8 shadow-2xl animate-in zoom-in duration-200">
            <h3 className="text-2xl font-bold mb-6">Configurar Nova Avaliação</h3>
            <form onSubmit={(e) => { e.preventDefault(); handleCreateTest(Object.fromEntries(new FormData(e.currentTarget))); }} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <input required name="name" placeholder="Nome do Candidato" className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-100" />
                <input required name="email" type="email" placeholder="email@exemplo.com" className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-100" />
              </div>
              <div className="p-6 bg-slate-50 rounded-[24px] border border-slate-100 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <select name="module" value={selectedModule} onChange={(e) => setSelectedModule(e.target.value)} className="w-full px-4 py-3 bg-white rounded-xl border border-slate-200 font-bold">
                    {modules.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                  <select name="level" value={selectedLevel} onChange={(e) => setSelectedLevel(e.target.value)} className="w-full px-4 py-3 bg-white rounded-xl border border-slate-200 font-bold">
                    <option value="JUNIOR">Junior</option><option value="PLENO">Pleno</option><option value="SENIOR">Senior</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <select name="industry" value={selectedIndustry} onChange={(e) => setSelectedIndustry(e.target.value)} className="w-full px-4 py-3 bg-white rounded-xl border border-slate-200 font-bold">
                    {industries.map(i => <option key={i.id} value={i.name}>{i.name}</option>)}
                  </select>
                  <select name="implType" value={selectedImpl} onChange={(e) => setSelectedImpl(e.target.value as ImplementationType)} className="w-full px-4 py-3 bg-white rounded-xl border border-slate-200 font-bold">
                    <option value={ImplementationType.PRIVATE}>S/4HANA Private</option><option value={ImplementationType.PUBLIC}>S/4HANA Public</option>
                  </select>
                </div>
              </div>

              {existingTemplate && (
                <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-100 rounded-2xl text-green-700 text-xs font-bold animate-in fade-in">
                  <CheckCircle2 size={16} /> 
                  Modelo existente detectado. Nenhuma questão nova será gerada.
                </div>
              )}

              <button disabled={isLoadingAction} type="submit" className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl shadow-xl flex items-center justify-center gap-2 hover:bg-blue-700 transition-all">
                {isLoadingAction ? <Loader2 className="animate-spin" /> : <Sparkles size={20} />} 
                {isLoadingAction ? 'Criando e Sincronizando...' : 'Gerar e Sincronizar Teste'}
              </button>
              <button type="button" onClick={() => setShowAddModal(false)} className="w-full text-slate-400 font-bold text-sm">Cancelar</button>
            </form>
          </div>
        </div>
      )}

      {showLinkedInModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-lg rounded-[32px] overflow-hidden shadow-2xl">
            <div className="bg-[#0077b5] p-8 flex items-center justify-between text-white">
              <div className="flex items-center gap-3"><Linkedin size={28} /><h3 className="text-xl font-bold">Análise DISC</h3></div>
              <button onClick={() => setShowLinkedInModal(false)} className="text-white/50 hover:text-white"><X size={24} /></button>
            </div>
            <div className="p-8">
              <form onSubmit={handleAnalyzeLinkedIn} className="space-y-6">
                <input required name="profileLink" placeholder="URL do Perfil LinkedIn" className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none" />
                <button disabled={isAnalyzingLinkedIn} type="submit" className="w-full py-5 bg-[#0077b5] text-white font-black rounded-2xl shadow-xl flex items-center justify-center gap-3 hover:bg-[#005c8a]">
                  {isAnalyzingLinkedIn ? <Loader2 className="animate-spin" /> : <Zap size={20} />} Iniciar Análise
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;
