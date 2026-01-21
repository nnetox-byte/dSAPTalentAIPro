
import { GoogleGenAI, Type } from "@google/genai";
import { BlockType, SeniorityLevel, Question, ImplementationType, AssessmentResult, Candidate, LinkedInAnalysis } from "../types";
import { db } from "./dbService";

export const analyzeLinkedInProfile = async (profileLink: string): Promise<LinkedInAnalysis> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `PAPEL: você é um especialista em análise comportamental DISC com habilidades avançadas em interpretação de perfis digitais. Você usa informações publicamente disponíveis no LinkedIn para identificar tendências comportamentais e determinar o estilo DISC dominante e secundário de um usuário.
    
    CONTEXTO: Link para o perfil: ${profileLink}
    
    INSTRUÇÃO DE ANÁLISE DISC:
    1. Foto do perfil: Avalie a expressão facial, postura, vestimenta e contexto.
    2. Resumo profissional: Pesquise palavras-chave (Resultados/D, Criatividade/I, Colaboração/S, Precisão/C).
    3. Publicações e conteúdo compartilhado: Identificar temas recorrentes.
    4. Interação com a rede: Estilo de respostas.
    
    INSTRUÇÃO TÉCNICA SAP (MUITO IMPORTANTE):
    - Identifique o Módulo SAP baseado nos IDs do sistema: 'pmgt' (Gestão/Liderança), 'btp' (Arquitetura), 'fi', 'sd', etc.
    - Se o perfil for de ALTA GESTÃO ou ARQUITETURA, use 'pmgt' ou 'btp'. NÃO use 'abap' para perfis seniores de liderança.
    - Identifique Senioridade (JUNIOR, PLENO, SENIOR) e Indústrias.

    RETORNE O RESULTADO EM JSON ESTRUTURADO PARA AS SEGUINTES PROPRIEDADES:
    suggestedModule, suggestedLevel, industriesIdentified, executiveSummary, suggestedImplementation,
    disc: { photoAnalysis, summaryAnalysis, postsAnalysis, interactionAnalysis, predominant, secondary, professionalDescription, scores: { dominance, influence, steadiness, compliance } }
    
    Os scores DISC devem ser de 0 a 100 baseados nas evidências.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
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
    
    // Fixed: Await modules before mapping
    const modules = await db.getModules();
    const validModules = modules.map(m => m.id);
    let mod = (data.suggestedModule || "").toLowerCase();
    if (!validModules.includes(mod)) {
      if (mod.includes('project') || mod.includes('management') || mod.includes('gestão')) mod = 'pmgt';
      else if (mod.includes('architecture') || mod.includes('arquiteto') || mod.includes('btp')) mod = 'btp';
      else mod = 'pmgt'; // fallback seguro para perfis seniores linkados a Nelson
    }

    const analysis: LinkedInAnalysis = {
      id: `analysis-${Date.now()}`,
      profileLink,
      analyzedAt: new Date().toISOString(),
      suggestedModule: mod,
      suggestedLevel: data.suggestedLevel || SeniorityLevel.SENIOR,
      industriesIdentified: data.industriesIdentified || ["Cross Industry"],
      executiveSummary: data.executiveSummary || "",
      suggestedImplementation: data.suggestedImplementation || ImplementationType.PRIVATE,
      disc: data.disc
    };

    return analysis;
  } catch (error) {
    console.error("Error in DISC Analysis:", error);
    throw error;
  }
};

export const generateCandidateRecommendation = async (
  candidate: Candidate,
  result: AssessmentResult
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const scoresText = Object.entries(result.blockScores).map(([block, score]) => `${block}: ${score.toFixed(1)}/10`).join(", ");
  const prompt = `Analise o desempenho deste candidato SAP e forneça uma recomendação profissional curta (máximo 150 palavras):
    Candidato: ${candidate.name}
    Módulo: ${candidate.appliedModule}
    Nível Aplicado: ${candidate.appliedLevel}
    Resultados por Pilar: ${scoresText}
    Pontuação Total: ${result.score.toFixed(1)}
    A recomendação deve ser honesta, destacando pontos fortes e áreas de desenvolvimento.`;
  try {
    const response = await ai.models.generateContent({ model: "gemini-3-flash-preview", contents: prompt });
    return response.text || "Recomendação indisponível.";
  } catch (error) { return "Erro na análise de perfil."; }
};

export const generateBulkQuestions = async (
  moduleId: string,
  industryName: string,
  level: SeniorityLevel,
  implementationType: ImplementationType,
  counts: Record<BlockType, number>
): Promise<Question[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const totalQuestions = (Object.values(counts) as number[]).reduce((a, b) => a + b, 0);
  const prompt = `Gere ${totalQuestions} questões de múltipla escolha para Perfil: ${moduleId.toUpperCase()}, Nível: ${level}, Indústria: ${industryName}, Implementação: ${implementationType}. Distribua por blocos conforme solicitado.`;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
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
    return data.map((q: any, idx: number) => ({ ...q, id: `ai-bulk-${Date.now()}-${idx}`, seniority: level, industry: industryName, module: moduleId, implementationType, weight: 1 }));
  } catch (error) { throw error; }
};

export const generateDynamicQuestions = async (
  moduleId: string,
  industryName: string,
  level: SeniorityLevel,
  implementationType: ImplementationType,
  block: BlockType,
  count: number
): Promise<Question[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Gere ${count} questões para ${moduleId}, nível ${level}, indústria ${industryName}, bloco ${block}.`;
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
