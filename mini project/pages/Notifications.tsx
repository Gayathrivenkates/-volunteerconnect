import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuthStore } from '../store/authStore';

interface NotificationType {
  id: string;
  eventUid: string;
  organizationUid: string;
  volunteerUid: string;
  message: string;
  createdAt: any;
  read: boolean;
}

const Notifications = () => {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<NotificationType[]>([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user?.uid) return;

      const q = query(
        collection(db, 'notifications'),
        where('volunteerUid', '==', user.uid)
      );

      const snapshot = await getDocs(q);
      const fetched = snapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as NotificationType),
      }));

      const sorted = fetched.sort(
        (a, b) => b.createdAt?.seconds - a.createdAt?.seconds
      );
      setNotifications(sorted);
    };

    fetchNotifications();
  }, [user?.uid]);

  const markAsRead = async (notificationId: string) => {
    const updated = notifications.map(n =>
      n.id === notificationId ? { ...n, read: true } : n
    );
    setNotifications(updated);
    await updateDoc(doc(db, 'notifications', notificationId), { read: true });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-indigo-600 mb-8">Notifications</h1>

      {notifications.length === 0 ? (
        <p className="text-gray-500 text-center">No notifications yet.</p>
      ) : (
        <ul className="space-y-4">
          {notifications.map(notification => (
            <li
              key={notification.id}
              onClick={() => markAsRead(notification.id)}
              className={`cursor-pointer p-4 rounded-xl shadow-md bg-white hover:shadow-lg transition border-l-4 ${
                notification.read ? 'border-gray-300' : 'border-indigo-500'
              }`}
            >
              <p
                className={`$ {
                  notification.read ? 'text-gray-700 font-normal' : 'font-bold text-gray-800'
                }`}
              >
                {notification.message}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(notification.createdAt?.seconds * 1000).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Notifications;
