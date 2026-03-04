import React, { useEffect, useState } from 'react';
import { db } from "../firebase";
import { doc, getDoc, collection, getDocs, query, where } from "firebase/firestore";
import { useAuthStore } from '../store/authStore';

const AnalyticsPage: React.FC = () => {
  const [eventsData, setEventsData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const user = useAuthStore(state => state.user);

  useEffect(() => {
    const fetchEventAnalytics = async () => {
      if (!user?.uid) return;

      try {
        const orgRef = doc(db, 'organizations', user.uid);
        const orgSnap = await getDoc(orgRef);
        if (!orgSnap.exists()) return;

        const orgId = orgSnap.data()?.org_id;
        const q = query(collection(db, 'events'), where('org_id', '==', orgId));
        const querySnapshot = await getDocs(q);

        const fetchedEvents = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...(doc.data() as any),
        }));

        const eventsWithAnalytics = await Promise.all(
          fetchedEvents.map(async (event) => {
            const eventId = event.id;

            const eventVolunteerDocRef = doc(db, "eventvolunteer", eventId);
            const eventVolunteerSnap = await getDoc(eventVolunteerDocRef);

            let acceptedVolunteersCount = 0;
            if (eventVolunteerSnap.exists()) {
              const acceptedArray = eventVolunteerSnap.data().accepted || [];
              acceptedVolunteersCount = acceptedArray.length;
            }

            const pastParticipationsSnapshot = await getDocs(collection(db, "pastparticipations"));
            const participatedCount = pastParticipationsSnapshot.docs.filter(doc =>
              doc.data().eventUids?.includes(eventId)
            ).length;

            return {
              ...event,
              acceptedVolunteers: acceptedVolunteersCount,
              participatedVolunteers: participatedCount,
            };
          })
        );

        setEventsData(eventsWithAnalytics);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching analytics:", error);
      }
    };

    fetchEventAnalytics();
  }, [user?.uid]);

  if (loading) return <div className="text-center py-10">Loading...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white shadow-lg rounded-2xl p-6 border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">📊 Event Analytics</h2>

        {eventsData.length === 0 ? (
          <p className="text-gray-600 text-center py-10">No events found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto border-collapse text-sm md:text-base">
              <thead className="bg-gray-100 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-gray-700 font-semibold">Event Name</th>
                  <th className="px-4 py-3 text-left text-gray-700 font-semibold">Required Volunteers</th>
                  <th className="px-4 py-3 text-left text-green-700 font-semibold">Accepted Volunteers</th>
                  <th className="px-4 py-3 text-left text-blue-700 font-semibold">Total Participated</th>
                </tr>
              </thead>
              <tbody>
                {eventsData.map((event) => (
                  <tr
                    key={event.id}
                    className="border-t hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 text-gray-800">{event.title}</td>
                    <td className="px-4 py-3 text-gray-700">{event.volunteersNeeded}</td>
                    <td className="px-4 py-3 text-green-600 font-medium">{event.acceptedVolunteers}</td>
                    <td className="px-4 py-3 text-blue-600 font-medium">{event.participatedVolunteers}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsPage;