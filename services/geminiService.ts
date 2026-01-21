
import { GoogleGenAI, Type } from "@google/genai";
import { BlockType, SeniorityLevel, Question, ImplementationType, AssessmentResult, Candidate, LinkedInAnalysis, Scenario, ScenarioResult } from "../types";
import { db } from "./dbService";

export const generateSAPScenario = async (
  module: string,
  level: SeniorityLevel,
  industry: string,
  implType: ImplementationType
): Promise<Scenario> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Você é um Arquiteto SAP Master. Gere um cenário de problema prático (Case Study) para um consultor ${level} de ${module.toUpperCase()} na indústria ${industry} (Modelo: ${implType}).

  O cenário deve envolver um desafio técnico/funcional real que exija conhecimento de transações, parametrização ou arquitetura.

  REQUISITOS DO JSON:
  - title: Um nome profissional para o caso.
  - description: O problema detalhado (máximo 500 palavras).
  - guidelines: O que o candidato deve explicar na resposta (ex: passos na SPRO, transações, lógica ABAP).
  - rubric: Uma lista (array) de critérios de avaliação "invisíveis" (ex: [{"criterion": "identificação da causa raiz", "points": "5 pontos"}]).`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            guidelines: { type: Type.STRING },
            rubric: { 
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  criterion: { type: Type.STRING },
                  points: { type: Type.STRING }
                },
                required: ["criterion", "points"]
              }
            }
          },
          required: ["title", "description", "guidelines", "rubric"]
        }
      }
    });

    const data = JSON.parse(response.text || "{}");
    return {
      id: `scen-${Date.now()}`,
      moduleId: module,
      level,
      industry,
      ...data
    };
  } catch (error) {
    console.error("Erro ao gerar cenário:", error);
    throw error;
  }
};

export const evaluateScenarioResponse = async (
  scenario: Scenario,
  candidateAnswer: string
): Promise<{ score: number; feedback: string }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Aja como um Avaliador Técnico SAP Sênior. Avalie a resposta do candidato para o seguinte cenário:

  CENÁRIO: ${scenario.title}
  DESCRIÇÃO: ${scenario.description}
  RUBRICA/CRITÉRIOS: ${JSON.stringify(scenario.rubric)}

  RESPOSTA DO CANDIDATO:
  "${candidateAnswer}"

  Dê uma nota de 0 a 10 e um feedback construtivo destacando o que faltou ou o que foi excelente. Retorne apenas JSON.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            feedback: { type: Type.STRING }
          },
          required: ["score", "feedback"]
        }
      }
    });

    return JSON.parse(response.text || '{"score": 0, "feedback": "Erro na avaliação."}');
  } catch (error) {
    return { score: 0, feedback: "A IA não pôde processar a resposta." };
  }
};

export const analyzeLinkedInProfile = async (profileLink: string): Promise<LinkedInAnalysis> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `PAPEL: especialista DISC e Recrutador SAP. Analise o perfil do LinkedIn: ${profileLink}
  
  Utilize ferramentas de busca se necessário para coletar dados públicos.
  Identifique o pilar comportamental DISC e sugira o fit técnico para o ecossistema SAP.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestedModule: { type: Type.STRING },
            suggestedLevel: { type: Type.STRING, enum: Object.values(SeniorityLevel) },
            industriesIdentified: { type: Type.ARRAY, items: { type: Type.STRING } },
            executiveSummary: { type: Type.STRING },
            suggestedImplementation: { type: Type.STRING, enum: Object.values(ImplementationType) },
            disc: {
              type: Type.OBJECT,
              properties: {
                photoAnalysis: { type: Type.STRING },
                summaryAnalysis: { type: Type.STRING },
                postsAnalysis: { type: Type.STRING },
                interactionAnalysis: { type: Type.STRING },
                predominant: { type: Type.STRING },
                secondary: { type: Type.STRING },
                professionalDescription: { type: Type.STRING },
                scores: {
                  type: Type.OBJECT,
                  properties: {
                    dominance: { type: Type.NUMBER },
                    influence: { type: Type.NUMBER },
                    steadiness: { type: Type.NUMBER },
                    compliance: { type: Type.NUMBER }
                  }
                }
              },
              required: ["predominant", "secondary", "scores"]
            }
          },
          required: ["suggestedModule", "suggestedLevel", "disc"]
        }
      }
    });
    const data = JSON.parse(response.text || "{}");
    const analysis: LinkedInAnalysis = {
      id: `analysis-${Date.now()}`,
      profileLink,
      analyzedAt: new Date().toISOString(),
      suggestedModule: data.suggestedModule || 'pmgt',
      suggestedLevel: data.suggestedLevel || SeniorityLevel.SENIOR,
      industriesIdentified: data.industriesIdentified || ["Cross Industry"],
      executiveSummary: data.executiveSummary || "",
      suggestedImplementation: data.suggestedImplementation || ImplementationType.PRIVATE,
      disc: data.disc
    };
    return analysis;
  } catch (error) { throw error; }
};

