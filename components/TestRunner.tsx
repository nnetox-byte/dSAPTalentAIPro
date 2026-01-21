
import React, { useState, useEffect, useMemo } from 'react';
import { Clock, CheckCircle2, AlertCircle, ChevronRight, ChevronLeft, Send, CheckSquare, RefreshCw, Layers, Loader2, ListChecks, PartyPopper, Sparkles, Home } from 'lucide-react';
import { Candidate, AssessmentTemplate, BlockType, Question, AssessmentResult, ScenarioResult } from '../types';
import { db } from '../services/dbService';
import { evaluateScenarioResponse } from '../services/geminiService';
import ScenarioRunner from './ScenarioRunner';

interface TestRunnerProps {
  candidate: Candidate;
  template: AssessmentTemplate;
  onComplete: (result: AssessmentResult) => void;
}

const COMPLETION_MESSAGES = [
  {
    title: "Excelente trabalho!",
    body: "Parabéns por concluir a avaliação. Sabemos que o ecossistema SAP exige grande profundidade técnica e valorizamos muito o tempo e dedicação que você investiu aqui hoje.",
    footer: "Sua avaliação está sendo processada e nossa equipe de recrutamento entrará em contato em breve."
  },
  {
    title: "Teste finalizado com sucesso!",
    body: "Obrigado por compartilhar seu conhecimento conosco. Avaliar competências em cenários de implementação complexos é um desafio, e ficamos felizes em ter você em nosso processo.",
    footer: "Os resultados foram sincronizados. Fique atento ao seu e-mail para os próximos passos."
  }
];

