
import React, { useState } from 'react';
import { Scenario } from '../types';
import { BrainCircuit, Info, Send, ChevronRight } from 'lucide-react';

interface ScenarioRunnerProps {
  scenario: Scenario;
  onResponse: (answer: string) => void;
  isSubmitting: boolean;
}

const ScenarioRunner: React.FC<ScenarioRunnerProps> = ({ scenario, onResponse, isSubmitting }) => {
  const [answer, setAnswer] = useState('');

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-slate-900 rounded-[32px] overflow-hidden shadow-2xl border border-slate-800">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 flex items-center gap-4 text-white">
          <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
            <BrainCircuit size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight">{scenario.title}</h2>
            <p className="text-blue-100 text-sm font-medium">Cenário Prático de Engenharia SAP</p>
          </div>
        </div>

        <div className="p-8 space-y-8">
          <div className="prose prose-invert max-w-none">
            <p className="text-slate-300 text-lg leading-relaxed font-medium">
              {scenario.description}
            </p>
          </div>

          <div className="p-6 bg-blue-500/10 border border-blue-500/30 rounded-2xl flex gap-4">
            <Info className="text-blue-400 shrink-0" size={20} />
            <div className="space-y-2">
              <h4 className="text-xs font-black text-blue-400 uppercase tracking-widest">O que deve constar na sua resposta:</h4>
              <p className="text-blue-100 text-sm italic">{scenario.guidelines}</p>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Sua Proposta de Solução Técnica</label>
            <textarea 
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              disabled={isSubmitting}
              placeholder="Descreva detalhadamente sua abordagem, transações envolvidas e lógica de negócio..."
              className="w-full h-64 bg-slate-800 border border-slate-700 rounded-3xl p-6 text-white text-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-600"
            />
          </div>

          <div className="flex justify-end">
            <button 
              onClick={() => onResponse(answer)}
              disabled={isSubmitting || answer.length < 50}
              className="px-10 py-5 bg-blue-600 text-white font-black rounded-2xl shadow-xl flex items-center gap-3 hover:bg-blue-700 disabled:opacity-50 transition-all active:scale-95"
            >
              {isSubmitting ? "Analisando Resposta..." : "Submeter Solução"}
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>
      
      <p className="text-center text-slate-400 text-xs font-bold uppercase tracking-widest px-8">
        Sua resposta será avaliada pela nossa IA Técnica especializada com base na precisão das transações e viabilidade da arquitetura proposta.
      </p>
    </div>
  );
};

export default ScenarioRunner;
