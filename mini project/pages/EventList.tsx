import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  timeSlot: string;
  org_id: string;
  venue?: string;
  city?: string;
}

const EventList = () => {
  const { orgId } = useParams<{ orgId: string }>();
  const [events, setEvents] = useState<Event[]>([]);
  const [orgName, setOrgName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchEventsAndOrg = async () => {
      if (!orgId) {
        setError('Invalid organization ID');
        setLoading(false);
        return;
      }

      try {
        // Fetch the organization data first
        const orgRef = doc(db, 'organizations', orgId);
        const orgSnap = await getDoc(orgRef);

        if (!orgSnap.exists()) {
          setError('Organization not found');
          setLoading(false);
          return;
        }

        const orgData = orgSnap.data();
        setOrgName(orgData?.name || 'Organization');

        // Now, get the event UIDs from the organization data
        const eventIds = orgData?.events || [];

        if (eventIds.length === 0) {
          setError('No events found for this organization');
          setLoading(false);
          return;
        }

        // Fetch events in chunks of 10 due to Firestore's limit on the `in` operator
        const allEvents: Event[] = [];
        const batchSize = 10;
        for (let i = 0; i < eventIds.length; i += batchSize) {
          const eventChunk = eventIds.slice(i, i + batchSize);
          const eventsRef = collection(db, 'events');
          const eventsQuery = query(eventsRef, where('__name__', 'in', eventChunk));
          const snapshot = await getDocs(eventsQuery);

          if (!snapshot.empty) {
            const eventList: Event[] = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            })) as Event[];
            allEvents.push(...eventList);
          }
        }

        if (allEvents.length === 0) {
          setError('No events found for this organization');
        } else {
          setEvents(allEvents);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Error fetching organization events');
      } finally {
        setLoading(false);
      }
    };

    fetchEventsAndOrg();
  }, [orgId]);

  if (loading) return <div className="text-center py-10 text-gray-600">Loading events...</div>;
  if (error) return <div className="text-center py-10 text-red-500">{error}</div>;

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold mb-6 text-center text-blue-800">
        Events by {orgName}
      </h1>

      {events.length === 0 ? (
        <div className="text-center text-gray-600">No events found for this organization.</div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {events.map((event) => (
            <div key={event.id} className="bg-white p-6 rounded-xl shadow">
              <h2 className="text-xl font-semibold text-blue-800">{event.title}</h2>
              <p className="text-gray-700 mt-2">{event.description}</p>
              <p className="text-sm text-gray-500 mt-1">
                📅 {event.date} | ⏰ {event.timeSlot}
              </p>
              {event.venue && <p className="text-sm text-gray-500 mt-1">📍 {event.venue}</p>}
              {event.city && <p className="text-sm text-gray-500 mt-1">🏙️ {event.city}</p>}

              {/* Display the org_id */}
              <p className="text-sm text-gray-500 mt-1">Organization ID: {event.org_id}</p>

              <Link
                to={`/volunteer/eventdetails/${event.id}`}
                className="inline-block mt-4 text-sm font-semibold text-blue-600 hover:underline"
              >
                View Details →
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EventList;