
import { SAPModule, Industry, BlockType } from './types';

export const MODULES: SAPModule[] = [
  { id: 'abap', name: 'ABAP', category: 'TECHNICAL' },
  { id: 'cpi', name: 'CPI', category: 'TECHNICAL' },
  { id: 'pi', name: 'PI/PO', category: 'TECHNICAL' },
  { id: 'btp', name: 'BTP', category: 'TECHNICAL' },
  { id: 'fi', name: 'FI', category: 'FUNCTIONAL' },
  { id: 'co', name: 'CO', category: 'FUNCTIONAL' },
  { id: 'ps', name: 'PS', category: 'FUNCTIONAL' },
  { id: 'sd', name: 'SD', category: 'FUNCTIONAL' },
  { id: 'mm', name: 'MM', category: 'FUNCTIONAL' },
  { id: 'ewm', name: 'EWM', category: 'FUNCTIONAL' },
  { id: 'pp', name: 'PP', category: 'FUNCTIONAL' },
  { id: 'pm', name: 'PM', category: 'FUNCTIONAL' },
  { id: 'qm', name: 'QM', category: 'FUNCTIONAL' },
  { id: 'pmgt', name: 'Project Management', category: 'MANAGEMENT' },
];

export const INDUSTRIES: Industry[] = [
  { id: 'cross', name: 'Cross Industry' },
  { id: 'pharma', name: 'Pharma' },
  { id: 'retail', name: 'Retail' },
  { id: 'fashion', name: 'Fashion' },
  { id: 'prof_serv', name: 'Professional Service' },
  { id: 'food', name: 'Indústria Alimentícia' },
];

// Regras de Pontuação Automática por Módulo (Pesos Dinâmicos)
export const BLOCK_WEIGHTS: Record<string, Record<string, number>> = {
  'abap': {
    'Clean Core': 2.5,
    'SAP Activate': 1.5,
    'Processo': 1.0,
    'Dados Mestres': 1.0,
    'SoftSkill': 1.0
  },
  'btp': {
    'Clean Core': 2.0,
    'SAP Activate': 1.5,
    'Processo': 1.0,
    'Dados Mestres': 1.2,
    'SoftSkill': 1.0
  },
  'pmgt': {
    'SAP Activate': 2.5,
    'SoftSkill': 2.0,
    'Processo': 1.5,
    'Clean Core': 1.0,
    'Dados Mestres': 1.0
  },
  'default': {
    'Processo': 2.0,
    'Dados Mestres': 1.5,
    'SoftSkill': 1.0,
    'SAP Activate': 1.0,
    'Clean Core': 1.0
  }
};
