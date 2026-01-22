
import React, { useState, useEffect } from 'react';
import { db } from '../services/dbService';
import { Users, Shield, RefreshCw, Trash2, Loader2 } from 'lucide-react';

const UserManagementView: React.FC = () => {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const { data: p } = await db.client
        .from('profiles')
        .select('*, perfil:perfis(*)')
        .order('email', { ascending: true });
      const { data: r } = await db.client.from('perfis').select('*');
      setProfiles(p || []);
      setRoles(r || []);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleUpdateRole = async (userId: string, roleId: string) => {
    try {
      const { error } = await db.client
        .from('profiles')
        .update({ perfil_id: roleId })
        .eq('id', userId);
      if (error) throw error;
      loadData();
    } catch (e: any) {
      alert("Erro ao atualizar perfil: " + e.message);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Gestão de Acessos</h2>
          <p className="text-slate-500 font-medium">Controle de papéis para usuários reais do Supabase</p>
        </div>
        <button 
          onClick={loadData}
          disabled={isLoading}
          className="px-6 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-2xl flex items-center gap-2 shadow-sm hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50"
        >
          <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} /> 
          {isLoading ? 'Sincronizando...' : 'Atualizar Lista'}
        </button>
      </div>

      <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 bg-slate-50/50 flex items-center gap-3">
          <Shield className="text-slate-400" size={20} />
          <h3 className="font-bold text-slate-700 uppercase text-xs tracking-widest">Usuários Registrados ({profiles.length})</h3>
        </div>
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b">
            <tr>
              <th className="px-10 py-6">E-mail Corporativo</th>
              <th className="px-10 py-6">ID Interno</th>
              <th className="px-10 py-6">Atribuição de Perfil</th>
              <th className="px-10 py-6 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {profiles.length > 0 ? profiles.map(p => (
              <tr key={p.id} className="hover:bg-slate-50/50 transition-all">
                <td className="px-10 py-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center font-bold">
                      {p.email?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-slate-800">{p.email}</div>
                      {p.email === 'nelson.neto@delaware.pro' && (
                        <div className="text-[9px] font-black text-blue-600 uppercase">Super Admin Incondicional</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-10 py-6">
                  <code className="text-[10px] text-slate-400 font-bold uppercase truncate max-w-[120px] block">
                    {p.id}
                  </code>
                </td>
                <td className="px-10 py-6">
                  <select 
                    disabled={p.email === 'nelson.neto@delaware.pro'}
                    value={p.perfil_id} 
                    onChange={(e) => handleUpdateRole(p.id, e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {roles.map(r => <option key={r.id} value={r.id}>{r.nome}</option>)}
                  </select>
                </td>
                <td className="px-10 py-6 text-right">
                  <button 
                    disabled={p.email === 'nelson.neto@delaware.pro'}
                    onClick={async () => { if(confirm("Remover registro de perfil?")) { await db.client.from('profiles').delete().eq('id', p.id); loadData(); } }} 
                    className="p-2 text-slate-300 hover:text-red-500 transition-all disabled:opacity-0"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={4} className="px-10 py-24 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                      <Users size={32} />
                    </div>
                    <p className="text-slate-400 font-medium italic">Nenhum usuário logado ou registrado ainda.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagementView;
