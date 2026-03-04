import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Search, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface EventData {
  id: string;
  type: 'event';
  title: string;
  description: string;
  city?: string;
}

interface OrganizationData {
  id: string;
  type: 'organization';
  name: string;
  description: string;
  city?: string;
}

type SearchItem = EventData | OrganizationData;

const SearchResults = () => {
  const [query, setQuery] = useState('');
  const [events, setEvents] = useState<EventData[]>([]);
  const [organizations, setOrganizations] = useState<OrganizationData[]>([]);
  const [filteredResults, setFilteredResults] = useState<SearchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const eventSnapshot = await getDocs(collection(db, 'events'));
        const orgSnapshot = await getDocs(collection(db, 'organizations'));

        const eventData: EventData[] = eventSnapshot.docs.map((doc) => ({
          id: doc.id,
          type: 'event',
          ...(doc.data() as any),
        }));

        const orgData: OrganizationData[] = orgSnapshot.docs.map((doc) => ({
          id: doc.id,
          type: 'organization',
          ...(doc.data() as any),
        }));

        setEvents(eventData);
        setOrganizations(orgData);
        setFilteredResults([...eventData, ...orgData]);
      } catch (err) {
        console.error('Error fetching search data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      const allResults = [...events, ...organizations];
      const filtered = allResults.filter((item) =>
        item.type === 'event'
          ? item.title?.toLowerCase().includes(query.toLowerCase()) || item.description?.toLowerCase().includes(query.toLowerCase())
          : item.name?.toLowerCase().includes(query.toLowerCase()) || item.description?.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredResults(filtered);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, events, organizations]);

  const handleClick = (item: SearchItem) => {
    if (item.type === 'event') {
      navigate(`/volunteer/eventdetails/${item.id}`);
    } else {
      navigate(`/volunteer/eventlist/${item.id}`);
    }
  };

  return (
    <div className="min-h-screen px-4 py-10 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative w-full">
            <Search className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search events or organizations..."
              className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center mt-10 text-blue-500">
            <Loader2 className="animate-spin w-6 h-6 mr-2" />
            Loading search results...
          </div>
        ) : filteredResults.length === 0 ? (
          <p className="text-gray-600 text-center mt-6">
            No results found for <span className="font-semibold">"{query}"</span>
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResults.map((item) => (
              <div
                key={item.id}
                onClick={() => handleClick(item)}
                className="bg-white p-5 rounded-2xl shadow-md hover:shadow-xl transition cursor-pointer"
              >
                <div className="mb-2">
                  <span
                    className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${
                      item.type === 'event' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {item.type === 'event' ? 'Event' : 'Organization'}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-gray-800">
                  {'title' in item ? item.title : item.name}
                </h2>
                <p className="text-gray-600 mt-1 line-clamp-3">{item.description}</p>
                {item.city && (
                  <p className="text-sm text-gray-500 mt-2">📍 {item.city}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResults;