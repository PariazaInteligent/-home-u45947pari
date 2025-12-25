import React from 'react';
import { Users, MoreVertical, Shield, Ban, Star, Mail } from 'lucide-react';

export const UserManagement: React.FC = () => {
  const users = [
    { id: 'USR-1001', name: 'Alex I.', email: 'alex.investor@pi.ro', tier: 'Tier 1', status: 'Active', balance: '5,450 RON', joined: 'Oct 2024' },
    { id: 'USR-1002', name: 'Mihai B.', email: 'mihai.b@yahoo.com', tier: 'Pro', status: 'Active', balance: '12,200 RON', joined: 'Sep 2024' },
    { id: 'USR-1003', name: 'Elena D.', email: 'elena.d@gmail.com', tier: 'Whale', status: 'Suspended', balance: '45,000 RON', joined: 'Aug 2024' },
    { id: 'USR-1004', name: 'George V.', email: 'george.v@outlook.com', tier: 'Entry', status: 'Active', balance: '800 RON', joined: 'Nov 2024' },
    { id: 'USR-1005', name: 'Andrei M.', email: 'andrei.m@pi.ro', tier: 'Investor', status: 'Pending KYC', balance: '0 RON', joined: 'Today' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-display font-bold text-white flex items-center gap-3">
           <Users className="w-6 h-6 text-red-500" /> User Management Database
        </h2>
        <div className="bg-red-900/20 border border-red-500/30 px-3 py-1 rounded text-xs font-mono text-red-400">
           TOTAL_USERS: 154
        </div>
      </div>

      <div className="bg-slate-900/50 border border-white/5 rounded-xl overflow-hidden">
         <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
               <thead className="bg-black/40 text-slate-500 font-mono text-xs uppercase border-b border-white/5">
                  <tr>
                     <th className="p-4">Identity</th>
                     <th className="p-4">Contact</th>
                     <th className="p-4">Status</th>
                     <th className="p-4 text-right">Balance</th>
                     <th className="p-4 text-center">Actions</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-white/5">
                  {users.map((user) => (
                     <tr key={user.id} className="hover:bg-white/5 transition-colors group">
                        <td className="p-4">
                           <div className="font-bold text-white">{user.name}</div>
                           <div className="text-xs text-slate-500 font-mono">{user.id}</div>
                        </td>
                        <td className="p-4">
                           <div className="text-slate-300 flex items-center gap-2">
                              <Mail className="w-3 h-3 text-slate-500" /> {user.email}
                           </div>
                           <div className="text-xs text-slate-500 mt-1">Joined: {user.joined}</div>
                        </td>
                        <td className="p-4">
                           <div className="flex flex-col gap-1">
                              <span className={`text-xs font-bold px-2 py-0.5 rounded w-fit border ${
                                 user.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                 user.status === 'Suspended' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                              }`}>
                                 {user.status}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">{user.tier}</span>
                           </div>
                        </td>
                        <td className="p-4 text-right font-mono font-bold text-white">
                           {user.balance}
                        </td>
                        <td className="p-4 text-center">
                           <div className="flex items-center justify-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                              <button className="p-2 hover:bg-slate-800 rounded text-slate-400 hover:text-white" title="View Profile">
                                 <Shield className="w-4 h-4" />
                              </button>
                              <button className="p-2 hover:bg-slate-800 rounded text-slate-400 hover:text-yellow-400" title="Promote Tier">
                                 <Star className="w-4 h-4" />
                              </button>
                              <button className="p-2 hover:bg-red-900/30 rounded text-slate-400 hover:text-red-500" title="Suspend User">
                                 <Ban className="w-4 h-4" />
                              </button>
                           </div>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
};