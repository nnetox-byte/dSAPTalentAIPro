
import { GoogleGenAI, Type } from "@google/genai";
import { BlockType, SeniorityLevel, Question, ImplementationType } from "../types";
import { db } from "./dbService";

export const generateBulkQuestions = async (
  moduleId: string,
  industryName: string,
  level: SeniorityLevel,
  implementationType: ImplementationType,
  counts: Record<BlockType, number>
): Promise<Question[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const moduleInfo = db.getModules().find(m => m.id === moduleId);
  const category = moduleInfo?.category || 'FUNCTIONAL';
  const totalQuestions = (Object.values(counts) as number[]).reduce((a, b) => a + b, 0);

  let implContext = "";
  if (implementationType === ImplementationType.PUBLIC) {
    implContext = `
    CONTEXTO SAP S/4HANA PUBLIC CLOUD:
    - Foco total em processos STANDARD e "Best Practices".
    - Clean Core é mandatário: utilize apenas APIs públicas, Side-by-side extensibility (BTP) e Key-user extensibility.
    - Metodologia Activate focada em Fit-to-Standard.
    - Proibido qualquer menção a modificações de código standard ou transações legadas incompatíveis com Public Cloud.`;
  } else {
    implContext = `
    CONTEXTO SAP S/4HANA PRIVATE CLOUD:
    - Foco em flexibilidade corporativa mantendo o Core estável.
    - Permite ABAP Cloud e Extensibilidade On-Stack.
    - Metodologia RISE with SAP e migração Greenfield/Brownfield.
    - Foco em manter o sistema "Cloud-Ready".`;
  }

  let specificContext = "";
  if (moduleId === 'pmgt') {
    specificContext = `
    PERFIL: GERENTE DE PROJETOS (PMGT):
    - NÃO gere questões sobre transações funcionais (MIGO, VA01, etc).
    - FOCO: Metodologias (Activate para ${implementationType}), Governança, Stakeholders, Gestão de Riscos, Cronogramas e Orçamentos.
    - 'Clean Core' para PMs: Gestão da governança para evitar customizações desnecessárias.`;
  } else if (category === 'TECHNICAL') {
    specificContext = `
    PERFIL: CONSULTOR TÉCNICO (${moduleId.toUpperCase()}):
    - FOCO: Arquitetura, Performance, BTP, Integrações e APIs.
    - 'Clean Core': Uso de RAP (RESTful ABAP Programming), OData e extensibilidade desacoplada.`;
  } else {
    specificContext = `
    PERFIL: CONSULTOR FUNCIONAL (${moduleId.toUpperCase()}):
    - FOCO: Processos de Negócio do módulo ${moduleId}, Configuração e Localização Brasil.
    - 'Clean Core': Configuração standard e uso de ferramentas low-code/no-code para extensões.`;
  }

  const prompt = `VOCÊ É UM EXPERTE EM SAP NÍVEL PLATINUM.
    Gere ${totalQuestions} questões de múltipla escolha para:
    - Perfil: ${moduleId.toUpperCase()}
    - Nível: ${level}
    - Indústria: ${industryName}
    - Implementação: ${implementationType}
    
    ${implContext}
    ${specificContext}

    REGRAS DE DISTRIBUIÇÃO (EXATAMENTE):
    - ${BlockType.MASTER_DATA}: ${counts[BlockType.MASTER_DATA]} questões.
    - ${BlockType.PROCESS}: ${counts[BlockType.PROCESS]} questões.
    - ${BlockType.SOFT_SKILL}: ${counts[BlockType.SOFT_SKILL]} questões.
    - ${BlockType.SAP_ACTIVATE}: ${counts[BlockType.SAP_ACTIVATE]} questões.
    - ${BlockType.CLEAN_CORE}: ${counts[BlockType.CLEAN_CORE]} questões.

    REGRAS GERAIS:
    1. 4 opções por questão.
    2. SoftSkills: cenários reais de projeto para ${level}.
    3. Idioma: Português do Brasil.
    4. PROIBIDO misturar módulos funcionais. Se o perfil é ${moduleId}, as questões técnicas devem ser apenas de ${moduleId}.`;

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
    return data.map((q: any, idx: number) => ({
      ...q,
      id: `ai-bulk-${moduleId}-${level}-${Date.now()}-${idx}`,
      seniority: level,
      industry: industryName,
      module: moduleId,
      implementationType: implementationType,
      weight: 1
    }));
  } catch (error) {
    console.error("Error in bulk generation:", error);
    throw error;
  }
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
  const prompt = `Gere ${count} questões técnicas SAP para ${moduleId}, nível ${level}, indústria ${industryName}, implementação ${implementationType}, focado em ${block}.`;

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
    return data.map((q: any, idx: number) => ({
      ...q,
      id: `ai-dyn-${block}-${Date.now()}-${idx}`,
      block,
      seniority: level,
      industry: industryName,
      module: moduleId,
      implementationType,
      weight: 1
    }));
  } catch (error) {
    console.error("Error generating dynamic questions:", error);
    return [];
  }
};
