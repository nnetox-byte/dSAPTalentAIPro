
import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Search, Filter, Trash2, Edit, Sparkles, RefreshCw, Layers, HardHat, Factory, X, Calculator, Cloud } from 'lucide-react';
import { db } from '../services/dbService';
import { Question, BlockType, SeniorityLevel, AssessmentTemplate, SAPModule, Industry, ImplementationType } from '../types';
import { generateBulkQuestions } from '../services/geminiService';

const QuestionBankView: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [modules, setModules] = useState<SAPModule[]>([]);
  const [industries, setIndustries] = useState<Industry[]>([]);
  
  // Filters
  const [filterBlock, setFilterBlock] = useState<string>('ALL');
  const [filterModule, setFilterModule] = useState<string>('ALL');
  const [filterLevel, setFilterLevel] = useState<string>('ALL');
  const [filterIndustry, setFilterIndustry] = useState<string>('ALL');
  const [filterImpl, setFilterImpl] = useState<string>('ALL');
  
  const [showGenModal, setShowGenModal] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  // Default counts for the modal
  const [blockCounts, setBlockCounts] = useState<Record<BlockType, number>>({
    [BlockType.MASTER_DATA]: 5,
    [BlockType.PROCESS]: 5,
    [BlockType.SOFT_SKILL]: 5,
    [BlockType.SAP_ACTIVATE]: 5,
    [BlockType.CLEAN_CORE]: 5
  });

  // Fixed: Load data asynchronously in useEffect
  useEffect(() => {
    const loadData = async () => {
      const [qs, ms, inds] = await Promise.all([
        db.getBankQuestions(),
        db.getModules(),
        db.getIndustries()
      ]);
      setQuestions(qs);
      setModules(ms);
      setIndustries(inds);
    };
    loadData();
  }, []);

  const filteredQuestions = useMemo(() => {
    return questions.filter(q => {
      const matchBlock = filterBlock === 'ALL' || q.block === filterBlock;
      const matchModule = filterModule === 'ALL' || q.module === filterModule;
      const matchLevel = filterLevel === 'ALL' || q.seniority === filterLevel;
      const matchIndustry = filterIndustry === 'ALL' || q.industry === filterIndustry;
      const matchImpl = filterImpl === 'ALL' || q.implementationType === filterImpl;
      return matchBlock && matchModule && matchLevel && matchIndustry && matchImpl;
    });
  }, [questions, filterBlock, filterModule, filterLevel, filterIndustry, filterImpl]);

  const handleAIInit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const moduleId = formData.get('module') as string;
    const industryName = formData.get('industry') as string;
    const level = formData.get('level') as SeniorityLevel;
    const implType = formData.get('implType') as ImplementationType;

    const totalToGen = (Object.values(blockCounts) as number[]).reduce((a, b) => a + b, 0);
    if (totalToGen === 0) {
      alert('Selecione pelo menos uma questão para gerar.');
      return;
    }

    setIsInitializing(true);
    try {
      const newQuestions = await generateBulkQuestions(moduleId, industryName, level, implType, blockCounts);
      
      const currentBank = await db.getBankQuestions();
      const updatedBank = [...currentBank, ...newQuestions];
      await db.saveBankQuestions(updatedBank);
      setQuestions(updatedBank);

      const template: AssessmentTemplate = {
        id: `tmpl-auto-${Date.now()}`,
        name: `Pack IA: ${moduleId.toUpperCase()} - ${level} (${implType})`,
        moduleId: moduleId,
        industryId: industryName,
        level: level,
        implementationType: implType,
        questions: newQuestions,
        createdAt: new Date().toISOString()
      };
      await db.saveTemplate(template);

      alert(`Sucesso! ${newQuestions.length} questões geradas e modelo criado.`);
      setShowGenModal(false);
    } catch (err) {
      console.error(err);
      alert('Erro ao gerar questões. Verifique se a API Key está correta.');
    } finally {
      setIsInitializing(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm('Deseja excluir esta questão permanentemente?')) {
      await db.deleteBankQuestion(id);
      const updatedQs = await db.getBankQuestions();
      setQuestions(updatedQs);
    }
  };

  const handleCountChange = (block: BlockType, val: string) => {
    const num = parseInt(val) || 0;
    setBlockCounts(prev => ({ ...prev, [block]: num }));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Banco de Questões</h2>
          <p className="text-slate-500">Curadoria de conteúdo técnico e funcional para avaliações</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={async () => {
              if (confirm('Deseja limpar TODO o banco de questões?')) {
                await db.saveBankQuestions([]);
                setQuestions([]);
              }
            }}
            className="flex items-center gap-2 px-4 py-3 text-red-600 font-bold rounded-2xl border border-red-100 hover:bg-red-50 transition-all"
          >
            <Trash2 size={20} />
          </button>
          <button 
            onClick={() => setShowGenModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
          >
            <Sparkles size={20} />
            Gerar Pacote com IA
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Bloco</label>
          <select value={filterBlock} onChange={(e) => setFilterBlock(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none">
            <option value="ALL">Todos os Blocos</option>
            {Object.values(BlockType).map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Módulo</label>
          <select value={filterModule} onChange={(e) => setFilterModule(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none">
            <option value="ALL">Todos os Módulos</option>
            {modules.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Nível</label>
          <select value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none">
            <option value="ALL">Senioridade</option>
            {Object.values(SeniorityLevel).map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Indústria</label>
          <select value={filterIndustry} onChange={(e) => setFilterIndustry(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none">
            <option value="ALL">Todas as Indústrias</option>
            {industries.map(i => <option key={i.id} value={i.name}>{i.name}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Implementação</label>
          <select value={filterImpl} onChange={(e) => setFilterImpl(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none">
            <option value="ALL">Todos os Tipos</option>
            {Object.values(ImplementationType).map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredQuestions.length === 0 ? (
          <div className="bg-white rounded-[32px] p-12 text-center border-2 border-dashed border-slate-200">
            <Sparkles size={40} className="mx-auto text-slate-200 mb-4" />
            <p className="text-slate-400 font-medium">Nenhuma questão encontrada para os critérios selecionados.</p>
          </div>
        ) : (
          filteredQuestions.map((q) => (
            <div key={q.id} className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm hover:shadow-md transition-all group relative">
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[9px] font-bold rounded uppercase flex items-center gap-1">
                  <Layers size={10} /> {q.block}
                </span>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[9px] font-bold rounded uppercase">
                  {q.module}
                </span>
                <span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-[9px] font-bold rounded uppercase">
                  {q.seniority}
                </span>
                <span className="px-2 py-0.5 bg-green-50 text-green-600 text-[9px] font-bold rounded uppercase flex items-center gap-1">
                  <Cloud size={10} /> {q.implementationType}
                </span>
              </div>
              <p className="text-slate-800 font-medium mb-4 pr-12">{q.text}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {q.options.map((opt, i) => (
                  <div key={i} className={`text-xs p-3 rounded-xl flex items-center gap-3 border ${i === q.correctAnswerIndex ? 'bg-green-50 text-green-700 font-bold border-green-200 shadow-sm' : 'bg-slate-50 text-slate-500 border-transparent'}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] shrink-0 ${i === q.correctAnswerIndex ? 'bg-green-600 text-white shadow-lg shadow-green-600/30' : 'bg-slate-200 text-slate-400'}`}>
                      {String.fromCharCode(65 + i)}
                    </div>
                    {opt}
                  </div>
                ))}
              </div>
              <button 
                type="button"
                onClick={(e) => handleDelete(q.id, e)}
                className="absolute top-6 right-6 p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all bg-white rounded-lg shadow-sm border border-slate-100"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Generation Modal Updated to match Screenshot */}
      {showGenModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
          <div className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="bg-[#0f172a] p-8 flex items-center justify-between text-white">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/20 text-blue-400 rounded-2xl border border-blue-500/30">
                  <Sparkles size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold">IA Bulk Generator</h3>
                  <p className="text-xs text-slate-400">Criar pacote completo e personalizado</p>
                </div>
              </div>
              <button onClick={() => setShowGenModal(false)} className="text-slate-500 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleAIInit} className="p-8 space-y-8">
              {/* Parameter Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Módulo SAP</label>
                  <select name="module" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-slate-700">
                    {modules.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Indústria</label>
                  <select name="industry" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-slate-700">
                    {industries.map(i => <option key={i.id} value={i.name}>{i.name}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sênioridade</label>
                  <select name="level" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-slate-700">
                    {Object.values(SeniorityLevel).map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Implementação</label>
                  <select name="implType" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-slate-700">
                    {Object.values(ImplementationType).map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
              </div>

              {/* Question Count Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <Calculator size={16} className="text-slate-400" />
                  <h4 className="text-[11px] font-black text-slate-700 uppercase tracking-widest">Qtd. de Questões por Pilar</h4>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {Object.values(BlockType).map((block) => (
                    <div key={block} className="space-y-2">
                      <label className="text-[9px] font-bold text-slate-400 uppercase block truncate text-center" title={block}>{block}</label>
                      <input 
                        type="number" 
                        min="0" 
                        max="25"
                        value={blockCounts[block]}
                        onChange={(e) => handleCountChange(block, e.target.value)}
                        className="w-full px-3 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-center text-slate-700 text-lg shadow-inner"
                      />
                    </div>
                  ))}
                </div>
                <div className="flex justify-end pt-2">
                   <p className="text-[11px] font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-full border border-blue-100 shadow-sm">
                     Total a gerar: {(Object.values(blockCounts) as number[]).reduce((a, b) => a + b, 0)} questões
                   </p>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100">
                <button 
                  disabled={isInitializing}
                  type="submit" 
                  className="w-full py-5 bg-blue-600 text-white font-black text-sm uppercase tracking-widest rounded-[20px] shadow-2xl shadow-blue-600/30 hover:bg-blue-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-[0.98]"
                >
                  {isInitializing ? (
                    <>
                      <RefreshCw className="animate-spin" size={20} />
                      IA está trabalhando...
                    </>
                  ) : (
                    <>
                      Garantir Qualidade e Gerar Pacote
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionBankView;
