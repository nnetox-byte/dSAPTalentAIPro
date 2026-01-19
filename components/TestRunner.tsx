
import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle2, AlertCircle, ChevronRight, ChevronLeft, Send, CheckSquare, RefreshCw } from 'lucide-react';
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
  const [timeLeft, setTimeLeft] = useState(3600); // 1 hour in seconds
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const currentQuestion = template.questions[currentIndex];
  const totalQuestions = template.questions.length;
  const answeredCount = Object.keys(answers).length;
  const remainingCount = totalQuestions - answeredCount;
  const progress = ((currentIndex + 1) / totalQuestions) * 100;

  const handleSelect = (optionIndex: number) => {
    setAnswers({ ...answers, [currentQuestion.id]: optionIndex });
  };

  const handleFinish = async () => {
    if (Object.keys(answers).length < totalQuestions) {
      if (!confirm(`Você ainda tem ${remainingCount} questões sem resposta. Deseja finalizar mesmo assim?`)) return;
    }

    setIsSubmitting(true);
    
    // Logic to calculate score
    let totalScore = 0;
    const blockScores: Record<string, number> = {};
    const detailedAnswers: any[] = [];

    template.questions.forEach((q) => {
      const selected = answers[q.id];
      const isCorrect = selected === q.correctAnswerIndex;
      const weight = q.weight || 1;

      if (isCorrect) totalScore += weight;
      
      blockScores[q.block] = (blockScores[q.block] || 0) + (isCorrect ? weight : 0);
      
      detailedAnswers.push({
        questionId: q.id,
        selectedOption: selected,
        isCorrect
      });
    });

    const finalResult: AssessmentResult = {
      id: `res-${Date.now()}`,
      candidateId: candidate.id,
      templateId: template.id,
      score: totalScore,
      blockScores: blockScores as any,
      answers: detailedAnswers,
      completedAt: new Date().toISOString(),
    };

    // Simulated API call wait
    await new Promise(r => setTimeout(r, 2000));
    
    db.saveResult(finalResult);
    
    // Update candidate status to COMPLETED
    const updatedCandidate = { ...candidate, status: 'COMPLETED' as const };
    db.saveCandidate(updatedCandidate);

    onComplete(finalResult);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 flex flex-col items-center">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Avaliação Técnica SAP</h1>
            <p className="text-slate-500 font-medium">Candidato: {candidate.name} | {template.name}</p>
          </div>
          <div className="flex items-center gap-6 bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 text-blue-600 font-bold text-xl">
              <Clock size={20} />
              <span>{formatTime(timeLeft)}</span>
            </div>
            <div className="h-8 w-px bg-slate-200"></div>
            <div className="text-slate-500 font-semibold flex items-center gap-2">
              <CheckSquare size={18} className="text-slate-400" />
              <span className="text-slate-900">{answeredCount}</span> / {totalQuestions}
            </div>
          </div>
        </header>

        {/* Question Counter / Mini Nav */}
        <div className="flex flex-wrap gap-2 mb-6 justify-center">
          {template.questions.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`w-8 h-8 rounded-lg text-xs font-bold transition-all border ${
                currentIndex === idx 
                  ? 'bg-blue-600 text-white border-blue-600 ring-2 ring-blue-500/20 shadow-lg' 
                  : answers[template.questions[idx].id] !== undefined
                    ? 'bg-green-50 text-green-600 border-green-200'
                    : 'bg-white text-slate-400 border-slate-200'
              }`}
            >
              {idx + 1}
            </button>
          ))}
        </div>

        {/* Progress Info Bar */}
        <div className="mb-8 space-y-2">
          <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <span>Bloco: {currentQuestion.block}</span>
            <span>Respondidas: {answeredCount} | Faltam: {remainingCount}</span>
          </div>
          <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-500 ease-out shadow-[0_0_10px_rgba(59,130,246,0.5)]" 
              style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden mb-8 animate-in slide-in-from-bottom-4 duration-300">
          <div className="bg-slate-900 p-6 flex items-center justify-between">
            <span className="px-3 py-1 bg-blue-500 text-white text-[10px] font-bold rounded-full uppercase tracking-widest">
              {currentQuestion.block}
            </span>
            <span className="text-slate-400 text-sm font-medium">Questão {currentIndex + 1} de {totalQuestions}</span>
          </div>
          
          <div className="p-8">
            <h2 className="text-xl font-semibold text-slate-800 leading-relaxed mb-8">
              {currentQuestion.text}
            </h2>

            <div className="space-y-4">
              {currentQuestion.options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelect(idx)}
                  className={`w-full text-left p-5 rounded-2xl border-2 transition-all flex items-center gap-4 ${
                    answers[currentQuestion.id] === idx
                      ? 'bg-blue-50 border-blue-500 ring-4 ring-blue-500/10'
                      : 'border-slate-50 hover:border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold shrink-0 ${
                    answers[currentQuestion.id] === idx ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {String.fromCharCode(65 + idx)}
                  </div>
                  <span className={`font-medium ${answers[currentQuestion.id] === idx ? 'text-blue-900' : 'text-slate-600'}`}>
                    {option}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
            disabled={currentIndex === 0}
            className="flex items-center gap-2 px-6 py-3 font-semibold text-slate-400 hover:text-slate-600 disabled:opacity-30 transition-all"
          >
            <ChevronLeft size={20} />
            Anterior
          </button>

          <div className="flex items-center gap-4">
            {currentIndex < totalQuestions - 1 ? (
              <button
                onClick={() => setCurrentIndex(currentIndex + 1)}
                className="flex items-center gap-2 px-8 py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 active:scale-95"
              >
                Próxima Questão
                <ChevronRight size={20} />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-10 py-4 bg-green-600 text-white font-bold rounded-2xl hover:bg-green-700 transition-all shadow-xl shadow-green-600/20 active:scale-95"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw size={20} className="animate-spin" />
                    Finalizando...
                  </>
                ) : (
                  <>
                    Finalizar Avaliação
                    <Send size={20} />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestRunner;
