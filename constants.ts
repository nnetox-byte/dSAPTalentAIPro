
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

export const BLOCK_WEIGHTS: Record<string, Record<BlockType, number>> = {
  'abap': {
    [BlockType.MASTER_DATA]: 1,
    [BlockType.PROCESS]: 1,
    [BlockType.SOFT_SKILL]: 1,
    [BlockType.SAP_ACTIVATE]: 1.2,
    [BlockType.CLEAN_CORE]: 2.0, // High weight on Clean Core for ABAP
  },
  'default': {
    [BlockType.MASTER_DATA]: 1,
    [BlockType.PROCESS]: 1.5,
    [BlockType.SOFT_SKILL]: 1,
    [BlockType.SAP_ACTIVATE]: 1,
    [BlockType.CLEAN_CORE]: 1,
  }
};
