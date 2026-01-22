
import React, { useState } from 'react';
import { db } from '../services/dbService';
import { Loader2, ShieldCheck, Mail, Lock, ShieldAlert, X } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: () => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para modais LGPD
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await db.signIn(email, password);
      onLoginSuccess();
    } catch (err: any) {
      setError(err.message || 'Falha na autenticação');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background decorativo */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px]"></div>

      <div className="w-full max-w-md space-y-8 relative z-10">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-blue-600 rounded-[30px] flex items-center justify-center mx-auto shadow-2xl shadow-blue-600/20">
            <ShieldCheck size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight text-center uppercase">SAP Talent Pro</h1>
          <p className="text-slate-400 font-medium text-center">Gestão Estratégica de Talentos SAP</p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 p-10 rounded-[40px] shadow-2xl relative">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail Corporativo</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-2xl py-4 pl-12 pr-4 text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="seu.nome@empresa.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-2xl py-4 pl-12 pr-4 text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-2xl text-red-400 text-xs font-bold text-center">
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-xl shadow-blue-600/20 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="animate-spin" /> : "Entrar no Sistema"}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-700/50 text-center space-y-4">
            <p className="text-[10px] text-slate-500 font-medium leading-relaxed px-4">
              Ao acessar, você declara estar ciente de que seus dados profissionais serão processados em conformidade com a <strong>LGPD</strong>.
            </p>
            <div className="flex justify-center gap-6">
              <button 
                type="button"
                onClick={(e) => { e.preventDefault(); setIsPrivacyModalOpen(true); }}
                className="text-[9px] font-black text-slate-300 uppercase tracking-widest hover:text-white transition-colors cursor-pointer"
              >
                POLÍTICA DE PRIVACIDADE
              </button>
              <button 
                type="button"
                onClick={(e) => { e.preventDefault(); setIsTermsModalOpen(true); }}
                className="text-[9px] font-black text-slate-300 uppercase tracking-widest hover:text-white transition-colors cursor-pointer"
              >
                TERMOS DE USO
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-[10px] text-slate-500 font-black uppercase tracking-widest flex items-center justify-center gap-2">
          <ShieldAlert size={14} /> ACESSO RESTRITO A USUÁRIOS AUTORIZADOS.
        </p>
      </div>

      {/* MODAIS LGPD (Privacidade e Termos) */}
      {(isPrivacyModalOpen || isTermsModalOpen) && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in duration-300 flex flex-col max-h-[85vh]">
            <div className="bg-slate-900 p-8 flex items-center justify-between text-white shrink-0">
              <div className="flex items-center gap-3">
                <ShieldCheck className="text-blue-400" size={24} />
                <h3 className="text-xl font-bold tracking-tight uppercase">{isPrivacyModalOpen ? 'Política de Privacidade' : 'Termos de Uso'}</h3>
              </div>
              <button 
                type="button"
                onClick={() => { setIsPrivacyModalOpen(false); setIsTermsModalOpen(false); }} 
                className="text-slate-400 hover:text-white transition-colors p-2"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-10 overflow-y-auto space-y-6 text-slate-600 font-medium leading-relaxed prose prose-slate max-w-none">
              {isPrivacyModalOpen ? (
                <>
                  <h4 className="text-slate-900 font-black uppercase text-xs tracking-widest">1. Coleta de Dados</h4>
                  <p>Coletamos seu nome, e-mail e dados de desempenho técnico exclusivamente para fins de recrutamento e seleção para posições SAP Talent Pro.</p>
                  <h4 className="text-slate-900 font-black uppercase text-xs tracking-widest">2. Finalidade</h4>
                  <p>A finalidade exclusiva do processamento é a avaliação de competências técnicas e comportamentais para adequação a vagas específicas.</p>
                  <h4 className="text-slate-900 font-black uppercase text-xs tracking-widest">3. Compartilhamento</h4>
                  <p>Seus dados são compartilhados apenas com a equipe de RH e gestores da área técnica da organização responsável pela avaliação.</p>
                  <h4 className="text-slate-900 font-black uppercase text-xs tracking-widest">4. Seus Direitos</h4>
                  <p>Em conformidade com a LGPD, você tem direito ao acesso, correção e exclusão de seus dados pessoais a qualquer momento mediante solicitação ao encarregado de dados.</p>
                </>
              ) : (
                <>
                  <h4 className="text-slate-900 font-black uppercase text-xs tracking-widest">1. Aceite dos Termos</h4>
                  <p>Ao utilizar o SAP Talent Pro, você concorda com a realização de testes técnicos e análise de perfil público (LinkedIn) para fins profissionais.</p>
                  <h4 className="text-slate-900 font-black uppercase text-xs tracking-widest">2. Uso do Sistema</h4>
                  <p>O sistema deve ser utilizado apenas para a realização de avaliações corporativas autorizadas. É proibida a cópia ou distribuição do banco de questões.</p>
                  <h4 className="text-slate-900 font-black uppercase text-xs tracking-widest">3. Responsabilidades</h4>
                  <p>O usuário é responsável pela veracidade das informações fornecidas e pela integridade durante a realização das provas.</p>
                </>
              )}
            </div>
            <div className="p-8 border-t border-slate-100 flex justify-end shrink-0 bg-slate-50">
              <button 
                type="button"
                onClick={() => { setIsPrivacyModalOpen(false); setIsTermsModalOpen(false); }} 
                className="px-8 py-3 bg-slate-900 text-white font-black rounded-xl hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-900/20 uppercase text-xs tracking-widest"
              >
                Entendi e Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
