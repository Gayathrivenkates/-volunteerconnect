import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Users, Mail, Lock, MapPin, Star, Phone } from 'lucide-react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, doc, setDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useAuthStore } from '../store/authStore';

// Generate next volunteer ID like U001, U002...
const getNextVolunteerId = async () => {
  const usersRef = collection(db, 'volunteers');
  const snapshot = await getDocs(usersRef);
  const count = snapshot.size;
  return `U${(count + 1).toString().padStart(3, '0')}`;
};

// Generate next organization ID like ORG001, ORG002...
const getNextOrganizationId = async () => {
  const orgRef = collection(db, 'organizations');
  const snapshot = await getDocs(orgRef);
  const count = snapshot.size;
  return `ORG${(count + 1).toString().padStart(3, '0')}`;
};

export const Register = () => {
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);
  const [userType, setUserType] = useState<'volunteer' | 'organization'>('volunteer');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    location: '',
    skills: [] as string[],
    interests: [] as string[],
    availableDay: [] as string[],
    availableTime: [] as string[],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      const user = userCredential.user;

      if (userType === 'volunteer') {
        const userId = await getNextVolunteerId();
        await setDoc(doc(db, 'volunteers', user.uid), {
          user_id: userId,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          location: formData.location,
          skills: formData.skills,
          interests: formData.interests,
          availableDay: formData.availableDay,
          availableTime: formData.availableTime,
          createdAt: serverTimestamp(),
        });

        setUser({
          uid: user.uid, // ✅ use Firebase UID, not generated ID
          name: formData.name,
          email: formData.email,
          role: 'volunteer',
        });


        navigate('/volunteer/dashboard');
      } else {
        const orgId = await getNextOrganizationId();
        await setDoc(doc(db, 'organizations', user.uid), {
          org_id: orgId,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          location: formData.location,
          createdAt: serverTimestamp(),
        });

        setUser({
          uid: user.uid,

          name: formData.name,
          email: formData.email,
          role: 'organization',
        });

        navigate('/organization/dashboard');
      }
    } catch (error: any) {
      alert('Registration failed: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6">
        <h2 className="text-xl font-bold text-center text-blue-700 mb-4">
          <UserPlus className="inline mr-1" size={20} /> Register
        </h2>

        <div className="flex justify-center mb-6 space-x-2">
          <button
            className={`px-4 py-1.5 text-sm rounded-full font-medium ${
              userType === 'volunteer'
                ? 'bg-blue-600 text-white shadow'
                : 'bg-gray-200 text-gray-700'
            }`}
            onClick={() => setUserType('volunteer')}
          >
            <Users className="inline mr-1" size={16} /> Volunteer
          </button>
          <button
            className={`px-4 py-1.5 text-sm rounded-full font-medium ${
              userType === 'organization'
                ? 'bg-purple-600 text-white shadow'
                : 'bg-gray-200 text-gray-700'
            }`}
            onClick={() => setUserType('organization')}
          >
            <UserPlus className="inline mr-1" size={16} /> Organization
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div>
            <label className="block mb-1 text-gray-700">Email</label>
            <div className="relative">
              <Mail className="absolute left-2.5 top-2.5 text-gray-400" size={16} />
              <input
                type="email"
                required
                placeholder="you@example.com"
                className="pl-8 w-full rounded-md border border-gray-300 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block mb-1 text-gray-700">Password</label>
            <div className="relative">
              <Lock className="absolute left-2.5 top-2.5 text-gray-400" size={16} />
              <input
                type="password"
                required
                placeholder="••••••••"
                className="pl-8 w-full rounded-md border border-gray-300 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block mb-1 text-gray-700">
              {userType === 'volunteer' ? 'Full Name' : 'Organization Name'}
            </label>
            <input
              type="text"
              required
              className="w-full rounded-md border border-gray-300 py-1.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <label className="block mb-1 text-gray-700">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-2.5 top-2.5 text-gray-400" size={16} />
              <input
                type="tel"
                required
                placeholder="e.g. +91 9876543210"
                className="pl-8 w-full rounded-md border border-gray-300 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          {userType === 'volunteer' && (
            <>
              <div>
                <label className="block mb-1 text-gray-700">Skills</label>
                <div className="relative">
                  <Star className="absolute left-2.5 top-2.5 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="e.g. Teaching, Coding"
                    className="pl-8 w-full rounded-md border border-gray-300 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        skills: e.target.value.split(',').map((s) => s.trim()),
                      })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 text-gray-700">Interests</label>
                <div className="relative">
                  <Star className="absolute left-2.5 top-2.5 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="e.g. Environment, Health"
                    className="pl-8 w-full rounded-md border border-gray-300 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        interests: e.target.value.split(',').map((s) => s.trim()),
                      })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 text-gray-700">Available Day</label>
                <input
                  type="text"
                  placeholder="e.g. Monday, Weekends"
                  className="w-full rounded-md border border-gray-300 py-1.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      availableDay: e.target.value.split(',').map((d) => d.trim()),
                    })
                  }
                />
              </div>

              <div>
                <label className="block mb-1 text-gray-700">Available Time</label>
                <input
                  type="text"
                  placeholder="e.g. 10am - 2pm, 5pm - 6pm"
                  className="w-full rounded-md border border-gray-300 py-1.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      availableTime: e.target.value.split(',').map((t) => t.trim()),
                    })
                  }
                />
              </div>
            </>
          )}

          <div>
            <label className="block mb-1 text-gray-700">Location</label>
            <div className="relative">
              <MapPin className="absolute left-2.5 top-2.5 text-gray-400" size={16} />
              <input
                type="text"
                required
                placeholder="City, Country"
                className="pl-8 w-full rounded-md border border-gray-300 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-md shadow-md hover:from-purple-700 hover:to-pink-600 transition duration-300 text-sm"
          >
            Register
          </button>
        </form>
      </div>
    </div>
  );
};