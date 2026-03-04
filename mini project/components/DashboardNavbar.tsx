import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserCircle, LogOut } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { getAuth, signOut } from 'firebase/auth';

export const DashboardNavbar = () => {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const auth = getAuth(); // firebase app auto-detected

  const handleLogout = async () => {
    try {
      await signOut(auth);
      clearAuth();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-gray-800">
          VolunteerConnect
        </Link>

        <div className="flex items-center space-x-6">
          <Link to="/profile" className="flex items-center space-x-2 hover:text-blue-600">
            <UserCircle className="h-6 w-6 text-gray-600" />
            <span className="text-gray-800">{user?.name || 'Profile'}</span>
          </Link>

          <button onClick={handleLogout} className="flex items-center space-x-2 hover:text-red-600">
            <LogOut className="h-6 w-6 text-gray-600" />
            <span className="text-gray-800">Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
};