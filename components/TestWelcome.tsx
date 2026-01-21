import React from 'react';
import { Candidate, AssessmentTemplate } from '../types';
import { 
  Play, 
  Clock, 
  FileText, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2,
  Lock
} from 'lucide-react';

interface TestWelcomeProps {
  candidate: Candidate;
  template: AssessmentTemplate;
  onStart: () => void;
}

const TestWelcome: React.FC<TestWelcomeProps> = ({ candidate, template, onStart }) => {
  const totalQuestions = template.questions.length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in duration-300">
        <div className="bg-slate-900 p-10 text-white relative">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Lock size={120} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 text-blue-400 mb-4">
              <ShieldCheck size={24} />
              <span className="text-xs font-black uppercase tracking-[0.2em]">Ambiente Seguro de Avaliação</span>
            </div>
            <h1 className="text-4xl font-black tracking-tight mb-2">Olá, {candidate.name.split(' ')[0]}!</h1>
            <p className="text-slate-400 font-medium">Você foi convidado para a avaliação técnica de <span className="text-white font-bold">{candidate.appliedModule.toUpperCase()}</span>.</p>
          </div>
        </div>

        <div className="p-10 space-y-8">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-6 bg-slate-50 rounded-[24px] border border-slate-100 flex flex-col items-center text-center">
              <Clock className="text-blue-600 mb-2" size={28} />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Duração Máxima</span>
              <span className="text-xl font-bold text-slate-800">60 Minutos</span>
            </div>
            <div className="p-6 bg-slate-50 rounded-[24px] border border-slate-100 flex flex-col items-center text-center">
              <FileText className="text-blue-600 mb-2" size={28} />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total de Questões</span>
              <span className="text-xl font-bold text-slate-800">{totalQuestions} Itens</span>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <AlertCircle size={14} /> Instruções Importantes
            </h3>
            <ul className="space-y-3">
              {[
                "Certifique-se de estar em um ambiente calmo.",
                "Não recarregue a página após iniciar o teste.",
                "O cronômetro começará assim que você clicar no botão abaixo.",
                "Ao finalizar, seus resultados serão enviados automaticamente para o RH."
              ].map((text, i) => (
                <li key={i} className="flex items-start gap-3 text-slate-600 text-sm font-medium leading-relaxed">
                  <CheckCircle2 size={18} className="text-green-500 shrink-0 mt-0.5" />
                  {text}
                </li>
              ))}
            </ul>
          </div>

          <button 
            onClick={onStart}
            className="w-full py-6 bg-blue-600 text-white font-black text-lg rounded-[24px] shadow-xl shadow-blue-600/20 hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
          >
            <Play size={24} fill="currentColor" />
            Iniciar Avaliação Agora
          </button>

          <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            Ao clicar, você declara estar pronto para iniciar. Boa sorte!
          </p>
        </div>
      </div>
    </div>
  );
};

export default TestWelcome;