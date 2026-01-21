
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Candidate, AssessmentResult, AssessmentTemplate, SAPModule, Industry, Question, LinkedInAnalysis } from '../types';
import { MODULES, INDUSTRIES } from '../constants';

const SUPABASE_URL = "https://ymrnlsyyavbufvksernm.supabase.co"; 
const SUPABASE_ANON_KEY = "sb_publishable_978GZ_Lyuixr2Pg_aiH2Eg_WDsN6JTj";

class DBService {
  private client: SupabaseClient;
  private isOnline = false;
  private connectionChecked = false;
  private statusListeners: ((status: boolean) => void)[] = [];

  constructor() {
    this.client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    this.checkConnection();
  }

  private async checkConnection() {
    try {
      const { error } = await this.client.from('settings').select('key').limit(1);
      this.isOnline = !error;
      this.connectionChecked = true;
      this.notifyListeners();
    } catch {
      this.isOnline = false;
      this.connectionChecked = true;
      this.notifyListeners();
    }
  }

  private notifyListeners() {
    this.statusListeners.forEach(l => l(this.isOnline));
  }

  onConnectionStatusChange(callback: (online: boolean) => void) {
    this.statusListeners.push(callback);
    callback(this.isOnline);
  }

  async retryConnection(): Promise<boolean> {
    await this.checkConnection();
    return this.isOnline;
  }

