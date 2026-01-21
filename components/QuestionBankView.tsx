
import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Search, Filter, Trash2, Eye, Sparkles, RefreshCw, Layers, HardHat, Factory, X, Calculator, Cloud, BrainCircuit, BookOpen, Info, CheckCircle2, Loader2, ChevronRight } from 'lucide-react';
import { db } from '../services/dbService';
import { Question, BlockType, SeniorityLevel, AssessmentTemplate, SAPModule, Industry, ImplementationType, Scenario } from '../types';
import { generateBulkQuestions, generateSAPScenario } from '../services/geminiService';

const QuestionBankView: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [modules, setModules] = useState<SAPModule[]>([]);
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [activeTab, setActiveTab] = useState<'QUESTIONS' | 'SCENARIOS'>('QUESTIONS');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  
  // Filtros
  const [filterBlock, setFilterBlock] = useState<string>('ALL');
  const [filterModule, setFilterModule] = useState<string>('ALL');
  const [filterLevel, setFilterLevel] = useState<string>('ALL');
  const [filterIndustry, setFilterIndustry] = useState<string>('ALL');
  const [filterImpl, setFilterImpl] = useState<string>('ALL');
  
  const [showGenModal, setShowGenModal] = useState(false);
  const [showScenarioModal, setShowScenarioModal] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  const [blockCounts, setBlockCounts] = useState<Record<BlockType, number>>({
    [BlockType.MASTER_DATA]: 5,
    [BlockType.PROCESS]: 5,
    [BlockType.SOFT_SKILL]: 5,
    [BlockType.SAP_ACTIVATE]: 5,
    [BlockType.CLEAN_CORE]: 5
  });

  const totalSelectedQuestions = useMemo(() => 
    Object.values(blockCounts).reduce((a, b) => a + b, 0), 
  [blockCounts]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [qs, scs, ms, inds] = await Promise.all([
        db.getBankQuestions(),
        db.getBankScenarios(),
        db.getModules(),
        db.getIndustries()
      ]);
      setQuestions(qs);
      setScenarios(scs);
      setModules(ms);
      setIndustries(inds);
    } catch (e) {
      console.error("❌ Erro ao carregar dados do banco:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredQuestions = useMemo(() => {
    return questions.filter(q => {
      const qBlock = String(q.block || '').trim().toLowerCase();
      const matchBlock = filterBlock === 'ALL' || qBlock === filterBlock.trim().toLowerCase();
      const matchModule = filterModule === 'ALL' || String(q.module || '').trim().toLowerCase() === filterModule.trim().toLowerCase();
      const matchLevel = filterLevel === 'ALL' || String(q.seniority || '').trim().toUpperCase() === filterLevel.trim().toUpperCase();
      const matchIndustry = filterIndustry === 'ALL' || String(q.industry || '').trim().toLowerCase() === filterIndustry.trim().toLowerCase();
      const matchImpl = filterImpl === 'ALL' || String(q.implementationType || '').trim().toLowerCase() === filterImpl.trim().toLowerCase();
      return matchBlock && matchModule && matchLevel && matchIndustry && matchImpl;
    });
  }, [questions, filterBlock, filterModule, filterLevel, filterIndustry, filterImpl]);

  const filteredScenarios = useMemo(() => {
    return scenarios.filter(s => {
      const matchModule = filterModule === 'ALL' || String(s.moduleId || '').trim().toLowerCase() === filterModule.trim().toLowerCase();
      const matchLevel = filterLevel === 'ALL' || String(s.level || '').trim().toUpperCase() === filterLevel.trim().toUpperCase();
      const matchIndustry = filterIndustry === 'ALL' || String(s.industry || '').trim().toLowerCase() === filterIndustry.trim().toLowerCase();
      return matchModule && matchLevel && matchIndustry;
    });
  }, [scenarios, filterModule, filterLevel, filterIndustry]);

  const handleAIInit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const moduleId = formData.get('module') as string;
    const industryId = formData.get('industry') as string;
    const level = formData.get('level') as SeniorityLevel;
    const implType = formData.get('implType') as ImplementationType;

    setIsInitializing(true);
    try {
      const newQuestions = await generateBulkQuestions(moduleId, industryId, level, implType, blockCounts);
      await db.saveBankQuestions(newQuestions);
      await loadData();
      setShowGenModal(false);
      alert('Pack de questões gerado com sucesso!');
    } catch (err: any) {
      alert('Erro ao gravar pacote.');
    } finally {
      setIsInitializing(false);
    }
  };

  const handleScenarioGen = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const moduleId = formData.get('module') as string;
    const industryId = formData.get('industry') as string;
    const level = formData.get('level') as SeniorityLevel;
    const implType = formData.get('implType') as ImplementationType;

    setIsInitializing(true);
    try {
      const newScenario = await generateSAPScenario(moduleId, level, industryId, implType);
      await db.saveBankScenario(newScenario);
      await loadData();
      setShowScenarioModal(false);
      alert('Cenário prático gerado!');
    } catch (err) {
      alert('Erro ao gerar cenário.');
    } finally {
      setIsInitializing(false);
    }
  };

  const handleDeleteScenario = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Excluir este cenário permanentemente?')) {
      db.deleteBankScenario(id).then(loadData);
    }
  };

  const handleCountChange = (block: BlockType, value: string) => {
    setBlockCounts(prev => ({ ...prev, [block]: parseInt(value) || 0 }));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Banco de Conhecimento</h2>
          <p className="text-slate-500 font-medium">Gestão centralizada de questões e cases práticos</p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'QUESTIONS' ? (
            <button onClick={() => setShowGenModal(true)} className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-lg">
              <Sparkles size={18} /> Gerar Questões IA
            </button>
          ) : (
            <button onClick={() => setShowScenarioModal(true)} className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-lg">
              <BrainCircuit size={18} /> Novo Cenário IA
            </button>
          )}
        </div>
      </div>

      <div className="flex p-1.5 bg-slate-100 rounded-2xl w-fit">
        <button onClick={() => setActiveTab('QUESTIONS')} className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'QUESTIONS' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
          Questões ({filteredQuestions.length})
        </button>
        <button onClick={() => setActiveTab('SCENARIOS')} className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'SCENARIOS' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
          Cenários ({filteredScenarios.length})
        </button>
      </div>

      <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Bloco</label>
          <select value={filterBlock} onChange={(e) => setFilterBlock(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl font-bold">
            <option value="ALL">Todos os Blocos</option>
            {Object.values(BlockType).map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Módulo</label>
          <select value={filterModule} onChange={(e) => setFilterModule(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl font-bold">
            <option value="ALL">Todos os Módulos</option>
            {modules.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sênioridade</label>
          <select value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl font-bold">
            <option value="ALL">Qualquer</option>
            {Object.values(SeniorityLevel).map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Indústria</label>
          <select value={filterIndustry} onChange={(e) => setFilterIndustry(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl font-bold">
            <option value="ALL">Todas</option>
            {industries.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Impl.</label>
          <select value={filterImpl} onChange={(e) => setFilterImpl(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl font-bold">
            <option value="ALL">Qualquer</option>
            {Object.values(ImplementationType).map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-4">
          <Loader2 className="animate-spin text-blue-600" size={40} />
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Sincronizando Banco...</p>
        </div>
      ) : activeTab === 'QUESTIONS' ? (
        <div className="grid grid-cols-1 gap-6">
          {filteredQuestions.map(q => (
            <div key={q.id} className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm relative group hover:border-blue-200 transition-all">
               <div className="flex flex-wrap gap-2 mb-4">
                 <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black rounded-full uppercase border border-blue-100">{q.block}</span>
                 <span className="px-3 py-1 bg-amber-50 text-amber-600 text-[10px] font-black rounded-full uppercase border border-amber-100">{q.seniority}</span>
               </div>
               <h3 className="text-xl font-bold text-slate-900 mb-8 leading-relaxed pr-10">{q.text}</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                 {q.options?.map((opt, i) => (
                   <div key={i} className={`p-4 rounded-2xl flex items-center gap-3 border ${i === q.correctAnswerIndex ? 'bg-green-50 border-green-200 text-green-900 font-bold' : 'bg-slate-50 border-transparent text-slate-500 opacity-80'}`}>
                     <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${i === q.correctAnswerIndex ? 'bg-green-600 text-white' : 'bg-slate-200 text-slate-400'}`}>{String.fromCharCode(65 + i)}</div>
                     <span className="text-sm">{opt}</span>
                   </div>
                 ))}
               </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredScenarios.map(s => (
            <div key={s.id} onClick={() => setSelectedScenario(s)} className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm relative group hover:border-indigo-400 transition-all cursor-pointer">
               <div className="flex justify-between items-start mb-4">
                 <div className="flex gap-2">
                   <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 text-[9px] font-black rounded-lg uppercase tracking-widest border border-indigo-100">Case Prático</span>
                   <span className="px-2.5 py-1 bg-slate-50 text-slate-500 text-[9px] font-black rounded-lg uppercase tracking-widest">{s.moduleId}</span>
                 </div>
                 <div className="flex gap-1">
                   <button className="p-2 text-slate-300 hover:text-indigo-600"><Eye size={18} /></button>
                   <button onClick={(e) => handleDeleteScenario(s.id, e)} className="p-2 text-slate-300 hover:text-red-500"><Trash2 size={18} /></button>
                 </div>
               </div>
               <h4 className="text-xl font-black text-slate-900 mb-3 group-hover:text-indigo-700 transition-colors">{s.title}</h4>
               <p className="text-sm text-slate-600 leading-relaxed line-clamp-3 mb-6 font-medium italic">"{s.description}"</p>
            </div>
          ))}
        </div>
      )}

      {/* Scenario View Modal */}
      {selectedScenario && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[40px] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in duration-300">
             <div className="bg-indigo-600 p-8 flex items-center justify-between text-white shrink-0">
               <div className="flex items-center gap-4">
                 <BrainCircuit size={32} />
                 <div>
                   <h3 className="text-2xl font-black">Visualizar Cenário</h3>
                   <span className="text-[10px] font-black uppercase tracking-widest text-indigo-200">{selectedScenario.moduleId} | {selectedScenario.level}</span>
                 </div>
               </div>
               <button onClick={() => setSelectedScenario(null)} className="p-2 hover:bg-white/10 rounded-full"><X size={28} /></button>
             </div>
             
             <div className="flex-1 overflow-y-auto p-10 space-y-8 bg-slate-50/50">
                <section>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Título do Caso</h4>
                  <p className="text-2xl font-black text-slate-900">{selectedScenario.title}</p>
                </section>

                <section className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                  <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-4">Descrição do Desafio</h4>
                  <p className="text-lg text-slate-700 leading-relaxed font-medium">{selectedScenario.description}</p>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <section>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Diretrizes de Resposta</h4>
                    <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100 text-amber-900 text-sm font-medium italic leading-relaxed">
                      {selectedScenario.guidelines}
                    </div>
                  </section>
                  <section>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Rubrica de Avaliação (Invisível)</h4>
                    <div className="space-y-3">
                      {selectedScenario.rubric.map((r, i) => (
                        <div key={i} className="p-4 bg-white rounded-xl border border-slate-100 flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-700">{r.criterion}</span>
                          <span className="text-[10px] font-black px-2 py-1 bg-green-50 text-green-600 rounded-lg">{r.points}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
             </div>
             
             <div className="p-8 bg-white border-t border-slate-100 flex justify-center shrink-0">
               <button onClick={() => setSelectedScenario(null)} className="px-10 py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all">Fechar Visualização</button>
             </div>
          </div>
        </div>
      )}

      {/* Modal Questões IA */}
      {showGenModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in">
             <div className="bg-blue-600 p-8 flex items-center justify-between text-white">
               <h3 className="text-xl font-bold flex items-center gap-3"><Sparkles /> Gerador de Pacotes IA</h3>
               <button onClick={() => setShowGenModal(false)}><X /></button>
             </div>
             <form onSubmit={handleAIInit} className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <select name="module" className="p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none">
                    {modules.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                  <select name="level" className="p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none">
                    {Object.values(SeniorityLevel).map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <button disabled={isInitializing} type="submit" className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl shadow-xl flex items-center justify-center gap-3">
                  {isInitializing ? <RefreshCw className="animate-spin" /> : <Sparkles />}
                  {isInitializing ? "Desenhando..." : `Gerar Pacote com ${totalSelectedQuestions} Questões`}
                </button>
             </form>
          </div>
        </div>
      )}

      {/* Modal Cenário IA */}
      {showScenarioModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-xl rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in">
            <div className="bg-indigo-600 p-8 flex items-center justify-between text-white">
              <h3 className="text-xl font-bold flex items-center gap-3"><BrainCircuit /> Gerar Novo Cenário SAP</h3>
              <button onClick={() => setShowScenarioModal(false)}><X /></button>
            </div>
            <form onSubmit={handleScenarioGen} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <select name="module" className="p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold">
                  {modules.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
                <select name="level" className="p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold">
                  {Object.values(SeniorityLevel).map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <select name="industry" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold">
                {industries.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
              <button disabled={isInitializing} type="submit" className="w-full py-5 bg-indigo-600 text-white font-black rounded-2xl shadow-xl flex items-center justify-center gap-3">
                {isInitializing ? <RefreshCw className="animate-spin" /> : <Sparkles />}
                {isInitializing ? "Desenhando..." : "Solicitar Case p/ IA"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionBankView;
