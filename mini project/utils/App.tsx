import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import { DashboardNavbar } from './components/DashboardNavbar';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { Home } from './pages/Home';
import { Register } from './pages/Register';
import { Login } from './pages/Login';
import  { VolunteerDashboard }  from './pages/VolunteerDashboard';
import { OrganizationDashboard } from './pages/OrganizationDashboard';
import ManageEvents from './pages/ManageEvents';
import EventDetails from './pages/EventDetails';
import { Profile } from './pages/Profile';
import PostEvent from './pages/PostEvent';
import SearchResults from './pages/SearchResults';
import EventList from './pages/EventList';
import VolunteersPage from './pages/VolunteersPage';
import TrackVolunteer from './pages/TrackVolunteer'; // ✅ Correct default import
import RequestManagement from './pages/RequestManagement'; // ✅ Correct default import
import UpcomingEvents from "./pages/UpcomingEvents";
import Notifications from './pages/Notifications';
import PastParticipations from './pages/PastParticipations';
import RecommendedEvents from './pages/RecommendedEvents'; // Adjust the path if different
import  AnalyticsPage  from './pages/AnalyticsPage';

const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();

  const showDashboardNavbar = !['/', '/login', '/register'].includes(location.pathname);

  return (
    <div className="min-h-screen bg-gray-50">
      {showDashboardNavbar ? <DashboardNavbar /> : <Navigation />}
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <NotificationProvider>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login />} />
              <Route path="/volunteer/dashboard" element={<VolunteerDashboard />} />
              <Route path="/volunteer/search" element={<SearchResults />} />
              <Route path="/volunteer/eventdetails/:id" element={<EventDetails />} />
              <Route path="/volunteer/eventlist/:orgId" element={<EventList />} />
              <Route path="/volunteer/upcoming-events" element={<UpcomingEvents />} />
              <Route path="/volunteer/past-participations" element={<PastParticipations />} />
              <Route path="/volunteer/notifications" element={<Notifications />} />
              <Route path="/volunteer/recommended-events" element={<RecommendedEvents />} />
              <Route path="/organization/dashboard" element={<OrganizationDashboard />} />
              <Route path="/organization/post-event" element={<PostEvent />} />
              <Route path="/organization/manage-events" element={<ManageEvents />} />
              <Route path="/organization/volunteers" element={<VolunteersPage />} />
              <Route path="/organization/request-management/:eventId" element={<RequestManagement />} />
              <Route path="/organization/track-volunteer/:eventId" element={<TrackVolunteer />} />
              <Route path="/organization/analytics" element={<AnalyticsPage />} />
              <Route path="/profile" element={<Profile />} />
            </Routes>
          </Layout>
        </NotificationProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;