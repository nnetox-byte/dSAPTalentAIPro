
import { Candidate, AssessmentResult, AssessmentTemplate, SAPModule, Industry, Question, ImplementationType } from '../types';
import { MODULES, INDUSTRIES } from '../constants';

const STORAGE_KEYS = {
  CANDIDATES: 'sap_eval_candidates',
  RESULTS: 'sap_eval_results',
  TEMPLATES: 'sap_eval_templates',
  MODULES: 'sap_eval_modules',
  INDUSTRIES: 'sap_eval_industries',
  CUSTOM_QUESTIONS: 'sap_eval_custom_questions'
};

class DBService {
  private get<T>(key: string): T[] {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }

  private save<T>(key: string, data: T[]): void {
    localStorage.setItem(key, JSON.stringify(data));
  }

  // Candidates
  getCandidates(): Candidate[] {
    return this.get<Candidate>(STORAGE_KEYS.CANDIDATES);
  }

  saveCandidate(candidate: Candidate): void {
    const list = this.getCandidates();
    const index = list.findIndex(c => c.id === candidate.id);
    if (index > -1) list[index] = candidate;
    else list.push(candidate);
    this.save(STORAGE_KEYS.CANDIDATES, list);
  }

  // Results
  getResults(): AssessmentResult[] {
    return this.get<AssessmentResult>(STORAGE_KEYS.RESULTS);
  }

  saveResult(result: AssessmentResult): void {
    const list = this.getResults();
    list.push(result);
    this.save(STORAGE_KEYS.RESULTS, list);
  }

  // Templates
  getTemplates(): AssessmentTemplate[] {
    return this.get<AssessmentTemplate>(STORAGE_KEYS.TEMPLATES);
  }

  saveTemplate(template: AssessmentTemplate): void {
    const list = this.getTemplates();
    list.push(template);
    this.save(STORAGE_KEYS.TEMPLATES, list);
  }

  // Configuration
  getModules(): SAPModule[] {
    const custom = this.get<SAPModule>(STORAGE_KEYS.MODULES);
    return custom.length ? custom : MODULES;
  }

  saveModules(modules: SAPModule[]): void {
    this.save(STORAGE_KEYS.MODULES, modules);
  }

  getIndustries(): Industry[] {
    const custom = this.get<Industry>(STORAGE_KEYS.INDUSTRIES);
    return custom.length ? custom : INDUSTRIES;
  }

  saveIndustries(industries: Industry[]): void {
    this.save(STORAGE_KEYS.INDUSTRIES, industries);
  }

  // Questions Database
  getBankQuestions(moduleId?: string, industryId?: string, implementationType?: ImplementationType): Question[] {
    let list = this.get<Question>(STORAGE_KEYS.CUSTOM_QUESTIONS);
    if (moduleId) list = list.filter(q => q.module === moduleId);
    if (industryId) list = list.filter(q => q.industry === industryId || q.industry === 'cross');
    if (implementationType) list = list.filter(q => q.implementationType === implementationType);
    return list;
  }

  saveBankQuestions(questions: Question[]): void {
    this.save(STORAGE_KEYS.CUSTOM_QUESTIONS, questions);
  }

  deleteBankQuestion(id: string): void {
    const list = this.getBankQuestions();
    const updated = list.filter(q => q.id !== id);
    this.save(STORAGE_KEYS.CUSTOM_QUESTIONS, updated);
  }

  addBankQuestion(q: Question): void {
    const list = this.getBankQuestions();
    list.push(q);
    this.save(STORAGE_KEYS.CUSTOM_QUESTIONS, list);
  }
}

export const db = new DBService();
