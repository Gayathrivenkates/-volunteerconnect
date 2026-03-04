import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  doc,
  getDoc,
  updateDoc,
  addDoc,
  collection,
  serverTimestamp,
  query,
  where,
  getDocs,
  setDoc, // ✅ Fix: Import this
} from 'firebase/firestore';
import { db } from '../firebase';

const RequestManagement = () => {
  const { eventId } = useParams();
  const [eventDetails, setEventDetails] = useState<any>(null);
  const [volunteers, setVolunteers] = useState({
    registered: [] as any[],
    accepted: [] as any[],
    rejected: [] as any[],
  });
  const [selectedVolunteer, setSelectedVolunteer] = useState<any | null>(null);
  const [recommendedVolunteers, setRecommendedVolunteers] = useState<any[]>([]);

  useEffect(() => {
    const fetchEventDetails = async () => {
      if (!eventId) return;
      const eventRef = doc(db, 'events', eventId);
      const eventSnap = await getDoc(eventRef);
      if (eventSnap.exists()) {
        const data = eventSnap.data();
        setEventDetails(data);
      }
    };

    const fetchVolunteerStatus = async () => {
      if (!eventId) return;
      const ref = doc(db, 'eventvolunteer', eventId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        const registered = data.registered || [];
        const accepted = data.accepted || [];
        const rejected = data.rejected || [];

        const fetchDetails = async (uids: string[]) => {
          const details = await Promise.all(
            uids.map(async (uid) => {
              const ref = doc(db, 'volunteers', uid);
              const snap = await getDoc(ref);
              return snap.exists() ? { uid: snap.id, ...snap.data() } : null;
            })
          );
          return details.filter((v) => v !== null);
        };

        const registeredDetails = await fetchDetails(registered);
        const acceptedDetails = await fetchDetails(accepted);
        const rejectedDetails = await fetchDetails(rejected);

        setVolunteers({
          registered: registeredDetails,
          accepted: acceptedDetails,
          rejected: rejectedDetails,
        });
      }
    };

    const fetchRecommendedVolunteers = async () => {
      if (!eventId) return;
      const q = query(
        collection(db, 'recommendedMatches'),
        where('event_id', '==', eventId)
      );
      const querySnapshot = await getDocs(q);
      const recommendedData: any[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        recommendedData.push(...data.top_volunteers);
      });
      setRecommendedVolunteers(recommendedData);
    };

    fetchEventDetails();
    fetchVolunteerStatus();
    fetchRecommendedVolunteers();
  }, [eventId]);

  const handleRequestAction = async (uid: string, action: 'accept' | 'reject') => {
    if (!eventId || !eventDetails) return;
    const ref = doc(db, 'eventvolunteer', eventId);

    const newRegistered = volunteers.registered.filter((v) => v.uid !== uid);
    const newAccepted = action === 'accept' ? [...volunteers.accepted.map(v => v.uid), uid] : volunteers.accepted.map(v => v.uid);
    const newRejected = action === 'reject' ? [...volunteers.rejected.map(v => v.uid), uid] : volunteers.rejected.map(v => v.uid);

    await updateDoc(ref, {
      registered: newRegistered.map(v => v.uid),
      accepted: Array.from(new Set(newAccepted)),
      rejected: Array.from(new Set(newRejected)),
    });

    setVolunteers((prev) => ({
      registered: newRegistered,
      accepted: action === 'accept' ? [...prev.accepted, prev.registered.find(v => v.uid === uid)!] : prev.accepted,
      rejected: action === 'reject' ? [...prev.rejected, prev.registered.find(v => v.uid === uid)!] : prev.rejected,
    }));

    // Notification message
    const message =
      action === 'accept'
        ? `Your request has been accepted for the event '${eventDetails.title}'.`
        : `We appreciate your interest. Unfortunately, your request for the event '${eventDetails.title}' was not accepted.`;

    await addDoc(collection(db, 'notifications'), {
      eventUid: eventId,
      organizationUid: eventDetails.org_id || '',
      volunteerUid: uid,
      message,
      createdAt: serverTimestamp(),
    });

    // Add to upcomingevents if accepted
    if (action === 'accept') {
      const upcomingRef = doc(db, 'upcomingevents', uid);
      const existing = await getDoc(upcomingRef);

      const eventData = {
        volunteerUid: uid,
        eventUid: [eventId],
        eventName: eventDetails.title,
        eventDate: eventDetails.date,
        eventTime: eventDetails.timeSlot || eventDetails.time,
        organizationUid: eventDetails.org_id || '',
        createdAt: serverTimestamp(),
      };

      if (existing.exists()) {
        const data = existing.data();
        const updatedEventUids = Array.from(new Set([...(data.eventUid || []), eventId]));
        await updateDoc(upcomingRef, {
          ...eventData,
          eventUid: updatedEventUids,
        });
      } else {
        await setDoc(upcomingRef, eventData);
      }
    }
  };

  const renderVolunteer = (volunteer: any) => {
    const isAccepted = volunteers.accepted.some((v) => v.uid === volunteer.uid);
    const isRejected = volunteers.rejected.some((v) => v.uid === volunteer.uid);
    const isRecommended = recommendedVolunteers.includes(volunteer.uid);

    return (
      <li
        key={volunteer.uid}
        className="bg-white p-5 rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 flex justify-between items-center"
      >
        <div>
          <div className="font-semibold text-lg text-gray-800">{volunteer.name}</div>
          <div className="text-gray-600 text-sm">{volunteer.email}</div>
        </div>
        <div className="flex gap-3 items-center">
          {isRecommended && (
            <span className="px-4 py-2 bg-yellow-100 text-yellow-700 font-semibold rounded-xl">
              Recommended
            </span>
          )}
          {isAccepted ? (
            <span className="px-4 py-2 bg-green-100 text-green-700 font-semibold rounded-xl">Accepted</span>
          ) : isRejected ? (
            <span className="px-4 py-2 bg-red-100 text-red-700 font-semibold rounded-xl">Rejected</span>
          ) : (
            <>
              <button
                onClick={() => handleRequestAction(volunteer.uid, 'accept')}
                className="px-4 py-2 bg-green-500 text-white rounded-xl hover:shadow-lg"
              >
                Accept
              </button>
              <button
                onClick={() => handleRequestAction(volunteer.uid, 'reject')}
                className="px-4 py-2 bg-red-500 text-white rounded-xl hover:shadow-lg"
              >
                Reject
              </button>
            </>
          )}
          <button
            onClick={() => setSelectedVolunteer(volunteer)}
            className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:shadow-lg"
          >
            View Details
          </button>
        </div>
      </li>
    );
  };

  const closeModal = () => setSelectedVolunteer(null);

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold text-center mb-10 text-indigo-600">Request Management</h1>

      {eventDetails && (
        <div className="bg-indigo-50 p-6 rounded-xl shadow-md mb-10">
          <h2 className="text-2xl font-semibold mb-2">{eventDetails.title}</h2>
          <p className="text-gray-700 mb-1">{eventDetails.description}</p>
          <p className="text-sm text-gray-600">
            {eventDetails.date} • {eventDetails.timeSlot || eventDetails.time} • {eventDetails.venue}
          </p>
        </div>
      )}

      <div className="space-y-10">
        {['registered', 'accepted', 'rejected'].map((type) => (
          <div key={type}>
            <h3 className="text-xl font-semibold text-gray-700 capitalize mb-4">
              {type} Volunteers
            </h3>
            {volunteers[type as keyof typeof volunteers].length === 0 ? (
              <p className="text-gray-400">No {type} volunteers.</p>
            ) : (
              <ul className="space-y-4">
                {volunteers[type as keyof typeof volunteers].map((volunteer) =>
                  renderVolunteer(volunteer)
                )}
              </ul>
            )}
          </div>
        ))}
      </div>

      {selectedVolunteer && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-xl max-w-lg w-full shadow-2xl">
            <h2 className="text-2xl font-bold text-center text-indigo-600 mb-6">Volunteer Details</h2>
            <div className="space-y-3 text-gray-700">
              <p><strong>Name:</strong> {selectedVolunteer.name}</p>
              <p><strong>Email:</strong> {selectedVolunteer.email}</p>
              <p><strong>Phone:</strong> {selectedVolunteer.phone}</p>
              <p><strong>Location:</strong> {selectedVolunteer.location}</p>
              <p><strong>Skills:</strong> {selectedVolunteer.skills?.join(', ') || 'N/A'}</p>
              <p><strong>Interests:</strong> {selectedVolunteer.interests?.join(', ') || 'N/A'}</p>
              <p><strong>Available Days:</strong> {selectedVolunteer.availableDays?.join(', ') || 'N/A'}</p>
              <p><strong>Available Times:</strong> {selectedVolunteer.availableTimes?.join(', ') || 'N/A'}</p>
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={closeModal}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestManagement;