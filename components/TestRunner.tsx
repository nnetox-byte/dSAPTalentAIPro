import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle2, AlertCircle, ChevronRight, ChevronLeft, Send, CheckSquare, RefreshCw, Layers, Loader2, ListChecks } from 'lucide-react';
import { Candidate, AssessmentTemplate, BlockType, Question, AssessmentResult } from '../types';
import { db } from '../services/dbService';

interface TestRunnerProps {
  candidate: Candidate;
  template: AssessmentTemplate;
  onComplete: (result: AssessmentResult) => void;
}

const TestRunner: React.FC<TestRunnerProps> = ({ candidate, template, onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState(3600); // 1 hora
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    if (timeLeft === 0 && !isSubmitting) handleFinish();
    return () => clearInterval(timer);
  }, [timeLeft, isSubmitting]);

  const currentQuestion = template.questions[currentIndex];
  const totalQuestions = template.questions.length;
  const answeredCount = Object.keys(answers).length;
  const remainingCount = totalQuestions - answeredCount;

  const currentBlockIndex = Math.floor(currentIndex / 10) + 1;

  const handleSelect = (optionIndex: number) => {
    setAnswers({ ...answers, [currentQuestion.id]: optionIndex });
  };

  const handleFinish = async () => {
    if (answeredCount < totalQuestions && timeLeft > 0) {
      if (!confirm(`Você respondeu ${answeredCount} de ${totalQuestions}. Faltam ${remainingCount} questões. Deseja realmente finalizar a avaliação agora?`)) return;
    }

    setIsSubmitting(true);
    
    try {
      const detailedAnswers: any[] = [];
      let totalScore = 0;
      let maxPossibleScore = 0;
      
      const blockScores: Record<string, { earned: number, max: number }> = {};
      Object.values(BlockType).forEach(b => blockScores[b] = { earned: 0, max: 0 });

      template.questions.forEach((q) => {
        const weight = q.weight || 1;
        const selected = answers[q.id];
        const isCorrect = selected === q.correctAnswerIndex;

        blockScores[q.block].max += weight;
        if (isCorrect) {
          blockScores[q.block].earned += weight;
          totalScore += weight;
        }
        maxPossibleScore += weight;

        detailedAnswers.push({
          questionId: q.id,
          selectedOption: selected === undefined ? -1 : selected,
          isCorrect,
          block: q.block
        });
      });

      const finalBlockScores: any = {};
      Object.keys(blockScores).forEach(b => {
        finalBlockScores[b] = blockScores[b].max > 0 ? (blockScores[b].earned / blockScores[b].max) * 10 : 0;
      });

      const normalizedScore = (totalScore / maxPossibleScore) * 50; 

      const result: AssessmentResult = {
        id: `res-${Date.now()}`,
        candidateId: candidate.id,
        templateId: template.id,
        score: normalizedScore,
        blockScores: finalBlockScores,
        answers: detailedAnswers,
        completedAt: new Date().toISOString(),
        reportSentTo: ['admin@company.com', 'recruiter@company.com']
      };

      await db.saveResult(result);
      onComplete(result);
    } catch (e: any) {
      console.error(e);
      alert(`Erro ao salvar resultados: ${e.message}. Tente novamente.`);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <nav className="sticky top-0 z-50 bg-white border-b border-slate-200 px-6 py-4 shadow-sm">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white">
              <Clock size={20} className={timeLeft < 300 ? 'animate-pulse text-red-500' : ''} />
            </div>
            <div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tempo Restante</div>
              <div className={`text-xl font-bold font-mono ${timeLeft < 300 ? 'text-red-600' : 'text-slate-900'}`}>
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-8">
            <div className="text-center group relative cursor-help">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Respondidas</div>
              <div className="text-xl font-bold text-blue-600 flex items-center gap-2">
                <ListChecks size={16} />
                {answeredCount} <span className="text-slate-300">/</span> {totalQuestions}
              </div>
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-slate-800 text-white text-[10px] px-3 py-1 rounded-full z-[100]">
                Faltam {remainingCount} questões
              </div>
            </div>
            <div className="h-8 w-px bg-slate-200"></div>
            <div className="text-center">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bloco {currentBlockIndex}/5</div>
              <div className="text-sm font-bold text-slate-700">{currentQuestion.block}</div>
            </div>
          </div>
        </div>
        
        <div className="max-w-5xl mx-auto mt-4 h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-500 transition-all duration-500"
            style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
          />
        </div>
      </nav>

      <main className="flex-1 max-w-4xl mx-auto w-full p-6 py-12">
        <div className="bg-white rounded-[32px] shadow-xl border border-slate-200 overflow-hidden">
          <div className="bg-slate-900 p-8 flex justify-between items-center text-white">
            <div className="flex items-center gap-3">
              <Layers size={20} className="text-blue-400" />
              <span className="text-xs font-black uppercase tracking-widest">{currentQuestion.block}</span>
            </div>
            <span className="text-slate-400 text-xs font-bold">Questão {currentIndex + 1} de {totalQuestions}</span>
          </div>

          <div className="p-10">
            <h2 className="text-2xl font-bold text-slate-800 leading-tight mb-10">
              {currentQuestion.text}
            </h2>

            <div className="grid grid-cols-1 gap-4">
              {currentQuestion.options.map((opt, idx) => (
                <button
                  key={idx}
                  disabled={isSubmitting}
                  onClick={() => handleSelect(idx)}
                  className={`group text-left p-6 rounded-2xl border-2 transition-all flex items-center gap-5 ${
                    answers[currentQuestion.id] === idx
                      ? 'bg-blue-50 border-blue-500 shadow-md'
                      : 'bg-white border-slate-100 hover:border-slate-300'
                  } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black transition-colors ${
                    answers[currentQuestion.id] === idx ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'
                  }`}>
                    {String.fromCharCode(65 + idx)}
                  </div>
                  <span className={`text-lg font-medium ${answers[currentQuestion.id] === idx ? 'text-blue-900' : 'text-slate-600'}`}>
                    {opt}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-between items-center">
          <button
            onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
            disabled={currentIndex === 0 || isSubmitting}
            className="flex items-center gap-2 px-6 py-3 font-bold text-slate-400 hover:text-slate-700 disabled:opacity-0 transition-all"
          >
            <ChevronLeft size={20} /> Anterior
          </button>

          {currentIndex < totalQuestions - 1 ? (
            <button
              onClick={() => setCurrentIndex(currentIndex + 1)}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-10 py-4 bg-slate-900 text-white font-black rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl disabled:opacity-50"
            >
              Próxima Questão <ChevronRight size={20} />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={isSubmitting}
              className="flex items-center gap-3 px-10 py-4 bg-green-600 text-white font-black rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="animate-spin" /> : <Send size={20} />}
              {isSubmitting ? 'Finalizando...' : 'Finalizar e Enviar Respostas'}
            </button>
          )}
        </div>
      </main>
    </div>
  );
};

export default TestRunner;