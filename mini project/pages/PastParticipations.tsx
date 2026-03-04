import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { collection, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface PastEventData {
  eventUid: string;
  eventName: string;
  hoursContributed: number;
}

const PastParticipationsPage = () => {
  const { user } = useAuthStore();
  const [events, setEvents] = useState<PastEventData[]>([]);
  const [totalHours, setTotalHours] = useState<number>(0);

  useEffect(() => {
    const fetchPastParticipations = async () => {
      if (!user?.uid) return;

      try {
        const pastRef = doc(db, 'pastparticipations', user.uid);
        const pastSnap = await getDoc(pastRef);

        if (pastSnap.exists()) {
          const data = pastSnap.data();
          const eventUids = data.eventUids || [];
          const allEventData: PastEventData[] = [];
          let total = 0;

          for (const eventId of eventUids) {
            const trackRef = doc(db, 'trackvolunteer', `${user.uid}_${eventId}`);
            const trackSnap = await getDoc(trackRef);

            const eventRef = doc(db, 'events', eventId);
            const eventSnap = await getDoc(eventRef);

            if (trackSnap.exists() && eventSnap.exists()) {
              const hours = trackSnap.data().hoursContributed || 0;
              const name = eventSnap.data().title || 'Untitled Event';
              allEventData.push({ eventUid: eventId, eventName: name, hoursContributed: hours });
              total += hours;
            }
          }

          setEvents(allEventData);
          setTotalHours(total);
        }
      } catch (error) {
        console.error('Error fetching past participations:', error);
      }
    };

    fetchPastParticipations();
  }, [user?.uid]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-center text-indigo-600 mb-6">Past Participations</h1>
      <p className="text-center text-lg text-gray-700 mb-8">
        Total Hours Contributed: <span className="font-semibold text-blue-700">{totalHours.toFixed(2)}</span>
      </p>
      {events.length === 0 ? (
        <p className="text-center text-gray-500">No past events yet.</p>
      ) : (
        <ul className="space-y-4">
          {events.map((event) => (
            <li
              key={event.eventUid}
              className="bg-white p-5 rounded-xl shadow-md hover:shadow-lg transition"
            >
              <h2 className="text-lg font-semibold text-gray-800">{event.eventName}</h2>
              <p className="text-sm text-gray-600">
                Event ID: {event.eventUid} • Hours Contributed: {event.hoursContributed.toFixed(2)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PastParticipationsPage;
