import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { UserPlus, Shield, Lock, CheckCircle, AlertOctagon } from 'lucide-react';

export default function OwnerDashboard() {
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('waiter');
  const [loading, setLoading] = useState(false);

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formattedEmail = `${mobileNumber.replace(/[^0-9]/g, '')}@sapna.local`;
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email: formattedEmail,
        password: password,
      });

      if (authErr) throw authErr;

      if (authData.user) {
        const { error: profileErr } = await supabase.from('profiles').insert([{
          id: authData.user.id,
          full_name: fullName,
          mobile_number: mobileNumber,
          role: role,
          account_status: 'active'
        }]);

        if (profileErr) throw profileErr;
        alert(`Account created successfully for ${fullName} (${role})!`);
        setFullName('');
        setMobileNumber('');
        setPassword('');
      }
    } catch (err) {
      alert('Error creating staff account: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center space-x-2">
          <Shield className="w-6 h-6 text-emerald-400" />
          <span>System Owner Super Admin Control</span>
        </h1>
        <p className="text-xs text-slate-400">Create & manage staff access rights, roles, and security permissions.</p>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-xl max-w-xl">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
          <UserPlus className="w-5 h-5 text-emerald-400" />
          <span>Create New Staff Account</span>
        </h2>
        <form onSubmit={handleCreateStaff} className="space-y-4">
          <div>
            <label className="block text-xs uppercase text-slate-400 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Tanvir Ahmed"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs uppercase text-slate-400 mb-1">Mobile Number</label>
            <input
              type="text"
              required
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value)}
              placeholder="01700000000"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs uppercase text-slate-400 mb-1">Password</label>
            <input
              type="password"
              required
              minLength="6"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs uppercase text-slate-400 mb-1">Role Permission</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="waiter">Waiter</option>
              <option value="chef">Chef</option>
              <option value="admin">Admin</option>
              <option value="owner">System Owner</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded-lg shadow-md transition disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
}
