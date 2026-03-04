import React, { useState } from 'react';
import { format } from 'date-fns';
import { doc, getDoc, addDoc, collection, serverTimestamp, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuthStore } from '../store/authStore';
import { matchVolunteers } from '../components/matchVolunteers';

export default function PostEvent() {
  const [date, setDate] = useState<string>('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageUrl: '',
    venue: '',
    city: '',
    skills: '',
    interests: '',
    volunteersNeeded: '',
    timeSlot: '',
    contactName: '',
    contactInfo: '',
  });

  const { user } = useAuthStore(); // Getting org ID from Zustand

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleScheduleSuggest = async () => {
      const data = {
        eventName: formData.title,
        eventDescription: formData.description,
        interests: formData.interests.split(',').map(i => i.trim()),
        volunteersNeeded: Number(formData.volunteersNeeded),
      };

      try {
        const response = await fetch("http://127.0.0.1:5000/suggest_schedule", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

       if (response.ok) {
         const result = await response.json();

         // ✅ Set the values
         setDate(result.date);
         setFormData((prev) => ({ ...prev, timeSlot: result.timeSlot }));

         // ✅ Show matched volunteer names in alert popup
         if (result.volunteer_names && result.volunteer_names.length > 0) {
           const names = result.volunteer_names.join('\n'); // Join names if there are multiple volunteers
           alert(`Suggested volunteers:\n\n${names}`);
         } else {
           alert("No matching volunteers found, but schedule was suggested.");
         }
       } else {
         const error = await response.json();
         alert(error.message || "Failed to suggest schedule.");
       }
      } catch (err) {
        console.error("Error suggesting schedule:", err);
        alert("Schedule suggestion failed.");
      }
    };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.uid) {
      alert("Organization not logged in.");
      return;
    }

    try {
      // Get the organization document using uid
      const orgDocRef = doc(db, 'organizations', user.uid);
      const orgSnap = await getDoc(orgDocRef);

      if (!orgSnap.exists()) {
        alert("Organization not found in Firestore.");
        return;
      }

      const orgData = orgSnap.data();
      const org_id = orgData?.org_id;

      if (!org_id) {
        alert("org_id missing in the organization document.");
        return;
      }

      // Prepare event details
      const eventDetails = {
        ...formData,
        skills: formData.skills.split(',').map(s => s.trim()).filter(Boolean),
        interests: formData.interests.split(',').map(i => i.trim()).filter(Boolean),
        date,
        createdAt: serverTimestamp(),
        org_id: org_id,
      };

      // Save to 'events' collection
      const eventRef = await addDoc(collection(db, 'events'), eventDetails);

      // Get organization document reference and update events array
      const orgRef = doc(db, 'organizations', user.uid);
      await updateDoc(orgRef, {
        events: arrayUnion(eventRef.id), // Use arrayUnion to add event ID to the events array
      });

      await matchVolunteers(eventRef.id, eventDetails);

      alert('Event posted successfully!');

      // Reset form
      setFormData({
        title: '',
        description: '',
        imageUrl: '',
        venue: '',
        city: '',
        skills: '',
        interests: '',
        volunteersNeeded: '',
        timeSlot: '',
        contactName: '',
        contactInfo: '',
      });
      setDate('');
    } catch (err: any) {
      console.error("Error posting event:", err.message || err);
      alert("Failed to post event. Try again.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-6">
      <h2 className="text-4xl font-bold text-center text-blue-700 mb-8">Post a New Event</h2>
      <form onSubmit={handleSubmit} className="space-y-6 bg-white shadow-xl rounded-2xl p-8 border border-gray-200">

        {/* Title */}
        <div>
          <label className="block mb-1 font-medium text-gray-700">Event Title</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-300"
            placeholder="e.g. Beach Cleanup"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block mb-1 font-medium text-gray-700">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-300"
            placeholder="Describe the event purpose, activities, etc."
          />
        </div>

        {/* Image URL and Preview */}
        <div>
          <label className="block mb-1 font-medium text-gray-700">Image URL (optional)</label>
          <input
            type="text"
            name="imageUrl"
            value={formData.imageUrl}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-300"
            placeholder="Paste image link here..."
          />
          {formData.imageUrl && (
            <img src={formData.imageUrl} alt="Preview" className="w-full max-h-64 object-cover mt-3 rounded-md" />
          )}
        </div>

        {/* Venue and City */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 font-medium text-gray-700">Venue</label>
            <input
              type="text"
              name="venue"
              value={formData.venue}
              onChange={handleChange}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-300"
              placeholder="e.g. Marina Beach"
            />
          </div>
          <div>
            <label className="block mb-1 font-medium text-gray-700">City</label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-300"
              placeholder="e.g. Chennai"
            />
          </div>
        </div>

        {/* Skills and Interests */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 font-medium text-gray-700">Recommended Skills</label>
            <input
              type="text"
              name="skills"
              value={formData.skills}
              onChange={handleChange}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-300"
              placeholder="e.g. First Aid, Teamwork"
            />
          </div>
          <div>
            <label className="block mb-1 font-medium text-gray-700">Preferred Volunteer Interests</label>
            <input
              type="text"
              name="interests"
              value={formData.interests}
              onChange={handleChange}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-300"
              placeholder="e.g. Environment, Education"
            />
          </div>
        </div>

        {/* Schedule Suggest Button */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleScheduleSuggest}
            className="bg-emerald-600 text-white px-5 py-2 rounded-md hover:bg-emerald-700 transition"
          >
            Suggest Schedule
          </button>
        </div>

        {/* Date and Time */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 font-medium text-gray-700">Date</label>
            <input
              type="date"
              name="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-300"
            />
          </div>
          <div>
            <label className="block mb-1 font-medium text-gray-700">Time Slot</label>
            <input
              type="text"
              name="timeSlot"
              value={formData.timeSlot}
              onChange={handleChange}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-300"
              placeholder="e.g. 10AM - 1PM"
            />
          </div>
        </div>

        {/* Volunteers Needed */}
        <div>
          <label className="block mb-1 font-medium text-gray-700">Volunteers Needed</label>
          <input
            type="number"
            name="volunteersNeeded"
            value={formData.volunteersNeeded}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-300"
            placeholder="e.g. 20"
          />
        </div>

        {/* Contact Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 font-medium text-gray-700">Contact Name</label>
            <input
              type="text"
              name="contactName"
              value={formData.contactName}
              onChange={handleChange}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-300"
              placeholder="e.g. John Doe"
            />
          </div>
          <div>
            <label className="block mb-1 font-medium text-gray-700">Contact Info</label>
            <input
              type="text"
              name="contactInfo"
              value={formData.contactInfo}
              onChange={handleChange}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-300"
              placeholder="Phone or Email"
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-blue-700 text-white text-lg py-3 rounded-lg font-semibold hover:bg-blue-800 transition"
        >
          Submit Event
        </button>
      </form>
    </div>
  );
}