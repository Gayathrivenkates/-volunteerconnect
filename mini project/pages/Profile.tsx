import React, { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuthStore } from '../store/authStore';
import { Mail, MapPin, Phone, Star, Users, Pencil } from 'lucide-react';

export const Profile = () => {
  const user = useAuthStore((state) => state.user);
  const [userData, setUserData] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);
  const [formState, setFormState] = useState<any>({});

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user || !user.uid || !user.role) return;

      const docRef = doc(db, user.role === 'volunteer' ? 'volunteers' : 'organizations', user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserData(data);
        setFormState({
          skills: data.skills?.join(', ') || '',
          interests: data.interests?.join(', ') || '',
          availableDay: data.availableDay?.join(', ') || '',
          availableTime: data.availableTime?.join(', ') || '',
        });
      }
    };

    fetchUserData();
  }, [user]);

  const handleChange = (field: string, value: string) => {
    setFormState((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  const saveChanges = async () => {
    const updatedData = {
      skills: formState.skills.split(',').map((s: string) => s.trim()),
      interests: formState.interests.split(',').map((s: string) => s.trim()),
      availableDay: formState.availableDay.split(',').map((d: string) => d.trim()),
      availableTime: formState.availableTime.split(',').map((t: string) => t.trim()),
    };

    const docRef = doc(db, user.role === 'volunteer' ? 'volunteers' : 'organizations', user.uid);
    await updateDoc(docRef, updatedData);
    setUserData((prev: any) => ({ ...prev, ...updatedData }));
    setEditMode(false);
  };

  if (!userData) {
    return <div className="text-center mt-20">Loading Profile...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white rounded-2xl shadow-xl text-gray-800 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-blue-600">Profile</h2>
        {user.role === 'volunteer' && (
          <button
            onClick={() => setEditMode((prev) => !prev)}
            className="flex items-center px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 rounded-md text-blue-700"
          >
            <Pencil size={16} className="mr-1" />
            {editMode ? 'Cancel' : 'Edit'}
          </button>
        )}
      </div>

      <div className="space-y-3 text-sm">
        <InfoItem icon={<Users size={18} />} label={user.role === 'volunteer' ? 'Volunteer ID' : 'Organization ID'} value={userData.user_id || userData.org_id} />
        <InfoItem icon={<Mail size={18} />} label="Email" value={userData.email} />
        <InfoItem icon={<Phone size={18} />} label="Phone" value={userData.phone} />
        <InfoItem icon={<MapPin size={18} />} label="Location" value={userData.location} />
        <InfoItem icon={<Users size={18} />} label="Name" value={userData.name} />
      </div>

      {user.role === 'volunteer' && (
        <div className="space-y-4 text-sm border-t pt-4 mt-4">
          {['skills', 'interests', 'availableDay', 'availableTime'].map((field) => (
            <EditableField
              key={field}
              label={formatLabel(field)}
              value={formState[field]}
              onChange={(val) => handleChange(field, val)}
              editable={editMode}
            />
          ))}

          {editMode && (
            <button
              onClick={saveChanges}
              className="mt-3 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-md shadow-md hover:from-purple-700 hover:to-pink-600 transition"
            >
              Save Changes
            </button>
          )}
        </div>
      )}
    </div>
  );
};

const InfoItem = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <p className="flex items-center">
    <span className="mr-2 text-gray-500">{icon}</span>
    <strong>{label}:</strong>
    <span className="ml-1 text-gray-800">{value}</span>
  </p>
);

const EditableField = ({
  label,
  value,
  onChange,
  editable,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  editable: boolean;
}) => (
  <div className="flex flex-col">
    <label className="font-medium text-gray-700 mb-1">{label}:</label>
    {editable ? (
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-gray-300 px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        placeholder={`Comma-separated values`}
      />
    ) : (
      <span className="text-gray-800">{value || 'N/A'}</span>
    )}
  </div>
);

const formatLabel = (key: string) => {
  switch (key) {
    case 'skills':
      return 'Skills';
    case 'interests':
      return 'Interests';
    case 'availableDay':
      return 'Available Days';
    case 'availableTime':
      return 'Available Times';
    default:
      return key;
  }
};