export enum UserRole {
  ADMIN = 'ADMIN',
  RH = 'RH',
  DELIVERY = 'DELIVERY',
  CANDIDATE = 'CANDIDATE'
}

export enum SeniorityLevel {
  JUNIOR = 'JUNIOR',
  PLENO = 'PLENO',
  SENIOR = 'SENIOR'
}

export enum ImplementationType {
  PRIVATE = 'S/4HANA Private Cloud',
  PUBLIC = 'S/4HANA Public Cloud'
}

export enum BlockType {
  MASTER_DATA = 'Dados Mestres',
  PROCESS = 'Processo',
  SOFT_SKILL = 'SoftSkill',
  SAP_ACTIVATE = 'SAP Activate',
  CLEAN_CORE = 'Clean Core'
}

export interface Industry {
  id: string;
  name: string;
}

export interface SAPModule {
  id: string;
  name: string;
  category: 'TECHNICAL' | 'FUNCTIONAL' | 'MANAGEMENT';
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswerIndex: number;
  block: BlockType;
  seniority: SeniorityLevel;
  industry: string;
  module: string;
  implementationType: ImplementationType;
  explanation?: string;
  weight?: number;
}

export interface AssessmentTemplate {
  id: string;
  name: string;
  moduleId: string;
  industryId: string;
  level: SeniorityLevel;
  implementationType: ImplementationType;
  questions: Question[];
  createdAt: string;
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  appliedModule: string;
  appliedIndustry: string;
  appliedLevel: SeniorityLevel;
  implementationType: ImplementationType;
  testLink: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  templateId?: string;
  createdAt: string;
}

export interface AssessmentResult {
  id: string;
  candidateId: string;
  templateId: string;
  score: number;
  blockScores: Record<BlockType, number>;
  answers: {
    questionId: string;
    selectedOption: number;
    isCorrect: boolean;
    block: BlockType;
  }[];
  completedAt: string;
  reportSentTo: string[]; // Emails para quem o relatório foi enviado
}

export interface LinkedInAnalysis {
  id: string;
  profileLink: string;
  analyzedAt: string;
  suggestedModule: string;
  suggestedLevel: SeniorityLevel;
  industriesIdentified: string[];
  executiveSummary: string;
  suggestedImplementation: ImplementationType;
  disc: {
    photoAnalysis: string;
    summaryAnalysis: string;
    postsAnalysis: string;
    interactionAnalysis: string;
    predominant: string;
    secondary: string;
    professionalDescription: string;
    scores: {
      dominance: number;
      influence: number;
      steadiness: number;
      compliance: number;
    };
  };
}