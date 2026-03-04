import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { useAuthStore } from "../store/authStore";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
} from "firebase/firestore";
import { Search } from "lucide-react";

interface Event {
  id: string;
  title: string;
  date: string;
  venue: string;
  imageUrl: string;
}

const VolunteersPage = () => {
  const user = useAuthStore((state) => state.user);
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"request" | "tracking">("request");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEvents = async () => {
      if (!user?.uid) return;
      const orgRef = doc(db, "organizations", user.uid);
      const orgSnap = await getDoc(orgRef);
      const orgId = orgSnap.data()?.org_id;

      const q = query(collection(db, "events"), where("org_id", "==", orgId));
      const querySnapshot = await getDocs(q);
      const fetched = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Event, "id">),
      }));
      setEvents(fetched);
      setFilteredEvents(fetched);
    };

    fetchEvents();
  }, [user]);

  useEffect(() => {
    const filtered = events.filter((event) =>
      event.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredEvents(filtered);
  }, [searchQuery, events]);

  const handleEventClick = (id: string) => {
    const path =
      activeTab === "request"
        ? `/organization/request-management/${id}`
        : `/organization/track-volunteer/${id}`;
    navigate(path);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {/* Tabs */}
      <div className="flex justify-center mb-6">
        <div className="bg-gray-100 p-1 rounded-full flex gap-2 shadow-inner">
          {["request", "tracking"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as "request" | "tracking")}
              className={`px-6 py-2 rounded-full transition text-sm font-medium ${
                activeTab === tab
                  ? "bg-white text-blue-600 shadow"
                  : "text-gray-500"
              }`}
            >
              {tab === "request" ? "Request Management" : "Track Volunteers"}
            </button>
          ))}
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md mx-auto mb-10">
        <Search className="absolute left-4 top-3.5 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Search events..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-full border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
        />
      </div>

      {/* Event Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredEvents.length === 0 ? (
          <p className="col-span-full text-center text-gray-500">
            No events found.
          </p>
        ) : (
          filteredEvents.map((event) => (
            <div
              key={event.id}
              onClick={() => handleEventClick(event.id)}
              className="bg-white rounded-2xl overflow-hidden shadow hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-pointer border"
            >
              <img
                src={event.imageUrl}
                alt={event.title}
                className="h-48 w-full object-cover"
              />
              <div className="p-5">
                <h3 className="text-xl font-semibold text-gray-800 mb-1">{event.title}</h3>
                <p className="text-sm text-gray-500 mb-3">
                  {event.date} &bull; {event.venue}
                </p>
                <button className="w-full bg-blue-600 text-white py-2 rounded-full text-sm font-medium hover:bg-blue-700 transition">
                  {activeTab === "request" ? "Manage Requests" : "Track Volunteers"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default VolunteersPage;