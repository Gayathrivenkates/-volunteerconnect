import React, { useEffect, useState } from 'react';
import { Calendar, Bell, Search, History, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

export const VolunteerDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [totalEvents, setTotalEvents] = useState(0);
  const [totalHours, setTotalHours] = useState(0);

  useEffect(() => {
    const fetchImpactData = async () => {
      if (user?.uid) {
        const ref = doc(db, 'pastparticipations', user.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          setTotalEvents(data.eventUids?.length || 0);
          setTotalHours(data.totalHours || 0);
        }
      }
    };

    fetchImpactData();
  }, [user?.uid]);

  if (!user) {
    return <div className="text-center mt-10 text-gray-600">Loading profile...</div>;
  }

  return (
    <div className="space-y-10">
      <div className="text-3xl font-semibold text-blue-800 p-4">
        Hi, {user.name} 👋
      </div>

      <div className="flex items-center justify-between p-4 bg-white rounded-xl shadow-md">
        <h2 className="text-2xl font-semibold text-blue-700">Volunteer Dashboard</h2>
        <button
          onClick={() => navigate('/volunteer/search')}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition duration-300"
        >
          <Search className="w-5 h-5" />
          <span className="font-medium">Search Events & Orgs</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Upcoming Events */}
        <div
          onClick={() => navigate('/volunteer/upcoming-events')}
          className="cursor-pointer bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition duration-300 hover:bg-blue-50"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-blue-700">Upcoming Events</h3>
            <Calendar className="h-6 w-6 text-blue-600" />
          </div>
          <p className="text-sm text-gray-500">Check out and join upcoming volunteer events.</p>
        </div>

        {/* Past Participations */}
        <div
          onClick={() => navigate('/volunteer/past-participations')}
          className="cursor-pointer bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition duration-300 hover:bg-green-50"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-green-700">Past Participations</h3>
            <History className="h-6 w-6 text-green-600" />
          </div>
          <p className="text-sm text-gray-500">See events you've participated in and hours contributed.</p>
        </div>

        {/* Notifications */}
        <div
          onClick={() => navigate('/volunteer/notifications')}
          className="cursor-pointer bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition duration-300 hover:bg-purple-50"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-purple-700">Notifications</h3>
            <Bell className="h-6 w-6 text-purple-600" />
          </div>
          <p className="text-sm text-gray-500">Stay updated with important alerts and updates.</p>
        </div>

        {/* Recommended Events */}
        <div
          onClick={() => navigate('/volunteer/recommended-events')}
          className="cursor-pointer bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition duration-300 hover:bg-yellow-50"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-yellow-700">Recommended Events</h3>
            <Star className="h-6 w-6 text-yellow-600" />
          </div>
          <p className="text-sm text-gray-500">Events picked for you based on your interests.</p>
        </div>
      </div>

      {/* My Impact */}
      <div className="bg-white p-6 rounded-2xl shadow-md">
        <h3 className="text-xl font-semibold mb-4 text-blue-700">My Impact</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-center">
          <div className="bg-blue-50 p-4 rounded-xl">
            <p className="text-4xl font-bold text-blue-600">{totalEvents}</p>
            <p className="text-gray-600 mt-2">Events Attended</p>
          </div>
          <div className="bg-green-50 p-4 rounded-xl">
            <p className="text-4xl font-bold text-green-600">{totalHours.toFixed(2)}</p>
            <p className="text-gray-600 mt-2">Hours Contributed</p>
          </div>
        </div>
      </div>
    </div>
  );
};