export interface User {
  id: string;
  email: string;
  userType: 'volunteer' | 'organization';
  name: string;
  skills: string[];
  interests: string[];
  availability: string[];
  location: string;
  bio: string;
  createdAt: string;
}

export interface Event {
  id: string;
  organizationId: string;
  title: string;
  description: string;
  date: string;
  location: string;
  requiredSkills: string[];
  maxParticipants: number;
  currentParticipants: number;
  status: 'upcoming' | 'ongoing' | 'completed';
  qrCode: string;
}

export interface Certificate {
  id: string;
  userId: string;
  eventId: string;
  issueDate: string;
  volunteerHours: number;
  skills: string[];
  pdfUrl: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'event' | 'match' | 'reminder' | 'certificate';
  read: boolean;
  createdAt: string;
}