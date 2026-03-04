import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, getDocs, query, where, collection } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuthStore } from '../store/authStore';
import {
  CalendarPlus,
  ClipboardList,
  Users,
  BarChart,
} from 'lucide-react';

export function OrganizationDashboard() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [orgName, setOrgName] = useState('');
  const [eventCount, setEventCount] = useState(0);
  const [totalVolunteers, setTotalVolunteers] = useState(0);

  useEffect(() => {
    const fetchOrgData = async () => {
      if (!user?.uid) return;

      try {
        // Fetch organization name
        const orgRef = doc(db, 'organizations', user.uid);
        const orgSnap = await getDoc(orgRef);
        if (orgSnap.exists()) {
          setOrgName(orgSnap.data().name || '');
        }

        // Use org_id from organization document to query events
        const orgId = orgSnap.data()?.org_id;
        const eventQuery = query(collection(db, 'events'), where('org_id', '==', orgId));
        const eventSnapshot = await getDocs(eventQuery);
        const eventDocs = eventSnapshot.docs;
        const eventIds = eventDocs.map((doc) => doc.id);

        console.log('Fetched Event IDs:', eventIds);
        setEventCount(eventIds.length);

        if (eventIds.length === 0) {
          console.warn('No events found for this organization.');
          return;
        }

        // Fetch all volunteer tracking entries
        const trackSnapshot = await getDocs(collection(db, 'trackvolunteer'));
        const volunteerSet = new Set<string>();

        trackSnapshot.forEach((doc) => {
          const data = doc.data();
          if (eventIds.includes(data.eventUid)) {
            volunteerSet.add(data.volunteerUid);
          }
        });

        console.log('Total unique volunteers:', volunteerSet.size);
        setTotalVolunteers(volunteerSet.size);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      }
    };

    fetchOrgData();
  }, [user?.uid]);

  const cards = [
    {
      title: 'Post New Event',
      description: 'Create a new volunteering opportunity.',
      icon: <CalendarPlus className="text-blue-600" size={32} />,
      route: '/organization/post-event',
    },
    {
      title: 'Manage Events',
      description: 'Edit or remove events you’ve created.',
      icon: <ClipboardList className="text-green-600" size={32} />,
      route: '/organization/manage-events',
    },
    {
      title: 'Volunteers',
      description: 'Track and manage volunteer participation.',
      icon: <Users className="text-orange-500" size={32} />,
      route: '/organization/volunteers',
    },
    {
      title: 'Analytics',
      description: 'View stats and impact of your activities.',
      icon: <BarChart className="text-purple-600" size={32} />,
      route: '/organization/analytics',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-blue-600 text-white p-8 rounded-3xl shadow-lg mb-10">
          <h1 className="text-4xl font-extrabold">Welcome{orgName && `, ${orgName}`} 👋</h1>
          <p className="mt-2 text-sm text-blue-100">
            Manage your organization’s events, volunteers, and community impact.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div className="bg-white p-6 rounded-xl shadow-md text-center">
            <h2 className="text-4xl font-bold text-blue-600">{eventCount}</h2>
            <p className="text-gray-600 mt-2">Total Events Created</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md text-center">
            <h2 className="text-4xl font-bold text-green-600">{totalVolunteers}</h2>
            <p className="text-gray-600 mt-2">Total Volunteers Participated</p>
          </div>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {cards.map((card, idx) => (
            <div
              key={idx}
              onClick={() => navigate(card.route)}
              className="cursor-pointer bg-white rounded-2xl shadow-md hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800">{card.title}</h2>
                {card.icon}
              </div>
              <p className="text-gray-500 text-sm">{card.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}