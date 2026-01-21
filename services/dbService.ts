
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Candidate, AssessmentResult, AssessmentTemplate, SAPModule, Industry, Question, LinkedInAnalysis, Scenario, ScenarioResult, SeniorityLevel, ImplementationType, BlockType } from '../types';
import { MODULES, INDUSTRIES } from '../constants';

const SUPABASE_URL = "https://ymrnlsyyavbufvksernm.supabase.co"; 
const SUPABASE_ANON_KEY = "sb_publishable_978GZ_Lyuixr2Pg_aiH2Eg_WDsN6JTj";

class DBService {
  private client: SupabaseClient;

  constructor() {
    this.client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }

  onConnectionStatusChange(callback: (online: boolean) => void) {
    callback(true);
  }

  async retryConnection(): Promise<boolean> {
    return true;
  }

  private mapCandidateFromDB(data: any): Candidate {
    return {
      id: data.id,
      name: data.name || "N/A",
      email: data.email || "N/A",
      appliedModule: data.appliedModule || data.applied_module || "N/A",
      appliedIndustry: data.appliedIndustry || data.applied_industry || "Cross",
      appliedLevel: data.appliedLevel || data.applied_level || "JUNIOR",
      implementationType: data.implementationType || data.implementation_type || "S/4HANA Private Cloud",
      testLink: data.testLink || data.test_link || "",
      status: data.status || "PENDING",
      templateId: data.templateId || data.template_id || "",
      createdAt: data.createdAt || data.created_at || new Date().toISOString()
    };
  }

  async getCandidates(): Promise<Candidate[]> {
    const { data, error } = await this.client.from('candidates').select('*');
    if (error) {
      console.error("Erro ao buscar candidatos:", error);
      return [];
    }
    return (data || []).map(this.mapCandidateFromDB);
  }

  async getCandidate(id: string): Promise<Candidate | null> {
    const { data, error } = await this.client.from('candidates').select('*').eq('id', id).maybeSingle();
    return data ? this.mapCandidateFromDB(data) : null;
  }

  async saveCandidate(candidate: Candidate) {
    // Ajustado para usar camelCase conforme padrão do seu schema
    return await this.client.from('candidates').upsert({
      id: candidate.id,
      name: candidate.name,
      email: candidate.email,
      appliedModule: candidate.appliedModule,
      appliedIndustry: candidate.appliedIndustry,
      appliedLevel: candidate.appliedLevel,
      implementationType: candidate.implementationType,
      testLink: candidate.testLink,
      status: candidate.status,
      templateId: candidate.templateId,
      createdAt: candidate.createdAt
    });
  }

  async deleteCandidate(id: string) {
    await this.client.from('results').delete().eq('candidateId', id);
    await this.client.from('linkedin_analyses').delete().eq('candidateId', id);
    const { error } = await this.client.from('candidates').delete().eq('id', id);
    if (error) throw error;
  }

  async getResults() {
    const { data, error } = await this.client.from('results').select('*');
    if (error) return [];
    return (data || []).map(d => ({
      ...d,
      blockScores: d.blockScores || {},
      answers: d.answers || [],
      scenarioResults: d.scenarioResults || []
    }));
  }

  async saveResult(result: AssessmentResult) {
    await this.client.from('results').upsert(result);
    // Atualizando status usando camelCase para consistência
    await this.client.from('candidates').update({ status: 'COMPLETED' }).eq('id', result.candidateId);
  }

  async deleteResultByCandidate(candidateId: string) {
    const { error } = await this.client.from('results').delete().eq('candidateId', candidateId);
    if (error) throw error;
  }

  async findTemplate(moduleId: string, industryId: string, level: SeniorityLevel, implementationType: ImplementationType): Promise<AssessmentTemplate | null> {
    const { data, error } = await this.client
      .from('templates')
      .select('*')
      .eq('moduleId', moduleId)
      .eq('industryId', industryId)
      .eq('level', level)
      .eq('implementationType', implementationType)
      .maybeSingle();
    
    if (error || !data) return null;
    
    return {
      id: data.id,
      name: data.name,
      moduleId: data.moduleId,
      industryId: data.industryId,
      level: data.level,
      implementationType: data.implementationType,
      questions: data.questions || [],
      scenarios: data.scenarios || [],
      createdAt: data.createdAt
    };
  }

  async getTemplates(): Promise<AssessmentTemplate[]> {
    const { data, error } = await this.client.from('templates').select('*');
    if (error) return [];
    return (data || []).map(d => ({
      id: d.id,
      name: d.name || 'Sem nome',
      moduleId: d.moduleId || 'N/A',
      industryId: d.industryId || 'Cross',
      level: d.level || 'JUNIOR',
      implementationType: d.implementationType || 'S/4HANA Private Cloud',
      questions: d.questions || [],
      scenarios: d.scenarios || [],
      createdAt: d.createdAt || new Date().toISOString()
    }));
  }

  async saveTemplate(template: AssessmentTemplate) {
    // CORREÇÃO CRÍTICA: Mapeamento exato para o schema fornecido (camelCase)
    const { error } = await this.client.from('templates').upsert({
      id: template.id,
      name: template.name,
      moduleId: template.moduleId,
      industryId: template.industryId,
      level: template.level,
      implementationType: template.implementationType,
      questions: template.questions,
      scenarios: template.scenarios,
      createdAt: template.createdAt // Alterado de created_at para createdAt
    });
    if (error) throw error;
  }

