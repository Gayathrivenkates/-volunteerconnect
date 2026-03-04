import {
    collection,
    getDocs,
    query,
    where,
    addDoc,
    serverTimestamp
  } from 'firebase/firestore';
  import { db } from '../firebase';

  const getDayFromDate = (dateStr: string) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dateObj = new Date(dateStr);
    return days[dateObj.getDay()];
  };

  const dayAliases = {
    weekdays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    weekends: ['Saturday', 'Sunday']
  };

  const parseTimeRange = (timeRange: string) => {
    if (typeof timeRange !== 'string' || !timeRange.includes('-')) {
      console.warn('Invalid time range format:', timeRange);
      return [0, 0]; // Return a neutral range
    }

    const [start, end] = timeRange.split('-');
    const parseTime = (t: string) => {
      const match = t.match(/(\d+)(AM|PM)/i);
      if (!match) return 0;
      const [_, time, modifier] = match;
      let hour = parseInt(time);
      if (modifier.toUpperCase() === 'PM' && hour !== 12) hour += 12;
      if (modifier.toUpperCase() === 'AM' && hour === 12) hour = 0;
      return hour;
    };
    return [parseTime(start), parseTime(end)];
  };

  const timeRangesOverlap = (range1: string, range2: string) => {
    const [start1, end1] = parseTimeRange(range1);
    const [start2, end2] = parseTimeRange(range2);
    return Math.max(start1, start2) < Math.min(end1, end2);
  };

  const calculateScore = async (volunteer: any, event: any): Promise<number> => {
    let score = 0;

    // City substring match
    if (typeof volunteer.location === 'string' && typeof event.city === 'string') {
      if (volunteer.location.toLowerCase().includes(event.city.toLowerCase())) {
        score += 10;
      }
    }

    // Time slot overlap - reduce weight for availability
    if (volunteer.availableTime && event.timeSlot && typeof volunteer.availableTime === 'string' && typeof event.timeSlot === 'string') {
      if (timeRangesOverlap(volunteer.availableTime, event.timeSlot)) {
        score += 4; // Reduced weight for availability
      }
    }

    // Day match - reduced impact
    if (event.date) {
      const eventDay = getDayFromDate(event.date);
      const availableDays: string[] = Array.isArray(volunteer.availableDay) ? volunteer.availableDay : [];

      const expandedAvailableDays = availableDays.flatMap((day) => {
        if (typeof day === 'string') {
          const key = day.toLowerCase() as keyof typeof dayAliases;
          return dayAliases[key] || [day];
        }
        return [];
      });

      if (expandedAvailableDays.includes(eventDay)) {
        score += 3; // Reduced weight for day match
      }
    }

    // Skills match - increased weight
    const skillMatch = Array.isArray(event.skills) && Array.isArray(volunteer.skills)
      ? event.skills.filter((s: string) => volunteer.skills.includes(s)).length
      : 0;
    score += skillMatch * 10; // Increased weight for skills match

    // Interests match - increased weight
    const interestMatch = Array.isArray(event.interests) && Array.isArray(volunteer.interests)
      ? event.interests.filter((i: string) => volunteer.interests.includes(i)).length
      : 0;
    score += interestMatch * 7; // Increased weight for interests match

    // Past similar events
    const pastParticipation: string[] = Array.isArray(volunteer.pastParticipation) ? volunteer.pastParticipation : [];
    if (pastParticipation.length > 0) {
      const chunked = pastParticipation.slice(0, 10);

      try {
        const pastQuery = query(
          collection(db, 'events'),
          where('__name__', 'in', chunked)
        );
        const pastSnapshots = await getDocs(pastQuery);
        pastSnapshots.forEach((snap) => {
          const past = snap.data();
          if (past.title === event.title) {
            score += 4;
          }
        });
      } catch (err) {
        console.warn('Error querying past events:', err);
      }
    }

    return score;
  };

  export const matchVolunteers = async (eventId: string, eventDetails: any) => {
    try {
      const volunteersSnap = await getDocs(collection(db, 'volunteers'));
      const volunteers: { id: string; data: any }[] = [];

      volunteersSnap.forEach((doc) => {
        const data = doc.data();
        volunteers.push({ id: doc.id, data });
      });

      const scored = await Promise.all(
        volunteers.map(async (v) => ({
          id: v.id,
          score: await calculateScore(v.data, eventDetails),
        }))
      );

      // Use volunteersNeeded from eventDetails instead of hardcoded 5
      const volunteersNeeded = eventDetails.volunteersNeeded || 5;

      // Sort by score and slice based on volunteersNeeded
      const top = scored
        .sort((a, b) => b.score - a.score)
        .slice(0, volunteersNeeded) // Dynamically slice based on volunteersNeeded
        .map((v) => v.id);

      // Store top volunteers in Firestore
      await addDoc(collection(db, 'recommendedMatches'), {
        event_id: eventId,
        top_volunteers: top,
        createdAt: serverTimestamp(),
      });

      console.log(' Top matched volunteers stored:', top);
    } catch (matchErr) {
      console.error(' Error during volunteer matching:', matchErr);
    }
  };
