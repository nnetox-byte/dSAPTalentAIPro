
import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Search, Filter, Trash2, Eye, Sparkles, RefreshCw, Layers, HardHat, Factory, X, Calculator, Cloud, BrainCircuit, BookOpen, Info, CheckCircle2, Loader2, ChevronRight, AlertCircle, Wand2 } from 'lucide-react';
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

  // Fix: Cast blockCounts values to number[] to ensure type safety in reduce operation
  const totalSelectedQuestions = useMemo(() => 
    (Object.values(blockCounts) as number[]).reduce((a, b) => a + b, 0), 
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
      setQuestions(qs || []);
      setScenarios(scs || []);
      setModules(ms || []);
      setIndustries(inds || []);
    } catch (e) {
      console.error("❌ Erro ao carregar dados do banco:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Auxiliares para exibição de nomes amigáveis
  const getModuleName = (id: string) => modules.find(m => m.id === id)?.name || id;
  const getIndustryName = (id: string) => industries.find(i => i.id === id)?.name || id;

  const filteredQuestions = useMemo(() => {
    return questions.filter(q => {
      const qBlock = String(q.block || '').trim().toLowerCase();
      const qModule = String(q.module || '').trim().toLowerCase();
      const qSeniority = String(q.seniority || '').trim().toUpperCase();
      const qIndustry = String(q.industry || '').trim().toLowerCase();
      const qImpl = String(q.implementationType || '').trim().toLowerCase();

      const matchBlock = filterBlock === 'ALL' || qBlock === filterBlock.trim().toLowerCase();
      const matchModule = filterModule === 'ALL' || qModule === filterModule.trim().toLowerCase();
      const matchLevel = filterLevel === 'ALL' || qSeniority === filterLevel.trim().toUpperCase();
      const matchIndustry = filterIndustry === 'ALL' || qIndustry === filterIndustry.trim().toLowerCase();
      const matchImpl = filterImpl === 'ALL' || qImpl === filterImpl.trim().toLowerCase();

      return matchBlock && matchModule && matchLevel && matchIndustry && matchImpl;
    });
  }, [questions, filterBlock, filterModule, filterLevel, filterIndustry, filterImpl]);

  const filteredScenarios = useMemo(() => {
    return scenarios.filter(s => {
      const sModule = String(s.moduleId || '').trim().toLowerCase();
      const sLevel = String(s.level || '').trim().toUpperCase();
      const sIndustry = String(s.industry || '').trim().toLowerCase();

      const matchModule = filterModule === 'ALL' || sModule === filterModule.trim().toLowerCase();
      const matchLevel = filterLevel === 'ALL' || sLevel === filterLevel.trim().toUpperCase();
      const matchIndustry = filterIndustry === 'ALL' || sIndustry === filterIndustry.trim().toLowerCase();

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
    } catch (err: any) {
      alert('Erro ao gravar pacote: ' + err.message);
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
    } catch (err: any) {
      alert('Erro ao gerar cenário: ' + err.message);
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

  const clearFilters = () => {
    setFilterBlock('ALL');
    setFilterModule('ALL');
    setFilterLevel('ALL');
    setFilterIndustry('ALL');
    setFilterImpl('ALL');
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
            <button onClick={() => setShowGenModal(true)} className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95">
              <Sparkles size={18} /> Gerar Questões IA
            </button>
          ) : (
            <button onClick={() => setShowScenarioModal(true)} className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-95">
              <BrainCircuit size={18} /> Novo Cenário IA
            </button>
          )}
        </div>
      </div>

      <div className="flex p-1.5 bg-slate-100 rounded-2xl w-fit">
        <button onClick={() => setActiveTab('QUESTIONS')} className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'QUESTIONS' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
          Questões ({filteredQuestions.length})
        </button>
        <button onClick={() => setActiveTab('SCENARIOS')} className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'SCENARIOS' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
          Cenários ({filteredScenarios.length})
        </button>
      </div>

      {/* BARRA DE FILTROS DINÂMICA (RESTAURADA E LENDO DO BANCO) */}
      <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 relative">
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Bloco</label>
          <select value={filterBlock} onChange={(e) => setFilterBlock(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl font-bold outline-none focus:ring-2 focus:ring-blue-500 text-xs">
            <option value="ALL">Todos os Blocos</option>
            {Object.values(BlockType).map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Módulo</label>
          <select value={filterModule} onChange={(e) => setFilterModule(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl font-bold outline-none focus:ring-2 focus:ring-blue-500 text-xs">
            <option value="ALL">Todos os Módulos</option>
            {modules.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sênioridade</label>
          <select value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl font-bold outline-none focus:ring-2 focus:ring-blue-500 text-xs">
            <option value="ALL">Qualquer</option>
            {Object.values(SeniorityLevel).map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Indústria</label>
          <select value={filterIndustry} onChange={(e) => setFilterIndustry(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl font-bold outline-none focus:ring-2 focus:ring-blue-500 text-xs">
            <option value="ALL">Todas</option>
            {industries.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
          </select>
        </div>
        <div className="space-y-1 flex flex-col justify-end">
          <button onClick={clearFilters} className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2">
            <X size={14} /> Limpar Filtros
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-4">
          <Loader2 className="animate-spin text-blue-600" size={40} />
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Sincronizando Banco...</p>
        </div>
      ) : activeTab === 'QUESTIONS' ? (
        <div className="grid grid-cols-1 gap-6">
          {filteredQuestions.length > 0 ? filteredQuestions.map(q => (
            <div key={q.id} className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm relative group hover:border-blue-200 transition-all">
               <div className="flex flex-wrap gap-2 mb-4">
                 <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black rounded-full uppercase border border-blue-100">{q.block}</span>
                 <span className="px-3 py-1 bg-amber-50 text-amber-600 text-[10px] font-black rounded-full uppercase border border-amber-100">{q.seniority}</span>
                 <span className="px-3 py-1 bg-slate-50 text-slate-500 text-[10px] font-black rounded-full uppercase border border-slate-100">{getModuleName(q.module)}</span>
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
          )) : (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 bg-white rounded-[40px] border-2 border-dashed border-slate-100">
               <AlertCircle size={40} className="mb-4 opacity-20" />
               <p className="font-bold italic">Nenhuma questão encontrada para este filtro.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredScenarios.length > 0 ? filteredScenarios.map(s => (
            <div key={s.id} onClick={() => setSelectedScenario(s)} className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm relative group hover:border-indigo-400 transition-all cursor-pointer">
               <div className="flex justify-between items-start mb-4">
                 <div className="flex gap-2">
                   <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 text-[9px] font-black rounded-lg uppercase tracking-widest border border-indigo-100">Case Prático</span>
                   <span className="px-2.5 py-1 bg-slate-50 text-slate-500 text-[9px] font-black rounded-lg uppercase tracking-widest">{getModuleName(s.moduleId || '').toUpperCase()}</span>
                   <span className="px-2.5 py-1 bg-amber-50 text-amber-600 text-[9px] font-black rounded-lg uppercase tracking-widest border border-amber-100">{s.level}</span>
                 </div>
                 <div className="flex gap-1">
                   <button className="p-2 text-slate-300 hover:text-indigo-600 transition-colors"><Eye size={18} /></button>
                   <button onClick={(e) => handleDeleteScenario(s.id, e)} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                 </div>
               </div>
               <h4 className="text-xl font-black text-slate-900 mb-3 group-hover:text-indigo-700 transition-colors">{s.title}</h4>
               <p className="text-sm text-slate-600 leading-relaxed line-clamp-3 mb-6 font-medium italic">"{s.description}"</p>
            </div>
          )) : (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-400 bg-white rounded-[40px] border-2 border-dashed border-slate-100">
               <BrainCircuit size={40} className="mb-4 opacity-20" />
               <p className="font-bold italic">Nenhum cenário localizado com estes parâmetros.</p>
            </div>
          )}
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
                   <span className="text-[10px] font-black uppercase tracking-widest text-indigo-200">{getModuleName(selectedScenario.moduleId || '').toUpperCase()} | {selectedScenario.level}</span>
                 </div>
               </div>
               <button onClick={() => setSelectedScenario(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={28} /></button>
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
               <button onClick={() => setSelectedScenario(null)} className="px-10 py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all shadow-xl">Fechar Visualização</button>
             </div>
          </div>
        </div>
      )}

      {/* Modal Gerar Questões IA */}
      {showGenModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in duration-200 border border-slate-200">
             <div className="bg-blue-600 p-8 flex items-center justify-between text-white">
                <div className="flex items-center gap-3">
                  <Wand2 size={24} />
                  <h3 className="text-xl font-bold tracking-tight">Gerar Pacote de Questões IA</h3>
                </div>
                <button onClick={() => setShowGenModal(false)} className="text-white/60 hover:text-white transition-colors"><X size={24} /></button>
             </div>
             <form onSubmit={handleAIInit} className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-1.5">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Módulo SAP</label>
                     <select name="module" required className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold">
                       {modules.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                     </select>
                   </div>
                   <div className="space-y-1.5">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sênioridade</label>
                     <select name="level" required className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold">
                       {Object.values(SeniorityLevel).map(l => <option key={l} value={l}>{l}</option>)}
                     </select>
                   </div>
                   <div className="space-y-1.5">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Indústria</label>
                     <select name="industry" required className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold">
                       {industries.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                     </select>
                   </div>
                   <div className="space-y-1.5">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Implementação</label>
                     <select name="implType" required className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold">
                       {Object.values(ImplementationType).map(t => <option key={t} value={t}>{t}</option>)}
                     </select>
                   </div>
                </div>

                <div className="p-6 bg-blue-50/50 rounded-2xl border border-blue-100">
                  <h4 className="text-[10px] font-black text-blue-600 uppercase mb-4 tracking-widest">Distribuição por Pilar (Total: {totalSelectedQuestions})</h4>
                  <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                    {Object.values(BlockType).map(block => (
                      <div key={block} className="space-y-1">
                        <label className="text-[8px] font-black text-slate-400 truncate block uppercase">{block}</label>
                        <input 
                          type="number" 
                          min="0" 
                          max="20"
                          value={blockCounts[block]}
                          onChange={(e) => setBlockCounts({...blockCounts, [block]: parseInt(e.target.value) || 0})}
                          className="w-full px-2 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-center outline-none focus:ring-2 focus:ring-blue-500" 
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <button disabled={isInitializing} type="submit" className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl shadow-xl flex items-center justify-center gap-3 hover:bg-blue-700 disabled:opacity-50">
                  {isInitializing ? <Loader2 className="animate-spin" /> : <Sparkles />}
                  {isInitializing ? "A IA está redigindo as questões..." : "Gerar e Salvar Questões"}
                </button>
             </form>
          </div>
        </div>
      )}

      {/* Modal Novo Cenário IA */}
      {showScenarioModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in duration-200 border border-slate-200">
             <div className="bg-indigo-600 p-8 flex items-center justify-between text-white">
                <div className="flex items-center gap-3">
                  <BrainCircuit size={24} />
                  <h3 className="text-xl font-bold tracking-tight">Novo Cenário IA</h3>
                </div>
                <button onClick={() => setShowScenarioModal(false)} className="text-white/60 hover:text-white transition-colors"><X size={24} /></button>
             </div>
             <form onSubmit={handleScenarioGen} className="p-8 space-y-6">
                <div className="space-y-4">
                   <div className="space-y-1.5">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Módulo SAP</label>
                     <select name="module" required className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold">
                       {modules.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                     </select>
                   </div>
                   <div className="space-y-1.5">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sênioridade</label>
                     <select name="level" required className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold">
                       {Object.values(SeniorityLevel).map(l => <option key={l} value={l}>{l}</option>)}
                     </select>
                   </div>
                   <div className="space-y-1.5">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Indústria</label>
                     <select name="industry" required className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold">
                       {industries.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                     </select>
                   </div>
                   <div className="space-y-1.5">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Implementação</label>
                     <select name="implType" required className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold">
                       {Object.values(ImplementationType).map(t => <option key={t} value={t}>{t}</option>)}
                     </select>
                   </div>
                </div>

                <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex gap-3">
                  <Info className="text-indigo-600 shrink-0" size={18} />
                  <p className="text-[10px] text-indigo-700 font-medium leading-relaxed">
                    A IA gerará um título, descrição do problema, diretrizes de resposta e uma rubrica de avaliação invisível.
                  </p>
                </div>

                <button disabled={isInitializing} type="submit" className="w-full py-5 bg-indigo-600 text-white font-black rounded-2xl shadow-xl flex items-center justify-center gap-3 hover:bg-indigo-700 disabled:opacity-50">
                  {isInitializing ? <Loader2 className="animate-spin" /> : <BrainCircuit size={20} />}
                  {isInitializing ? "Desenhando Cenário..." : "Gerar Novo Cenário"}
                </button>
             </form>
          </div>
        </div>
      )}

      {/* Overlay de carregamento global para operações de IA */}
      {isInitializing && (
        <div className="fixed inset-0 z-[300] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-8">
           <div className="bg-white px-10 py-8 rounded-[32px] shadow-2xl flex flex-col items-center gap-4 text-center max-w-sm border border-slate-200 animate-in zoom-in duration-300">
              <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl">
                <Loader2 size={40} className="animate-spin" />
              </div>
              <div>
                <h4 className="text-lg font-black text-slate-900">A IA está trabalhando...</h4>
                <p className="text-xs text-slate-500 font-medium mt-1 uppercase tracking-widest">Isso pode levar até 30 segundos.</p>
              </div>
              <p className="text-[10px] font-bold text-blue-600 italic">"Garantindo que o conteúdo seja preciso e estratégico para o ecossistema SAP."</p>
           </div>
        </div>
      )}
    </div>
  );
};

export default QuestionBankView;
