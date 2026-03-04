import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { QRCodeSVG } from 'qrcode.react';

interface EventDetails {
  id: string;
  title: string;
  date: string;
  timeSlot: string;
  venue: string;
  organizationId: string;
}

const UpcomingEventsPage = () => {
  const { user } = useAuthStore();
  const [events, setEvents] = useState<EventDetails[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventDetails | null>(null);

  useEffect(() => {
    const fetchUpcomingEventDetails = async () => {
      if (!user?.uid) return;

      const q = query(collection(db, 'upcomingevents'), where('volunteerUid', '==', user.uid));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const data = snapshot.docs[0].data();
        const eventUids = data.eventUid;

        const eventDetails = await Promise.all(
          eventUids.map(async (eventId: string) => {
            const eventRef = doc(db, 'events', eventId);
            const eventSnap = await getDoc(eventRef);
            if (eventSnap.exists()) {
              return { id: eventId, ...eventSnap.data() } as EventDetails;
            }
            return null;
          })
        );

        setEvents(eventDetails.filter((e): e is EventDetails => e !== null));
      }
    };

    fetchUpcomingEventDetails();
  }, [user?.uid]);

  const handleEventClick = (event: EventDetails) => {
    setSelectedEvent(event);
  };

  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold text-center text-indigo-600 mb-8">My Upcoming Events</h1>

      {events.length === 0 ? (
        <p className="text-center text-gray-500">You have no upcoming events.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {events.map((event) => (
            <div
              key={event.id}
              className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition cursor-pointer"
              onClick={() => handleEventClick(event)}
            >
              <h2 className="text-xl font-semibold text-gray-800">{event.title}</h2>
              <p className="text-sm text-gray-600 mt-1">{event.date} • {event.timeSlot}</p>
              <p className="text-sm text-gray-500">{event.venue}</p>
            </div>
          ))}
        </div>
      )}

      {/* If an event is selected, show the QR code */}
      {selectedEvent && (
        <div className="mt-10 bg-white p-8 rounded-xl shadow-xl">
          <h3 className="text-2xl font-semibold text-indigo-600 mb-6">QR Code for Event</h3>

          <div className="flex flex-col items-center">
            <QRCodeSVG
              value={JSON.stringify({
                volunteerUid: user?.uid,
                eventUid: selectedEvent.id,
                eventTitle: selectedEvent.title,
                eventDate: selectedEvent.date,
                eventTime: selectedEvent.timeSlot,
                venue: selectedEvent.venue,
              })}
              size={256}
              className="mx-auto mb-4"
            />
            <p className="text-gray-600 text-sm text-center">Scan this QR code at the event to check-in</p>
          </div>

          {/* Event Details */}
          <div className="mt-6">
            <h4 className="font-semibold text-gray-800">Event Details</h4>
            <p className="text-sm text-gray-600">{selectedEvent.title}</p>
            <p className="text-sm text-gray-600">{selectedEvent.date} • {selectedEvent.timeSlot}</p>
            <p className="text-sm text-gray-600">{selectedEvent.venue}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default UpcomingEventsPage;