const TestRunner: React.FC<TestRunnerProps> = ({ candidate, template, onComplete }) => {
  const [step, setStep] = useState<'QUESTIONS' | 'SCENARIO'>('QUESTIONS');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState(3600); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [finalResult, setFinalResult] = useState<AssessmentResult | null>(null);

  const completionMessage = useMemo(() => {
    return COMPLETION_MESSAGES[Math.floor(Math.random() * COMPLETION_MESSAGES.length)];
  }, [isFinished]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (!isFinished) setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    if (timeLeft === 0 && !isSubmitting && !isFinished) handleFinish();
    return () => clearInterval(timer);
  }, [timeLeft, isSubmitting, isFinished]);

  const currentQuestion = template.questions[currentIndex];
  const totalQuestions = template.questions.length;
  const answeredCount = Object.keys(answers).length;

  const handleSelect = (optionIndex: number) => {
    setAnswers({ ...answers, [currentQuestion.id]: optionIndex });
  };

  const goToScenario = () => {
    if (template.scenarios && template.scenarios.length > 0) {
      setStep('SCENARIO');
    } else {
      handleFinish();
    }
  };

  const handleScenarioSubmit = async (answer: string) => {
    setIsSubmitting(true);
    try {
      const scenario = template.scenarios![0];
      const evaluation = await evaluateScenarioResponse(scenario, answer);
      
      const scenarioResult: ScenarioResult = {
        id: `sr-${Date.now()}`,
        candidateId: candidate.id,
        scenarioId: scenario.id,
        answer: answer,
        score: evaluation.score,
        feedback: evaluation.feedback,
        evaluatedAt: new Date().toISOString()
      };

      await handleFinish(scenarioResult);
    } catch (e) {
      await handleFinish();
    }
  };

  const handleFinish = async (scResult?: ScenarioResult) => {
    setIsSubmitting(true);
    try {
      let totalScore = 0;
      let maxPossibleScore = 0;
      const blockScores: any = {};
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
      });

      const finalBlockScores: any = {};
      Object.keys(blockScores).forEach(b => {
        finalBlockScores[b] = blockScores[b].max > 0 ? (blockScores[b].earned / blockScores[b].max) * 10 : 0;
      });

      // Média final (70% Questões + 30% Cenário se existir)
      let finalTotalScore = (totalScore / maxPossibleScore) * 50;
      if (scResult) {
        const scenarioWeight = 15;
        const mcWeight = 35;
        const mcScoreNorm = (totalScore / maxPossibleScore) * mcWeight;
        const scScoreNorm = (scResult.score / 10) * scenarioWeight;
        finalTotalScore = mcScoreNorm + scScoreNorm;
      }

      const result: AssessmentResult = {
        id: `res-${Date.now()}`,
        candidateId: candidate.id,
        templateId: template.id,
        score: finalTotalScore,
        blockScores: finalBlockScores,
        scenarioResults: scResult ? [scResult] : [],
        answers: Object.entries(answers).map(([qid, opt]) => {
          const question = template.questions.find(q => q.id === qid);
          return {
            questionId: qid, selectedOption: opt,
            isCorrect: opt === question?.correctAnswerIndex,
            block: (question?.block || BlockType.PROCESS) as BlockType
          };
        }),
        completedAt: new Date().toISOString(),
        reportSentTo: []
      };

      await db.saveResult(result);
      setFinalResult(result);
      setIsFinished(true);
    } catch (e: any) {
      alert(`Erro: ${e.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isFinished) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-xl w-full bg-white rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden">
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-12 text-white text-center">
            <PartyPopper size={48} className="mx-auto mb-6" />
            <h1 className="text-3xl font-black">{completionMessage.title}</h1>
          </div>
          <div className="p-10 text-center space-y-6">
            <p className="text-slate-600 text-lg leading-relaxed">{completionMessage.body}</p>
            <button onClick={() => onComplete(finalResult!)} className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl shadow-xl flex items-center justify-center gap-2">
              <Home size={18} /> Voltar ao Início
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'SCENARIO' && template.scenarios?.[0]) {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <ScenarioRunner scenario={template.scenarios[0]} isSubmitting={isSubmitting} onResponse={handleScenarioSubmit} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <nav className="sticky top-0 z-50 bg-white border-b border-slate-200 px-4 py-3 shadow-sm">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Clock size={18} className="text-slate-600" />
            <div className="font-mono font-bold">{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</div>
          </div>
          <div className="text-xs font-bold text-blue-600">{answeredCount}/{totalQuestions} Q.</div>
        </div>
        <div className="max-w-5xl mx-auto mt-3 h-1 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }} />
        </div>
      </nav>

      <main className="flex-1 max-w-4xl mx-auto w-full p-6 py-12">
        <div className="bg-white rounded-[32px] shadow-xl border border-slate-200 overflow-hidden">
          <div className="bg-slate-900 p-8 flex justify-between items-center text-white">
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">{currentQuestion?.block}</span>
            <span className="text-slate-400 text-[10px] font-bold">Questão {currentIndex + 1} de {totalQuestions}</span>
          </div>
          <div className="p-10">
            <h2 className="text-2xl font-bold text-slate-800 leading-tight mb-8">{currentQuestion?.text}</h2>
            <div className="grid grid-cols-1 gap-4">
              {currentQuestion?.options.map((opt, idx) => (
                <button key={idx} disabled={isSubmitting} onClick={() => handleSelect(idx)} className={`text-left p-6 rounded-2xl border-2 transition-all flex items-center gap-4 ${answers[currentQuestion.id] === idx ? 'bg-blue-50 border-blue-500' : 'bg-white border-slate-100'}`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${answers[currentQuestion.id] === idx ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>{String.fromCharCode(65 + idx)}</div>
                  <span className={`text-lg font-medium ${answers[currentQuestion.id] === idx ? 'text-blue-900' : 'text-slate-600'}`}>{opt}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-between items-center px-2">
          <button onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))} disabled={currentIndex === 0 || isSubmitting} className="flex items-center gap-2 font-bold text-slate-400 hover:text-slate-700 transition-all">
            <ChevronLeft size={18} /> Anterior
          </button>
          {currentIndex < totalQuestions - 1 ? (
            <button onClick={() => setCurrentIndex(currentIndex + 1)} disabled={isSubmitting} className="flex items-center gap-2 px-10 py-4 bg-slate-900 text-white font-black rounded-2xl shadow-xl">
              Próxima <ChevronRight size={18} />
            </button>
          ) : (
            <button onClick={goToScenario} disabled={isSubmitting} className="flex items-center gap-2 px-10 py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl">
              {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <ChevronRight size={18} />}
              {template.scenarios && template.scenarios.length > 0 ? "Próxima Etapa: Cenário" : "Finalizar Avaliação"}
            </button>
          )}
        </div>
      </main>
    </div>
  );
};

export default TestRunner;
