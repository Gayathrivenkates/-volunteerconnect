// src/pages/Login.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, UserCheck, Users } from 'lucide-react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useAuthStore } from '../store/authStore'; // ✅ Import Zustand store

export const Login = () => {
  const navigate = useNavigate();
  const [userType, setUserType] = useState<'volunteer' | 'organization'>('volunteer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const setUser = useAuthStore((state) => state.setUser); // ✅ Extract setUser

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const collectionName = userType === 'volunteer' ? 'volunteers' : 'organizations';
      const q = query(collection(db, collectionName), where('email', '==', email));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const userDoc = snapshot.docs[0].data(); // ✅ Get Firestore document

        // ✅ Set user in Zustand store
        setUser({
          uid: user.uid,
          name: userDoc.name, // ✅ from Firestore
          email: userDoc.email,
          role: userType,
        });



        // ✅ Navigate to dashboard
        navigate(userType === 'volunteer' ? '/volunteer/dashboard' : '/organization/dashboard');
      } else {
        alert(`No ${userType} record found for this account.`);
      }
    } catch (error: any) {
      alert('Login failed: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6">
        <h2 className="text-xl font-bold text-center text-blue-700 mb-4">
          <UserCheck className="inline mr-1" size={20} /> Login
        </h2>

        <div className="flex justify-center mb-6 space-x-2">
          <button
            className={`px-4 py-1.5 text-sm rounded-full font-medium ${
              userType === 'volunteer'
                ? 'bg-blue-600 text-white shadow'
                : 'bg-gray-200 text-gray-700'
            }`}
            onClick={() => setUserType('volunteer')}
          >
            <Users className="inline mr-1" size={16} /> Volunteer
          </button>
          <button
            className={`px-4 py-1.5 text-sm rounded-full font-medium ${
              userType === 'organization'
                ? 'bg-purple-600 text-white shadow'
                : 'bg-gray-200 text-gray-700'
            }`}
            onClick={() => setUserType('organization')}
          >
            <UserCheck className="inline mr-1" size={16} /> Organization
          </button>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 text-sm">
          <div>
            <label className="block mb-1 text-gray-700">Email</label>
            <div className="relative">
              <Mail className="absolute left-2.5 top-2.5 text-gray-400" size={16} />
              <input
                type="email"
                required
                placeholder="you@example.com"
                className="pl-8 w-full rounded-md border border-gray-300 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block mb-1 text-gray-700">Password</label>
            <div className="relative">
              <Lock className="absolute left-2.5 top-2.5 text-gray-400" size={16} />
              <input
                type="password"
                required
                placeholder="••••••••"
                className="pl-8 w-full rounded-md border border-gray-300 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-md shadow-md hover:from-purple-700 hover:to-pink-600 transition duration-300 text-sm"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
};