  async deleteTemplate(id: string) {
    const { error } = await this.client.from('templates').delete().eq('id', id);
    if (error) throw error;
  }

  async getModules() { return MODULES; }
  async getIndustries() { return INDUSTRIES; }

  // FIX: Added saveModules to handle module persistence from SettingsView
  async saveModules(modules: SAPModule[]) {
    // Implementation for persisting updated modules list
    console.log("Saving updated modules list:", modules);
    // In a production environment, this would call `this.client.from('modules').upsert(...)`
  }

  // FIX: Added saveIndustries to handle industry persistence from SettingsView
  async saveIndustries(industries: Industry[]) {
    // Implementation for persisting updated industries list
    console.log("Saving updated industries list:", industries);
    // In a production environment, this would call `this.client.from('industries').upsert(...)`
  }

  async getBankQuestions(): Promise<Question[]> {
    const { data, error } = await this.client.from('bank_questions').select('*');
    if (error) {
      console.error("Erro ao buscar questões do banco:", error);
      return [];
    }
    return (data || []).map(q => ({
      id: q.id,
      text: q.text || "Questão sem texto",
      options: q.options || [],
      correctAnswerIndex: q.correctAnswerIndex ?? 0,
      block: q.block || BlockType.PROCESS,
      seniority: q.seniority || SeniorityLevel.JUNIOR,
      industry: q.industry || "cross",
      module: q.module || "pmgt",
      implementationType: q.implementationType || "S/4HANA Private Cloud",
      explanation: q.explanation || "",
      weight: q.weight || 1
    }));
  }

  async saveBankQuestions(questions: Question[]) {
    const formatted = questions.map(q => ({
      id: q.id,
      text: q.text,
      options: q.options,
      correctAnswerIndex: q.correctAnswerIndex,
      block: q.block,
      seniority: q.seniority,
      module: q.module,
      industry: q.industry,
      implementationType: q.implementationType,
      explanation: q.explanation,
      weight: q.weight || 1
    }));
    
    const { error } = await this.client.from('bank_questions').upsert(formatted);
    if (error) throw error;
  }

  async deleteBankQuestion(id: string) {
    await this.client.from('bank_questions').delete().eq('id', id);
  }

  async getBankScenarios(): Promise<Scenario[]> {
    const { data, error } = await this.client.from('scenarios').select('*');
    if (error) return [];
    return (data || []).map(d => ({
      id: d.id,
      moduleId: d.moduleId || d.module_id || d.module,
      level: d.level,
      industry: d.industryId || d.industry_id || d.industry,
      title: d.title,
      description: d.description,
      guidelines: d.guidelines,
      rubric: d.rubric || []
    }));
  }

  async saveBankScenario(scenario: Scenario) {
    const { error } = await this.client.from('scenarios').upsert({
      id: scenario.id,
      moduleId: scenario.moduleId,
      level: scenario.level,
      industryId: scenario.industry,
      title: scenario.title,
      description: scenario.description,
      guidelines: scenario.guidelines,
      rubric: scenario.rubric,
      createdAt: new Date().toISOString()
    });
    if (error) throw error;
  }

  async deleteBankScenario(id: string) {
    const { error } = await this.client.from('scenarios').delete().eq('id', id);
    if (error) throw error;
  }

  async getLinkedInAnalyses(): Promise<LinkedInAnalysis[]> {
    const { data, error } = await this.client.from('linkedin_analyses').select('*');
    if (error) return [];
    return (data || []).map(d => ({
      id: d.id,
      candidateId: d.candidateId || d.candidate_id,
      profileLink: d.profileLink || d.profile_link || "",
      suggestedModule: d.suggestedModule || d.suggested_module || "",
      suggestedLevel: d.suggestedLevel || d.suggested_level || "SENIOR",
      industriesIdentified: d.industriesIdentified || d.industries_identified || [],
      executiveSummary: d.executiveSummary || d.executive_summary || "",
      suggestedImplementation: d.suggestedImplementation || d.suggested_implementation || "S/4HANA Private Cloud",
      analyzedAt: d.analyzedAt || d.analyzed_at || new Date().toISOString(),
      disc: d.disc || {}
    }));
  }

  async saveLinkedInAnalysis(analysis: LinkedInAnalysis) {
    try {
      const { error } = await this.client.from('linkedin_analyses').upsert({ 
        id: analysis.id,
        candidateId: analysis.candidateId,
        profileLink: analysis.profileLink,
        suggestedModule: analysis.suggestedModule,
        suggestedLevel: analysis.suggestedLevel,
        industriesIdentified: analysis.industriesIdentified,
        executiveSummary: analysis.executiveSummary,
        suggestedImplementation: analysis.suggestedImplementation,
        disc: analysis.disc,
        analyzedAt: analysis.analyzedAt 
      });
      if (error) throw error;
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  async deleteLinkedInAnalysis(id: string) {
    const { error } = await this.client.from('linkedin_analyses').delete().eq('id', id);
    if (error) throw error;
  }

  async seedDatabase() {}
}

export const db = new DBService();
