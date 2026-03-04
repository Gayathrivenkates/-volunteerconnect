import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Bell, UserCircle, LogOut } from 'lucide-react';

export const Navigation = () => {
  const { user, isAuthenticated } = useAuthStore();

  return (
    <nav className="bg-white shadow-lg">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold text-gray-800">
            VolunteerConnect
          </Link>
          
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <Link to="/notifications" className="relative">
                  <Bell className="h-6 w-6 text-gray-600 hover:text-gray-900" />
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
                    3
                  </span>
                </Link>
                <Link to="/profile" className="flex items-center space-x-2">
                  <UserCircle className="h-6 w-6 text-gray-600" />
                  <span className="text-gray-800">{user?.name}</span>
                </Link>
                <button className="text-gray-600 hover:text-gray-900">
                  <LogOut className="h-6 w-6" />
                </button>
              </>
            ) : (
              <div className="space-x-4">
                <Link
                  to="/login"
                  className="text-gray-800 hover:text-gray-900"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};