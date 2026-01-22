
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
  BlockType,
  Profile
} from '../types';
import { MODULES, INDUSTRIES } from '../constants';

const SUPABASE_URL = "https://ymrnlsyyavbufvksernm.supabase.co"; 
const SUPABASE_ANON_KEY = "sb_publishable_978GZ_Lyuixr2Pg_aiH2Eg_WDsN6JTj";

const SUPER_ADMINS = ['nelson.neto@delaware.pro'];

class DBService {
  public client: SupabaseClient;

  constructor() {
    this.client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }

  // --- AUTENTICAÇÃO ---

  async signIn(email: string, pass: string) {
    const { data, error } = await this.client.auth.signInWithPassword({ email, password: pass });
    if (error) throw error;
    return data;
  }

  async signOut() {
    await this.client.auth.signOut();
  }

  async updatePassword(newPassword: string) {
    const { error } = await this.client.auth.updateUser({ password: newPassword });
    if (error) throw error;
  }

  async seedDatabase() {
    await this.saveModules(MODULES);
    await this.saveIndustries(INDUSTRIES);
  }

  async getCurrentProfile(): Promise<Profile | null> {
    try {
      const { data: { session } } = await this.client.auth.getSession();
      if (!session) return null;

      const userEmail = (session.user.email || '').toLowerCase();
      const userId = session.user.id;

      // REGRA DE OURO: Nelson Neto (Super Admin Incondicional)
      if (SUPER_ADMINS.includes(userEmail)) {
        return {
          id: userId,
          email: userEmail,
          perfil_id: 'super-admin-fixed',
          perfil: {
            nome: 'Super Administrador (Fixo)',
            funcionalidades: ['dashboard', 'candidates', 'linkedin_analyses', 'templates', 'access_management', 'config', 'bank']
          }
        };
      }

      // Tenta buscar o perfil no banco
      let { data, error } = await this.client
        .from('profiles')
        .select(`id, email, perfil_id, perfil:perfis (nome, funcionalidades:perfil_funcionalidades (funcionalidade:funcionalidades (slug)))`)
        .eq('id', userId)
        .maybeSingle();

      // Se o usuário logou mas não tem perfil no banco, criamos um básico
      if (!data && !error) {
        const { data: defaultRole } = await this.client
          .from('perfis')
          .select('id')
          .ilike('nome', '%Consultor%')
          .limit(1)
          .maybeSingle();

        if (defaultRole) {
          const { data: newProfile, error: createError } = await this.client
            .from('profiles')
            .insert({
              id: userId,
              email: userEmail,
              perfil_id: defaultRole.id
            })
            .select(`id, email, perfil_id, perfil:perfis (nome, funcionalidades:perfil_funcionalidades (funcionalidade:funcionalidades (slug)))`)
            .single();
          
          if (!createError) data = newProfile;
        }
      }

      if (!data) return null;

      const funcionalidades = data.perfil?.funcionalidades?.map((f: any) => 
        f.funcionalidade?.slug || f.funcionalidade_id
      ).filter(Boolean) || [];

      return {
        id: data.id,
        email: data.email || userEmail,
        perfil_id: data.perfil_id,
        perfil: { nome: data.perfil?.nome || 'Sem Perfil', funcionalidades }
      };
    } catch (err) {
      return null;
    }
  }

  // --- GESTÃO DE ACESSOS (PERFIS E FUNCIONALIDADES) ---

  async getFeatures() {
    const { data, error } = await this.client.from('funcionalidades').select('*').order('nome');
    if (error) throw error;
    return data;
  }

  async saveFeature(nome: string, slug: string) {
    const { error } = await this.client.from('funcionalidades').upsert({ nome, slug });
    if (error) throw error;
  }

  async deleteFeature(id: string) {
    const { error } = await this.client.from('funcionalidades').delete().eq('id', id);
    if (error) throw error;
  }

  async getProfilesWithFeatures() {
    const { data, error } = await this.client
      .from('perfis')
      .select('*, funcionalidades:perfil_funcionalidades(funcionalidade_id)')
      .order('nome');
    if (error) throw error;
    return data;
  }

  async saveProfile(id: string | undefined, nome: string, descricao: string, featureIds: string[]) {
    // 1. Salva/Atualiza Perfil
    const { data: profile, error: pError } = await this.client
      .from('perfis')
      .upsert({ id: id || undefined, nome, descricao })
      .select()
      .single();
    
    if (pError) throw pError;

    // 2. Limpa relações antigas
    await this.client.from('perfil_funcionalidades').delete().eq('perfil_id', profile.id);

    // 3. Insere novas relações
    if (featureIds.length > 0) {
      const relations = featureIds.map(fid => ({ perfil_id: profile.id, funcionalidade_id: fid }));
      const { error: rError } = await this.client.from('perfil_funcionalidades').insert(relations);
      if (rError) throw rError;
    }
  }

  async deleteProfile(id: string) {
    const { error } = await this.client.from('perfis').delete().eq('id', id);
    if (error) throw error;
  }

  // --- CANDIDATOS ---

  async getCandidate(id: string): Promise<Candidate | null> {
    const { data } = await this.client.from('candidates').select('*').eq('id', id).maybeSingle();
    return data ? this.mapCandidateFromDB(data) : null;
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
    const { data } = await this.client.from('candidates').select('*');
    return (data || []).map(this.mapCandidateFromDB);
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
    if (error) throw error;
  }

  async deleteCandidate(id: string) {
    await this.client.from('results').delete().eq('candidateId', id);
    const { error } = await this.client.from('candidates').delete().eq('id', id);
    if (error) throw error;
  }

  async getTemplate(id: string): Promise<AssessmentTemplate | null> {
    const { data } = await this.client.from('templates').select('*').eq('id', id).maybeSingle();
    if (!data) return null;
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
    const { data } = await this.client.from('templates').select('*');
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
    if (error) throw error;
  }

  async deleteTemplate(id: string) {
    const { error } = await this.client.from('templates').delete().eq('id', id);
    if (error) throw error;
  }

  async getModules(): Promise<SAPModule[]> {
    const { data } = await this.client.from('settings').select('value').eq('key', 'modules').maybeSingle();
    if (!data || !data.value) return MODULES;
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
    const { data } = await this.client.from('settings').select('value').eq('key', 'industries').maybeSingle();
    if (!data || !data.value) return INDUSTRIES;
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

  async getBankQuestions(): Promise<Question[]> {
    const { data } = await this.client.from('bank_questions').select('*');
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
    if (error) throw error;
  }

  async getBankScenarios(): Promise<Scenario[]> {
    const { data } = await this.client.from('scenarios').select('*');
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
    if (error) throw error;
  }

  async deleteBankScenario(id: string): Promise<void> {
    const { error } = await this.client.from('scenarios').delete().eq('id', id);
    if (error) throw error;
  }

  async getLinkedInAnalyses(): Promise<LinkedInAnalysis[]> {
    const { data } = await this.client.from('linkedin_analyses').select('*');
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
    if (error) return { success: false, error: error.message };
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
    if (error) throw error;
    await this.client.from('candidates').update({ status: 'COMPLETED' }).eq('id', result.candidateId);
  }

  async getResults(): Promise<AssessmentResult[]> {
    const { data } = await this.client.from('results').select('*');
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
