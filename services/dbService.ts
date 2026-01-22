
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { 
  Candidate, 
  AssessmentResult, 
  AssessmentTemplate, 
  SAPModule, 
  Industry, 
  Question, 
  LinkedInAnalysis, 
  Scenario, 
  SeniorityLevel, 
  ImplementationType, 
  BlockType 
} from '../types';
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

  async seedDatabase() {
    try {
      await this.saveModules(MODULES);
      await this.saveIndustries(INDUSTRIES);
      return true;
    } catch (e) {
      console.error("Erro ao seedar banco:", e);
      return false;
    }
  }

  private mapCandidateFromDB(data: any): Candidate {
    return {
      id: data.id,
      name: data.name || "N/A",
      email: data.email || "N/A",
      appliedModule: data.applied_module || data.appliedModule || "N/A",
      appliedIndustry: data.applied_industry || data.appliedIndustry || "cross",
      appliedLevel: (data.applied_level || data.appliedLevel) as SeniorityLevel || SeniorityLevel.JUNIOR,
      implementationType: (data.implementation_type || data.implementationType) as ImplementationType || ImplementationType.PRIVATE,
      testLink: data.test_link || data.testLink || "",
      status: data.status || "PENDING",
      templateId: data.template_id || data.templateId || "",
      createdAt: data.created_at || data.createdAt || new Date().toISOString(),
      jobContext: data.job_context || ""
    };
  }

  async getCandidates(): Promise<Candidate[]> {
    const { data, error } = await this.client.from('candidates').select('*');
    if (error) {
      console.error("❌ Erro ao buscar candidatos:", error);
      return [];
    }
    return (data || []).map(this.mapCandidateFromDB);
  }

  async getCandidate(id: string): Promise<Candidate | null> {
    const { data, error } = await this.client.from('candidates').select('*').eq('id', id).maybeSingle();
    return data ? this.mapCandidateFromDB(data) : null;
  }

  async saveCandidate(candidate: Candidate) {
    const { error } = await this.client.from('candidates').upsert({
      id: candidate.id,
      name: candidate.name,
      email: candidate.email,
      applied_module: candidate.appliedModule,
      applied_industry: candidate.appliedIndustry,
      applied_level: candidate.appliedLevel,
      implementation_type: candidate.implementationType,
      test_link: candidate.testLink,
      status: candidate.status,
      template_id: candidate.templateId,
      created_at: candidate.createdAt,
      job_context: candidate.jobContext
    });

    if (error) {
      console.error("❌ Erro Supabase (saveCandidate):", error);
      throw error;
    }
  }

  async deleteCandidate(id: string) {
    await this.client.from('results').delete().eq('candidateId', id);
    const { error } = await this.client.from('candidates').delete().eq('id', id);
    if (error) throw error;
  }

  async getTemplate(id: string): Promise<AssessmentTemplate | null> {
    const { data, error } = await this.client.from('templates').select('*').eq('id', id).maybeSingle();
    if (!data || error) return null;
    return {
      id: data.id,
      name: data.name,
      moduleId: data.moduleId,
      industryId: data.industryId,
      level: data.level as SeniorityLevel,
      implementationType: data.implementationType as ImplementationType,
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
      industryId: d.industryId || 'cross',
      level: (d.level as SeniorityLevel) || SeniorityLevel.JUNIOR,
      implementationType: (d.implementationType as ImplementationType) || ImplementationType.PRIVATE,
      questions: d.questions || [],
      scenarios: d.scenarios || [],
      createdAt: d.createdAt || new Date().toISOString()
    }));
  }

  async saveTemplate(template: AssessmentTemplate) {
    const { error } = await this.client.from('templates').upsert({
      id: template.id,
      name: template.name,
      moduleId: template.moduleId,
      industryId: template.industryId,
      level: template.level,
      implementationType: template.implementationType,
      questions: template.questions,
      scenarios: template.scenarios || [],
      createdAt: template.createdAt
    });

    if (error) {
      console.error("❌ Erro Supabase (saveTemplate):", error);
      throw error;
    }
  }

  async deleteTemplate(id: string) {
    const { error } = await this.client.from('templates').delete().eq('id', id);
    if (error) throw error;
  }

  // --- CONFIGURAÇÕES VIA TABELA SETTINGS ---

  async getModules(): Promise<SAPModule[]> {
    const { data, error } = await this.client.from('settings').select('value').eq('key', 'modules').maybeSingle();
    if (error || !data || !data.value) return MODULES;
    return data.value;
  }

  async saveModules(modules: SAPModule[]) {
    const { error } = await this.client.from('settings').upsert({ key: 'modules', value: modules });
    if (error) throw error;
  }

  async deleteModule(id: string) {
    const current = await this.getModules();
    const updated = current.filter(m => m.id !== id);
    await this.saveModules(updated);
  }

  async getIndustries(): Promise<Industry[]> {
    const { data, error } = await this.client.from('settings').select('value').eq('key', 'industries').maybeSingle();
    if (error || !data || !data.value) return INDUSTRIES;
    return data.value;
  }

  async saveIndustries(industries: Industry[]) {
    const { error } = await this.client.from('settings').upsert({ key: 'industries', value: industries });
    if (error) throw error;
  }

  async deleteIndustry(id: string) {
    const current = await this.getIndustries();
    const updated = current.filter(i => i.id !== id);
    await this.saveIndustries(updated);
  }

  // --- FIM CONFIGURAÇÕES ---

  async getBankQuestions(): Promise<Question[]> {
    const { data, error } = await this.client.from('bank_questions').select('*');
    if (error) {
      console.error("❌ Erro ao buscar questões do banco:", error);
      return [];
    }
    return (data || []).map((q: any) => ({
      id: q.id,
      text: q.text,
      options: q.options || [],
      correctAnswerIndex: q.correctAnswerIndex || q.correct_answer_index,
      block: (q.block || BlockType.PROCESS) as BlockType,
      seniority: (q.seniority || q.seniority_level || SeniorityLevel.JUNIOR) as SeniorityLevel,
      industry: q.industry || q.industry_id || 'cross',
      module: q.module || q.module_id || 'pmgt',
      implementationType: (q.implementationType || q.implementation_type || ImplementationType.PRIVATE) as ImplementationType,
      explanation: q.explanation,
      weight: q.weight || 1
    }));
  }

  async saveBankQuestions(questions: Question[]) {
    const dataToSave = questions.map(q => ({
      id: q.id,
      text: q.text,
      options: q.options,
      correct_answer_index: q.correctAnswerIndex,
      block: q.block,
      seniority_level: q.seniority,
      industry_id: q.industry,
      module_id: q.module,
      implementation_type: q.implementationType,
      explanation: q.explanation,
      weight: q.weight
    }));
    const { error } = await this.client.from('bank_questions').upsert(dataToSave);
    if (error) {
      console.error("❌ Erro ao salvar questões no banco:", error);
      throw error;
    }
  }

  async getBankScenarios(): Promise<Scenario[]> {
    const { data, error } = await this.client.from('scenarios').select('*');
    if (error) {
      console.error("❌ Erro ao buscar cenários:", error);
      return [];
    }
    return (data || []).map(d => ({
      id: d.id,
      moduleId: d.module_id || d.moduleId,
      level: (d.level as SeniorityLevel),
      industry: d.industry || d.industryId,
      title: d.title,
      description: d.description,
      guidelines: d.guidelines,
      rubric: d.rubric || []
    }));
  }

  async saveBankScenario(scenario: Scenario) {
    const { error } = await this.client.from('scenarios').upsert({
      id: scenario.id,
      module_id: scenario.moduleId,
      level: scenario.level,
      industry: scenario.industry,
      title: scenario.title,
      description: scenario.description,
      guidelines: scenario.guidelines,
      rubric: scenario.rubric,
      created_at: new Date().toISOString()
    });
    if (error) {
      console.error("❌ Erro Supabase (saveBankScenario):", error);
      throw error;
    }
  }

  async deleteBankScenario(id: string): Promise<void> {
    const { error } = await this.client.from('scenarios').delete().eq('id', id);
    if (error) throw error;
  }

  async getLinkedInAnalyses(): Promise<LinkedInAnalysis[]> {
    const { data, error } = await this.client.from('linkedin_analyses').select('*');
    if (error) {
      console.error("❌ Erro ao buscar análises LinkedIn:", error);
      return [];
    }
    return (data || []).map(d => ({
      id: d.id,
      candidateId: d.candidate_id || d.candidateId,
      profileLink: d.profileLink || d.profile_link || "LinkedIn Profile",
      suggestedModule: d.suggestedModule || d.suggested_module || "N/A",
      suggestedLevel: (d.suggestedLevel || d.suggested_level || SeniorityLevel.SENIOR) as SeniorityLevel,
      industriesIdentified: d.industriesIdentified || d.industries_identified || [],
      executiveSummary: d.executiveSummary || d.executive_summary || "",
      suggestedImplementation: (d.suggestedImplementation || d.suggested_implementation || ImplementationType.PRIVATE) as ImplementationType,
      analyzedAt: d.analyzedAt || d.analyzed_at || new Date().toISOString(),
      disc: d.disc || { scores: { dominance: 0, influence: 0, steadiness: 0, compliance: 0 }, predominant: "N/A" }
    }));
  }

  async saveLinkedInAnalysis(analysis: LinkedInAnalysis) {
    const { error } = await this.client.from('linkedin_analyses').upsert({ 
      id: analysis.id,
      candidate_id: analysis.candidateId,
      profileLink: analysis.profileLink,
      suggestedModule: analysis.suggestedModule,
      suggestedLevel: analysis.suggestedLevel,
      industriesIdentified: analysis.industriesIdentified,
      executiveSummary: analysis.executiveSummary,
      suggestedImplementation: analysis.suggestedImplementation,
      disc: analysis.disc,
      analyzedAt: analysis.analyzedAt 
    });
    if (error) {
      console.error("❌ Erro ao salvar análise LinkedIn:", error);
      return { success: false, error: error.message };
    }
    return { success: true };
  }

  async deleteLinkedInAnalysis(id: string): Promise<{ success: boolean; error?: string }> {
    const { error } = await this.client.from('linkedin_analyses').delete().eq('id', id);
    if (error) {
      console.error("❌ Erro ao excluir análise LinkedIn:", error);
      return { success: false, error: error.message };
    }
    return { success: true };
  }

  async saveResult(result: AssessmentResult) {
    const { error } = await this.client.from('results').upsert({
      id: result.id,
      candidateId: result.candidateId,
      templateId: result.templateId,
      score: result.score,
      blockScores: result.blockScores,
      answers: result.answers,
      scenarioResults: result.scenarioResults || [],
      completedAt: result.completedAt
    });

    if (error) {
      console.error("❌ Erro Supabase (saveResult):", error);
      throw error;
    }

    await this.client.from('candidates').update({ status: 'COMPLETED' }).eq('id', result.candidateId);
  }

  async getResults(): Promise<AssessmentResult[]> {
    const { data, error } = await this.client.from('results').select('*');
    if (error) return [];
    return (data || []).map(d => ({
      id: d.id,
      candidateId: d.candidateId || d.candidate_id,
      templateId: d.templateId || d.template_id,
      score: d.score,
      blockScores: d.blockScores || d.block_scores || {},
      answers: d.answers || [],
      scenarioResults: d.scenarioResults || d.scenario_results || [],
      completedAt: d.completedAt || d.completed_at,
      reportSentTo: d.reportSentTo || d.report_sent_to || []
    }));
  }
}

export const db = new DBService();
