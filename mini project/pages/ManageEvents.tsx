import React, { useEffect, useState } from 'react';
import { collection, deleteDoc, doc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuthStore } from '../store/authStore';

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  timeSlot: string;
  venue: string;
  skills: string[];
  interests: string[];
  volunteersNeeded: string;
  imageUrl: string;
}

const ManageEvents = () => {
  const user = useAuthStore((state) => state.user);
  const [events, setEvents] = useState<Event[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [editedEvent, setEditedEvent] = useState<Partial<Event>>({});

  useEffect(() => {
    const fetchEvents = async () => {
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
          ...(doc.data() as Omit<Event, 'id'>),
        }));

        setEvents(fetchedEvents);
      } catch (err) {
        console.error('Error fetching events:', err);
      }
    };

    fetchEvents();
  }, [user]);

  const handleDelete = async (id: string) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this event?');
    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, 'events', id));
      setEvents(prev => prev.filter(event => event.id !== id));
    } catch (err) {
      console.error('Error deleting event:', err);
    }
  };

  const handleEdit = (event: Event) => {
    setEditId(event.id);
    setEditedEvent({ ...event });
  };

  const handleSave = async (id: string) => {
    try {
      const eventRef = doc(db, 'events', id);
      await updateDoc(eventRef, {
        ...editedEvent,
        skills: (editedEvent.skills || []).map(s => s.trim()),
        interests: (editedEvent.interests || []).map(i => i.trim()),
      });
      setEvents(prev =>
        prev.map(event => (event.id === id ? { ...event, ...editedEvent } : event))
      );
      setEditId(null);
      setEditedEvent({});
    } catch (err) {
      console.error('Error updating event:', err);
    }
  };

  const handleChange = (field: keyof Event, value: string) => {
    if (field === 'skills' || field === 'interests') {
      setEditedEvent(prev => ({ ...prev, [field]: value.split(',') }));
    } else {
      setEditedEvent(prev => ({ ...prev, [field]: value }));
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h2 className="text-4xl font-bold text-center mb-10 text-gray-800">Manage Your Events</h2>
      {events.length === 0 ? (
        <p className="text-center text-gray-500">No events found.</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {events.map(event => (
            <div key={event.id} className="bg-white rounded-2xl shadow-lg overflow-hidden transition hover:shadow-2xl">
              <img
                src={event.imageUrl}
                alt={event.title}
                className="w-full h-60 object-cover"
              />
              <div className="p-5 space-y-3">
                {editId === event.id ? (
                  <>
                    <input className="w-full p-2 border rounded" value={editedEvent.title || ''} onChange={e => handleChange('title', e.target.value)} placeholder="Title" />
                    <textarea className="w-full p-2 border rounded" value={editedEvent.description || ''} onChange={e => handleChange('description', e.target.value)} placeholder="Description" />
                    <input type="date" className="w-full p-2 border rounded" value={editedEvent.date || ''} onChange={e => handleChange('date', e.target.value)} />
                    <input className="w-full p-2 border rounded" value={editedEvent.timeSlot || ''} onChange={e => handleChange('timeSlot', e.target.value)} placeholder="Time Slot" />
                    <input className="w-full p-2 border rounded" value={editedEvent.venue || ''} onChange={e => handleChange('venue', e.target.value)} placeholder="Venue" />
                    <input className="w-full p-2 border rounded" value={(editedEvent.skills || []).join(',')} onChange={e => handleChange('skills', e.target.value)} placeholder="Skills (comma separated)" />
                    <input className="w-full p-2 border rounded" value={(editedEvent.interests || []).join(',')} onChange={e => handleChange('interests', e.target.value)} placeholder="Interests (comma separated)" />
                    <input className="w-full p-2 border rounded" value={editedEvent.volunteersNeeded || ''} onChange={e => handleChange('volunteersNeeded', e.target.value)} placeholder="Volunteers Needed" />
                    <input className="w-full p-2 border rounded" value={editedEvent.imageUrl || ''} onChange={e => handleChange('imageUrl', e.target.value)} placeholder="Image URL" />
                    <div className="flex justify-between">
                      <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700" onClick={() => handleSave(event.id)}>Save</button>
                      <button className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600" onClick={() => setEditId(null)}>Cancel</button>
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className="text-xl font-semibold">{event.title}</h3>
                    <p className="text-gray-700">{event.description}</p>
                    <p><strong>Date:</strong> {event.date}</p>
                    <p><strong>Time:</strong> {event.timeSlot}</p>
                    <p><strong>Venue:</strong> {event.venue}</p>
                    <p><strong>Skills:</strong> {event.skills?.join(', ')}</p>
                    <p><strong>Interests:</strong> {event.interests?.join(', ')}</p>
                    <p><strong>Volunteers Needed:</strong> {event.volunteersNeeded}</p>
                    <div className="mt-4 flex justify-between">
                      <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700" onClick={() => handleEdit(event)}>Edit</button>
                      <button className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700" onClick={() => handleDelete(event.id)}>Delete</button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManageEvents;
