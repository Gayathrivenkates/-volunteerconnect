import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore'; // Assuming you have this store set up for user state management
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { db } from '../firebase'; // Ensure Firebase is properly initialized
import { Link } from 'react-router-dom';

const RecommendedEvents = () => {
  const { user } = useAuthStore(); // Assuming the user details are managed in a Zustand store
  const [events, setEvents] = useState<any[]>([]); // Type can be adjusted based on your event structure
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchRecommendedEvents = async () => {
      if (!user?.uid) return; // Ensure user is logged in

      try {
        // Fetch recommended matches where the user is in the top_volunteers list
        const snapshot = await getDocs(collection(db, 'recommendedMatches'));
        const matchedEventIds: string[] = [];

        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.top_volunteers?.includes(user.uid)) {
            matchedEventIds.push(data.event_id); // Collect event IDs where the user is a top volunteer
          }
        });

        // Fetch event details based on matched event IDs
        const eventPromises = matchedEventIds.map((eventId) =>
          getDoc(doc(db, 'events', eventId))
        );

        const eventDocs = await Promise.all(eventPromises);
        const eventsData = eventDocs
          .filter((docSnap) => docSnap.exists())
          .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));

        setEvents(eventsData); // Set the event data to state
      } catch (error) {
        console.error('Error fetching recommended events:', error);
      } finally {
        setLoading(false); // Set loading to false after fetching
      }
    };

    fetchRecommendedEvents();
  }, [user?.uid]); // Refetch if user changes

  if (loading) {
    return <div className="text-center mt-10 text-gray-600">Loading recommended events...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold text-blue-700">Recommended Events for You</h2>
      {events.length === 0 ? (
        <div className="text-gray-500">No recommended events at the moment.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <Link
              key={event.id}
              to={`/volunteer/eventdetails/${event.id}`}
              className="bg-white shadow-md rounded-xl p-4 cursor-pointer hover:shadow-lg transition"
            >
              {event.imageUrl && (
                <img
                  src={event.imageUrl}
                  alt={event.title}
                  className="w-full h-40 object-cover rounded-lg mb-4"
                />
              )}
              <h3 className="text-xl font-semibold text-blue-800">{event.title}</h3>
              <p className="text-gray-600 mt-1">{event.description}</p>
              <p className="text-sm text-gray-500 mt-2">
                📍 {event.venue}, {event.city}
              </p>
              <p className="text-sm text-gray-500">📅 {event.date} | 🕒 {event.timeSlot}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecommendedEvents;