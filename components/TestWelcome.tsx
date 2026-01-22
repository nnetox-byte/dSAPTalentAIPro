
import React, { useState } from 'react';
import { Candidate, AssessmentTemplate } from '../types';
import { db } from '../services/dbService';
import { 
  Play, 
  Clock, 
  FileText, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2,
  Lock,
  ShieldAlert,
  Loader2
} from 'lucide-react';

interface TestWelcomeProps {
  candidate: Candidate;
  template: AssessmentTemplate;
  onStart: () => void;
}

const TestWelcome: React.FC<TestWelcomeProps> = ({ candidate, template, onStart }) => {
  const [hasConsented, setHasConsented] = useState(false);
  const [isLogging, setIsLogging] = useState(false);
  const totalQuestions = template.questions.length;

  const handleBegin = async () => {
    setIsLogging(true);
    try {
      // Registrar log de consentimento para auditoria LGPD
      await db.client.from('consent_logs').insert({
        candidate_id: candidate.id,
        email: candidate.email,
        user_agent: navigator.userAgent
      });
      onStart();
    } catch (err) {
      console.error("Erro ao registrar consentimento:", err);
      // Prossegue mesmo se falhar o log para não barrar o candidato, 
      // mas em produção idealmente travaria ou tentaria novamente.
      onStart();
    } finally {
      setIsLogging(false);
    }
  };

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
            <h1 className="text-4xl font-black tracking-tight mb-2 uppercase">Olá, {candidate.name.split(' ')[0]}!</h1>
            <p className="text-slate-400 font-medium leading-relaxed">Você foi convidado pela <strong>Delaware Brasil</strong> para a avaliação técnica de <span className="text-white font-bold">{candidate.appliedModule.toUpperCase()}</span>.</p>
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
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total de Itens</span>
              <span className="text-xl font-bold text-slate-800">{totalQuestions} Questões</span>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <AlertCircle size={14} /> Instruções e Direitos
            </h3>
            <ul className="space-y-3">
              {[
                "Seus dados são criptografados e protegidos via HTTPS.",
                "Não recarregue a página para evitar perda de progresso.",
                "Você pode solicitar a exclusão dos seus dados a qualquer momento.",
                "Os resultados serão processados automaticamente por IA."
              ].map((text, i) => (
                <li key={i} className="flex items-start gap-3 text-slate-600 text-xs font-medium leading-relaxed">
                  <CheckCircle2 size={16} className="text-green-500 shrink-0 mt-0.5" />
                  {text}
                </li>
              ))}
            </ul>
          </div>

          <div className="p-6 bg-blue-50 rounded-[24px] border border-blue-100 space-y-4">
            <div className="flex items-start gap-4">
              <div className="pt-1">
                <input 
                  type="checkbox" 
                  id="consent"
                  checked={hasConsented}
                  onChange={(e) => setHasConsented(e.target.checked)}
                  className="w-5 h-5 rounded border-blue-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </div>
              <label htmlFor="consent" className="text-[10px] text-blue-900 font-bold leading-relaxed cursor-pointer uppercase tracking-tight">
                <strong>CONSENTIMENTO EXPLÍCITO (LGPD):</strong> ESTOU CIENTE E CONSINTO COM O PROCESSAMENTO DOS MEUS DADOS PESSOAIS PARA FINS DE AVALIAÇÃO TÉCNICA PELA DELAWARE BRASIL. COMPREENDO QUE MEUS DADOS SERÃO ARMAZENADOS COM SEGURANÇA E QUE POSSO EXERCER MEUS DIREITOS DE TITULAR A QUALQUER MOMENTO.
              </label>
            </div>
          </div>

          <button 
            onClick={handleBegin}
            disabled={!hasConsented || isLogging}
            className={`w-full py-6 text-white font-black text-lg rounded-[24px] shadow-xl transition-all flex items-center justify-center gap-3 ${
              hasConsented && !isLogging
                ? 'bg-blue-600 shadow-blue-600/20 hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98]' 
                : 'bg-slate-300 cursor-not-allowed shadow-none'
            }`}
          >
            {isLogging ? <Loader2 className="animate-spin" /> : <Play size={24} fill="currentColor" />}
            {isLogging ? "Sincronizando..." : "Iniciar Avaliação Agora"}
          </button>

          {!hasConsented && (
            <p className="text-center text-[10px] text-red-500 font-black uppercase tracking-widest animate-pulse">
              É necessário aceitar os termos de privacidade para prosseguir.
            </p>
          )}

          <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
            <ShieldAlert size={14} /> Processamento em conformidade com a Lei Federal 13.709/18.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TestWelcome;
