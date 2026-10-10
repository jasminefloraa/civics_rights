import { Navigate, Route, Routes } from 'react-router-dom';
import { PublicLayout, AppLayout, AdminOnly } from './layouts/Layouts.jsx';
import Landing from './pages/Landing.jsx'; import Auth from './pages/Auth.jsx'; import Dashboard from './pages/Dashboard.jsx';
import ReportForm from './pages/ReportForm.jsx'; import Explore from './pages/Explore.jsx'; import ReportDetail from './pages/ReportDetail.jsx';
import Profile from './pages/Profile.jsx'; import Admin from './pages/Admin.jsx';
import { useTitle } from './hooks/useFetch.js';
const NotFound = () => { useTitle('Not found'); return <div className="container" style={{ padding: 60 }}><h1>Page not found</h1></div>; };
export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Landing />} /><Route path="/explore" element={<Explore />} /><Route path="/reports/:id" element={<ReportDetail />} />
        <Route path="/login" element={<Auth mode="login" />} /><Route path="/register" element={<Auth mode="register" />} />
      </Route>
      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<Dashboard />} /><Route path="/report/new" element={<ReportForm />} /><Route path="/explore-app" element={<Explore />} />
        <Route path="/profile" element={<Profile />} /><Route path="/admin" element={<AdminOnly><Admin /></AdminOnly>} />
      </Route>
      <Route path="/home" element={<Navigate to="/" replace />} /><Route path="*" element={<NotFound />} />
    </Routes>
  );
}
