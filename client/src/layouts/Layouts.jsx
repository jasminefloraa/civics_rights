import { useState } from 'react';
import { Link, NavLink, Outlet, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, Compass, User, ShieldCheck, LogOut, Menu, X, Radio } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
const Logo = ({ light }) => <Link to="/" className="logo" style={{ color: light ? '#fff' : '#000' }}><Radio size={20} /> CivicSignal</Link>;

export function PublicLayout() {
  const { user } = useApp();
  return (<>
    <a href="#main" className="skip">Skip to content</a>
    <header className="pub"><div className="container">
      <Logo />
      <nav className="row" aria-label="Main"><Link to="/explore" className="btn sec sm">Explore Reports</Link>
        {user ? <Link to="/dashboard" className="btn sm">Dashboard</Link> : <><Link to="/login" className="btn sec sm">Log in</Link><Link to="/register" className="btn sm">Sign up</Link></>}</nav>
    </div></header>
    <main id="main"><Outlet /></main>
    <footer><div className="container row between"><Logo light /><div><a href="/#how">About</a><a href="/#how">Features</a><a href="https://github.com/" target="_blank" rel="noreferrer">GitHub</a></div></div></footer>
  </>);
}

export function AppLayout() {
  const { user, loading, logout } = useApp(), [open, setOpen] = useState(false), loc = useLocation(), nav = useNavigate();
  if (loading) return <div className="main"><div className="sk" style={{ height: 200 }} /></div>;
  if (!user) return <Navigate to="/login" state={{ from: loc.pathname }} replace />;
  const item = (to, Icon, label) => <NavLink to={to} onClick={() => setOpen(false)} className={({ isActive }) => (isActive ? 'active' : '')}><Icon size={18} />{label}</NavLink>;
  return (
    <div className="shell">
      <div className="top"><Logo light /><button aria-label={open ? 'Close menu' : 'Open menu'} onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button></div>
      <aside className={`side ${open ? 'open' : ''}`} aria-label="Sidebar">
        <div style={{ padding: '4px 12px 16px' }}><Logo light /></div>
        {item('/dashboard', LayoutDashboard, 'Dashboard')}{item('/report/new', PlusCircle, 'Report an Issue')}{item('/explore-app', Compass, 'Explore Reports')}{item('/profile', User, 'Profile')}
        {user.role === 'admin' && item('/admin', ShieldCheck, 'Administration')}
        <div style={{ flex: 1 }} />
        <div className="small" style={{ padding: '0 12px', color: '#aaa' }}>{user.name}</div>
        <button className="navbtn" onClick={async () => { await logout(); nav('/'); }}><LogOut size={18} />Log out</button>
      </aside>
      <main className="main" id="main"><Outlet /></main>
    </div>
  );
}
export const AdminOnly = ({ children }) => { const { user } = useApp(); return user?.role === 'admin' ? children : <Navigate to="/dashboard" replace />; };
