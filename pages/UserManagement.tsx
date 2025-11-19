import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { getUsers, createUser, saveUser } from '../services/storage';
import { Shield, UserCheck, UserX, Key, Plus, Mail } from 'lucide-react';

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  // Form State
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<UserRole>(UserRole.USER);

  useEffect(() => {
    refreshUsers();
  }, []);

  const refreshUsers = () => {
    setUsers(getUsers());
  };

  const handleToggleStatus = (user: User) => {
    // Prevent disabling self (in a real app, check current user ID)
    if(user.username === 'admin') {
        alert("Cannot disable the main admin.");
        return;
    }
    const updated = { ...user, isActive: !user.isActive };
    saveUser(updated);
    refreshUsers();
  };

  const handleResetPassword = (user: User) => {
    // Simulation
    const newPass = prompt(`Enter new password for ${user.username}:`);
    if (newPass) {
      const updated = { ...user, passwordHash: newPass };
      saveUser(updated);
      alert("Password updated.");
    }
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newEmail) return;
    createUser(newUsername, newEmail, newRole);
    setIsCreateModalOpen(false);
    setNewUsername('');
    setNewEmail('');
    refreshUsers();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
            <p className="text-slate-500 mt-1">Control access permissions and user accounts.</p>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add User
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map(user => (
          <div key={user.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col relative overflow-hidden">
            {user.role === UserRole.ADMIN && (
               <div className="absolute top-0 right-0 bg-indigo-50 text-indigo-600 px-3 py-1 rounded-bl-lg text-xs font-bold flex items-center">
                   <Shield className="w-3 h-3 mr-1" /> ADMIN
               </div>
            )}
            
            <div className="flex items-center mb-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold mr-4 ${user.isActive ? 'bg-slate-100 text-slate-600' : 'bg-red-50 text-red-400'}`}>
                    {user.username.substring(0, 2).toUpperCase()}
                </div>
                <div>
                    <h3 className="font-bold text-slate-900">{user.username}</h3>
                    <p className="text-sm text-slate-500">{user.email}</p>
                </div>
            </div>

            <div className="mt-auto pt-4 border-t border-slate-100 flex justify-between items-center">
                <div className="flex space-x-2">
                    <button 
                        onClick={() => handleToggleStatus(user)}
                        className={`p-2 rounded-lg transition-colors ${user.isActive ? 'text-green-600 hover:bg-green-50' : 'text-red-600 hover:bg-red-50'}`}
                        title={user.isActive ? 'Disable Account' : 'Enable Account'}
                    >
                        {user.isActive ? <UserCheck className="w-5 h-5" /> : <UserX className="w-5 h-5" />}
                    </button>
                    <button 
                        onClick={() => handleResetPassword(user)}
                        className="p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 rounded-lg transition-colors"
                        title="Reset Password"
                    >
                        <Key className="w-5 h-5" />
                    </button>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {user.isActive ? 'Active' : 'Inactive'}
                </span>
            </div>
          </div>
        ))}
      </div>

      {/* Create User Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold mb-4 text-slate-800">Create New User</h2>
            <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                    <input 
                        type="text" 
                        required
                        value={newUsername}
                        onChange={e => setNewUsername(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" 
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input 
                            type="email" 
                            required
                            value={newEmail}
                            onChange={e => setNewEmail(e.target.value)}
                            className="w-full border border-slate-300 rounded-lg pl-9 pr-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" 
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                    <select 
                        value={newRole} 
                        onChange={(e) => setNewRole(e.target.value as UserRole)}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                        <option value={UserRole.USER}>Normal User</option>
                        <option value={UserRole.ADMIN}>Administrator</option>
                    </select>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                    <button 
                        type="button" 
                        onClick={() => setIsCreateModalOpen(false)}
                        className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium"
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit" 
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
                    >
                        Create Account
                    </button>
                </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};