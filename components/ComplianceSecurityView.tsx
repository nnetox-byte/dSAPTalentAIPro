
import React from 'react';
import { Shield, Lock, Mail, Info, FileText, CheckCircle2, ShieldAlert, Scale } from 'lucide-react';

const ComplianceSecurityView: React.FC = () => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Seção Superior - Resumo Executivo de Segurança */}
      <div className="p-8 md:p-12 bg-white rounded-[40px] border border-slate-200 shadow-sm flex flex-col">
        <div className="mb-10 border-b border-slate-100 pb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 text-blue-600 mb-2">
              <Shield size={24} />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">Ambiente Certificado Delaware</span>
            </div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">Centro de Compliance & Segurança</h2>
            <p className="text-slate-500 font-medium mt-1">Gestão de privacidade e integridade de dados no ecossistema SAP Talent Pro.</p>
          </div>
          <div className="bg-blue-50 text-blue-600 p-5 rounded-3xl shrink-0">
            <ShieldCheck size={40} className="stroke-[1.5]" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Lock className="text-blue-500" size={20} />
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Segurança da Informação</h3>
            </div>
            <div className="bg-slate-50 p-8 rounded-[32px] border border-slate-100 space-y-6">
              <p className="text-sm text-slate-600 leading-relaxed font-medium">
                O SAP Talent Pro utiliza protocolos de nível bancário para garantir que as avaliações e dados dos candidatos permaneçam invioláveis.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 size={16} className="text-green-500 mt-0.5" />
                  <span className="text-[11px] text-slate-500 font-bold uppercase tracking-tight">Criptografia AES-256</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 size={16} className="text-green-500 mt-0.5" />
                  <span className="text-[11px] text-slate-500 font-bold uppercase tracking-tight">Comunicação TLS 1.3</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 size={16} className="text-green-500 mt-0.5" />
                  <span className="text-[11px] text-slate-500 font-bold uppercase tracking-tight">Multi-Region Backup</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 size={16} className="text-green-500 mt-0.5" />
                  <span className="text-[11px] text-slate-500 font-bold uppercase tracking-tight">Supabase Auth Guard</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Mail className="text-indigo-500" size={20} />
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Conformidade LGPD</h3>
            </div>
            <div className="bg-indigo-50/50 p-8 rounded-[32px] border border-indigo-100 space-y-6">
              <p className="text-sm text-slate-700 leading-relaxed font-medium">
                Cumprimos integralmente a Lei 13.709/18, garantindo transparência total no ciclo de vida dos dados.
              </p>
              <div className="p-6 bg-white rounded-2xl border border-indigo-100/50 shadow-sm">
                <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Encarregado de Dados (DPO)</div>
                <p className="text-blue-600 font-black text-lg">dpo@delaware.pro</p>
                <p className="text-[10px] text-slate-400 font-medium mt-1 uppercase tracking-tight">Canal direto para solicitações de exclusão e acesso.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Seção Inferior - Documentação Detalhada */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Política de Privacidade */}
        <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm flex flex-col space-y-8">
          <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
              <FileText size={24} />
            </div>
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Política de Privacidade</h3>
          </div>
          
          <div className="space-y-6 overflow-y-auto max-h-[400px] pr-4 scrollbar-thin scrollbar-thumb-slate-200">
            <div className="space-y-2">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">1. Coleta e Uso de Dados</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Coletamos informações profissionais, como nome, e-mail corporativo, histórico do LinkedIn e desempenho em avaliações técnicas. Estes dados são utilizados exclusivamente para identificação de talentos e fit cultural/técnico em projetos SAP Delaware Brasil.
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">2. Tratamento por Inteligência Artificial</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                O SAP Talent Pro utiliza modelos generativos (Gemini API) para analisar perfis e respostas. Nenhum dado pessoal é utilizado para treinamento público de modelos; o processamento ocorre em ambiente fechado e efêmero.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">3. Compartilhamento e Retenção</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Os resultados são acessíveis apenas a recrutadores e gestores de delivery autorizados. Os dados são mantidos pelo período necessário para a conclusão do processo seletivo ou até que o titular solicite sua exclusão.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">4. Direitos do Titular</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Em conformidade com a LGPD, garantimos o direito de confirmação de existência de tratamento, acesso, correção de dados incompletos, anonimização e portabilidade.
              </p>
            </div>
          </div>
        </div>

        {/* Termos de Uso */}
        <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm flex flex-col space-y-8">
          <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
              <Scale size={24} />
            </div>
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Termos de Uso</h3>
          </div>
          
          <div className="space-y-6 overflow-y-auto max-h-[400px] pr-4 scrollbar-thin scrollbar-thumb-slate-200">
            <div className="space-y-2">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">1. Aceite do Usuário</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Ao acessar esta plataforma como candidato ou administrador, você concorda em cumprir estes termos e todas as leis locais aplicáveis. O uso indevido da plataforma resultará em cancelamento imediato do acesso.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">2. Propriedade Intelectual</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Todo o conteúdo gerado (questões, cenários técnicos e metodologias de avaliação) é de propriedade exclusiva da Delaware Brasil ou licenciado de parceiros. É estritamente proibida a reprodução, distribuição ou cópia do banco de questões.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">3. Integridade das Avaliações</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                O candidato compromete-se a realizar as avaliações de forma honesta e individual. O uso de ferramentas externas de auxílio não autorizado pode invalidar o resultado da avaliação técnica.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">4. Limitação de Responsabilidade</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                A plataforma é fornecida "como está". Embora busquemos a máxima precisão técnica através de IA, as decisões finais de contratação cabem exclusivamente aos gestores humanos da Delaware Brasil.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Rodapé do Centro de Compliance */}
      <div className="p-8 bg-slate-900 rounded-[32px] flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
        <div className="flex items-center gap-4 text-center md:text-left">
          <ShieldAlert className="text-amber-500 shrink-0" size={32} />
          <div>
            <h4 className="text-white font-bold">Dúvidas sobre Ética ou Segurança?</h4>
            <p className="text-slate-400 text-xs font-medium">Nossa equipe de segurança responde em até 24h úteis.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <a 
            href="mailto:compliance@delaware.pro"
            className="px-6 py-3 bg-slate-800 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-slate-700 transition-all border border-slate-700"
          >
            Falar com Compliance
          </a>
          <button 
            className="px-6 py-3 bg-blue-600 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all"
          >
            Baixar Certificado
          </button>
        </div>
      </div>

      <div className="flex items-center justify-center gap-4 text-slate-400 opacity-60 pt-4">
        <Info size={16} className="shrink-0" />
        <p className="text-[10px] font-bold uppercase tracking-tight text-center">
          Última atualização: Março de 2024 • Desenvolvido sob os padrões globais da Delaware Consulting.
        </p>
      </div>
    </div>
  );
};

export default ComplianceSecurityView;

// Adição da interface para evitar erros de tipo se não estiver no contexto global
interface ShieldCheckProps {
  size?: number;
  className?: string;
}

const ShieldCheck: React.FC<ShieldCheckProps> = ({ size = 24, className = "" }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);