  private mapCandidateFromDB(data: any): Candidate {
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      appliedModule: data.applied_module || data.appliedModule,
      appliedIndustry: data.applied_industry || data.appliedIndustry,
      appliedLevel: data.applied_level || data.appliedLevel,
      implementationType: data.implementation_type || data.implementationType,
      testLink: data.test_link || data.testLink,
      status: data.status,
      templateId: data.template_id || data.templateId,
      createdAt: data.created_at || data.createdAt
    };
  }

  async getCandidates(): Promise<Candidate[]> {
    try {
      const { data, error } = await this.client
        .from('candidates')
        .select('*')
        .order('created_at', { ascending: false, nullsFirst: false });
      
      if (error) throw error;
      
      const mapped = (data || []).map(this.mapCandidateFromDB);
      localStorage.setItem('sb_candidates', JSON.stringify(mapped));
      return mapped;
    } catch (e) {
      const local = localStorage.getItem('sb_candidates');
      return local ? JSON.parse(local) : [];
    }
  }

  async getCandidate(id: string): Promise<Candidate | null> {
    try {
      const { data, error } = await this.client
        .from('candidates')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data ? this.mapCandidateFromDB(data) : null;
    } catch (e) {
      const list = JSON.parse(localStorage.getItem('sb_candidates') || '[]');
      return list.find((c: any) => c.id === id) || null;
    }
  }

  async saveCandidate(candidate: Candidate): Promise<{ success: boolean; error?: string }> {
    try {
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
        created_at: candidate.createdAt
      });
      
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  async deleteCandidate(id: string): Promise<void> {
    try {
      await this.client.from('candidates').delete().eq('id', id);
    } catch (e) {}
  }

  async getResults(): Promise<AssessmentResult[]> {
    try {
      const { data, error } = await this.client.from('results').select('*');
      if (error) throw error;
      
      return (data || []).map(d => ({ 
        id: d.id,
        candidateId: d.candidateId,
        templateId: d.templateId,
        score: d.score,
        blockScores: d.blockScores,
        answers: d.answers,
        completedAt: d.completedAt,
        reportSentTo: d.reportSentTo || []
      }));
    } catch (e) {
      return JSON.parse(localStorage.getItem('sb_results') || '[]');
    }
  }

  async saveResult(result: AssessmentResult): Promise<void> {
    try {
      const { error } = await this.client.from('results').upsert({ 
        id: result.id,
        candidateId: result.candidateId,
        templateId: result.templateId,
        score: result.score,
        blockScores: result.blockScores,
        answers: result.answers,
        completedAt: result.completedAt,
        reportSentTo: Array.isArray(result.reportSentTo) ? result.reportSentTo : []
      });
      
      if (error) throw new Error(error.message);

      await this.client.from('candidates').update({ status: 'COMPLETED' }).eq('id', result.candidateId);
      const currentLocal = JSON.parse(localStorage.getItem('sb_results') || '[]');
      localStorage.setItem('sb_results', JSON.stringify([...currentLocal, result]));
    } catch (e: any) {
      throw e; 
    }
  }

  async getTemplates(): Promise<AssessmentTemplate[]> {
    try {
      const { data, error } = await this.client.from('templates').select('*');
      if (error) throw error;
      return (data || []).map(d => ({
        id: d.id,
        name: d.name,
        moduleId: d.module_id || d.moduleId,
        industryId: d.industry_id || d.industryId,
        level: d.level,
        implementationType: d.implementation_type || d.implementationType,
        questions: d.questions,
        createdAt: d.created_at || d.createdAt
      }));
    } catch (e) {
      return JSON.parse(localStorage.getItem('sb_templates') || '[]');
    }
  }

  async saveTemplate(template: AssessmentTemplate): Promise<{ success: boolean; error?: string }> {
    try {
      // Tentativa 1: snake_case
      const { error } = await this.client.from('templates').upsert({
        id: template.id,
        name: template.name,
        module_id: template.moduleId,
        industry_id: template.industryId,
        level: template.level,
        implementation_type: template.implementationType,
        questions: template.questions,
        created_at: template.createdAt
      });
      
      if (error) {
        // Tentativa 2: camelCase
        const { error: error2 } = await this.client.from('templates').upsert({
          id: template.id,
          name: template.name,
          moduleId: template.moduleId,
          industryId: template.industryId,
          level: template.level,
          implementationType: template.implementationType,
          questions: template.questions,
          createdAt: template.createdAt
        });
        if (error2) return { success: false, error: error2.message };
      }
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  async getModules(): Promise<SAPModule[]> {
    try {
      const { data } = await this.client.from('settings').select('value').eq('key', 'modules').maybeSingle();
      return data?.value || MODULES;
    } catch (e) {
      return MODULES;
    }
  }

  async getIndustries(): Promise<Industry[]> {
    try {
      const { data } = await this.client.from('settings').select('value').eq('key', 'industries').maybeSingle();
      return data?.value || INDUSTRIES;
    } catch (e) {
      return INDUSTRIES;
    }
  }

  async saveModules(modules: SAPModule[]): Promise<void> {
    await this.client.from('settings').upsert({ key: 'modules', value: modules });
  }

  async saveIndustries(industries: Industry[]): Promise<void> {
    await this.client.from('settings').upsert({ key: 'industries', value: industries });
  }

  async getBankQuestions(): Promise<Question[]> {
    try {
      const { data } = await this.client.from('bank_questions').select('*');
      return data || [];
    } catch (e) {
      return [];
    }
  }

  async saveBankQuestions(questions: Question[]): Promise<void> {
    await this.client.from('bank_questions').upsert(questions);
  }

  async deleteBankQuestion(id: string): Promise<void> {
    await this.client.from('bank_questions').delete().eq('id', id);
  }

  async getLinkedInAnalyses(): Promise<LinkedInAnalysis[]> {
    try {
      const { data } = await this.client.from('linkedin_analyses').select('*');
      return (data || []).map(d => ({
        ...d,
        suggestedModule: d.suggested_module || d.suggestedModule,
        suggestedLevel: d.suggested_level || d.suggestedLevel,
        industriesIdentified: d.industries_identified || d.industriesIdentified,
        executiveSummary: d.executive_summary || d.executiveSummary,
        suggestedImplementation: d.suggested_implementation || d.suggestedImplementation,
        analyzedAt: d.analyzed_at || d.analyzedAt
      }));
    } catch (e) {
      return [];
    }
  }

  async saveLinkedInAnalysis(analysis: LinkedInAnalysis): Promise<void> {
    const data = { 
      id: analysis.id,
      profile_link: analysis.profileLink,
      suggested_module: analysis.suggestedModule,
      suggested_level: analysis.suggestedLevel,
      industries_identified: analysis.industriesIdentified,
      executive_summary: analysis.executiveSummary,
      suggested_implementation: analysis.suggestedImplementation,
      disc: analysis.disc,
      analyzed_at: analysis.analyzedAt 
    };
    await this.client.from('linkedin_analyses').upsert(data);
  }

  async seedDatabase(): Promise<void> {
    await this.client.from('settings').upsert({ key: 'modules', value: MODULES });
    await this.client.from('settings').upsert({ key: 'industries', value: INDUSTRIES });
  }
}

export const db = new DBService();
