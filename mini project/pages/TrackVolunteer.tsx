import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import QrReader from 'react-qr-scanner';
import { db } from '../firebase';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  arrayUnion
} from 'firebase/firestore';

const TrackVolunteer = () => {
  const { eventId } = useParams();
  const [eventName, setEventName] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [scanError, setScanError] = useState('');
  const [scanning, setScanning] = useState(true);
  const [scanCooldown, setScanCooldown] = useState(false);  // Added cooldown state

  // Fetch event details (event name)
  useEffect(() => {
    const fetchEventName = async () => {
      setLoading(true);
      try {
        const eventRef = doc(db, 'events', eventId); // Fetch event details using eventId
        const eventSnap = await getDoc(eventRef);
        if (eventSnap.exists()) {
          setEventName(eventSnap.data().title); // Ensure event name is stored correctly
        } else {
          setEventName('Event Not Found');
        }
      } catch (error) {
        console.error('Error fetching event data:', error);
        setEventName('Error Loading Event');
      }
      setLoading(false);
    };

    fetchEventName();
  }, [eventId]);

  const handleScan = async (data: any) => {
    if (data && scanning && !scanCooldown) {
      try {
        setScanCooldown(true); // Enable cooldown to prevent multiple scans too quickly

        const parsed = JSON.parse(data.text || data); // Support both text and raw QR data
        const { volunteerUid, eventUid } = parsed;

        if (eventUid !== eventId) {
          setMessage('❌ QR does not match this event.');
          return;
        }

        const docRef = doc(db, 'trackvolunteer', `${volunteerUid}_${eventUid}`);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          // Check-in: Create a new document for check-in
          await setDoc(docRef, {
            volunteerUid,
            eventUid,
            checkIn: serverTimestamp(),
            checkOut: null,
            hoursContributed: 0,
          });
          setMessage('✅ Check-in recorded!');
        } else {
          const data = docSnap.data();
          if (!data.checkOut) {
            // Check-out: Calculate and update hours
            const checkInTime = data.checkIn?.toDate() || new Date();
            const now = new Date();
            const timeDifference = now.getTime() - checkInTime.getTime(); // Get difference in ms

            // Calculate hours
            const hours = timeDifference / 36e5; // Convert ms to hours
            const formattedHours = parseFloat(hours.toFixed(2)); // Round to 2 decimal places

            // Update check-out and hours
            await updateDoc(docRef, {
              checkOut: serverTimestamp(),
              hoursContributed: formattedHours,
            });

            setMessage(`✅ Check-out recorded. Hours contributed: ${formattedHours}h`);

            // Update volunteer's past participation and calculate total hours
            const pastRef = doc(db, 'pastparticipations', volunteerUid);
            const pastSnap = await getDoc(pastRef);

            let totalHours = formattedHours;
            if (pastSnap.exists()) {
              const pastData = pastSnap.data();
              const updatedEvents = [...new Set([...(pastData.eventUids || []), eventUid])];
              totalHours += pastData.totalHours || 0;

              // Update past participations with total hours and events
              await updateDoc(pastRef, {
                volunteerUid,  // Add volunteer ID
                eventUids: updatedEvents,
                totalHours,
              });
            } else {
              // If no previous participation exists, create new record
              await setDoc(pastRef, {
                volunteerUid,  // Add volunteer ID
                eventUids: [eventUid],
                totalHours,
              });
            }

            // Also add eventUid to volunteer's record for pastparticipations
            const volunteerRef = doc(db, 'volunteers', volunteerUid);
            await updateDoc(volunteerRef, {
              pastParticipations: arrayUnion(eventUid),
            });

            // Remove event from upcoming events
            const upcomingRef = doc(db, 'upcomingevents', volunteerUid);
            const upcomingSnap = await getDoc(upcomingRef);

            if (upcomingSnap.exists()) {
              const upcomingData = upcomingSnap.data();
              const updatedEventIds = upcomingData.eventIds.filter((id: string) => id !== eventUid);

              // Update the upcoming events collection by removing the eventId
              await updateDoc(upcomingRef, {
                eventIds: updatedEventIds,
              });
            }

          } else {
            setMessage('✅ Already checked out.');
          }
        }

        // After processing, wait a few seconds before allowing another scan
        setTimeout(() => {
          setScanCooldown(false);
        }, 3000); // 3-second cooldown period

      } catch (err: any) {
        console.error('Error reading QR:', err);
      }
    }
  };

  const handleError = (err: any) => {
    console.error(err);
    setScanError('QR Scanner failed. Please refresh or try again.');
  };

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold text-center text-indigo-600 mb-6">
        Track Volunteer - Event {eventName}
      </h1>

      <div className="rounded-xl overflow-hidden shadow-md bg-white p-4">
        <QrReader
          delay={300}
          style={{ width: '100%' }}
          onError={handleError}
          onScan={handleScan}
        />
      </div>

      {message && (
        <p className="text-center mt-6 text-lg font-semibold text-green-600">{message}</p>
      )}
      {scanError && (
        <p className="text-center mt-6 text-red-600 font-semibold">{scanError}</p>
      )}
    </div>
  );
};

export default TrackVolunteer;