export const generateCandidateRecommendation = async (candidate: Candidate, result: AssessmentResult): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const scoresText = Object.entries(result.blockScores).map(([block, score]) => `${block}: ${score.toFixed(1)}/10`).join(", ");
  const prompt = `Analise o desempenho deste candidato SAP e forneça uma recomendação profissional curta:
    Candidato: ${candidate.name}
    Módulo: ${candidate.appliedModule}
    Nível: ${candidate.appliedLevel}
    Resultados por Pilar: ${scoresText}
    Pontuação Total: ${result.score.toFixed(1)}
    Inclua avaliação do cenário aberto se disponível.`;
  try {
    const response = await ai.models.generateContent({ model: "gemini-3-flash-preview", contents: prompt });
    return response.text || "";
  } catch (error) { return ""; }
};

export const generateBulkQuestions = async (moduleId: string, industryId: string, level: SeniorityLevel, implementationType: ImplementationType, counts: Record<BlockType, number>): Promise<Question[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const totalQuestions = (Object.values(counts) as number[]).reduce((a, b) => a + b, 0);
  
  const prompt = `Gere ${totalQuestions} questões SAP para o módulo ID: ${moduleId} na indústria ID: ${industryId} para nível ${level} no modelo ${implementationType}.
  Siga a distribuição exata por blocos (pilares): ${JSON.stringify(counts)}.
  Retorne um ARRAY de objetos JSON seguindo estritamente o esquema fornecido.`;
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              correctAnswerIndex: { type: Type.INTEGER },
              block: { type: Type.STRING, enum: Object.values(BlockType) },
              explanation: { type: Type.STRING }
            },
            required: ["text", "options", "correctAnswerIndex", "block"]
          }
        }
      }
    });
    
    const data = JSON.parse(response.text || "[]");
    return data.map((q: any, idx: number) => ({ 
      ...q, 
      id: `ai-bulk-${Date.now()}-${idx}`, 
      seniority: level, 
      industry: industryId, 
      module: moduleId, 
      implementationType, 
      weight: 1 
    }));
  } catch (error) { 
    console.error("Erro no Gemini Bulk Generation:", error);
    throw error; 
  }
};

export const generateDynamicQuestions = async (moduleId: string, industryName: string, level: SeniorityLevel, implementationType: ImplementationType, block: BlockType, count: number): Promise<Question[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Gere ${count} questões SAP para o bloco ${block} no contexto de ${moduleId} (${industryName}) nível ${level} (${implementationType}).`;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              correctAnswerIndex: { type: Type.INTEGER },
              explanation: { type: Type.STRING }
            },
            required: ["text", "options", "correctAnswerIndex"]
          }
        }
      }
    });
    const data = JSON.parse(response.text || "[]");
    return data.map((q: any, idx: number) => ({ ...q, id: `ai-dyn-${Date.now()}-${idx}`, block, seniority: level, industry: industryName, module: moduleId, implementationType, weight: 1 }));
  } catch (error) { return []; }
};
