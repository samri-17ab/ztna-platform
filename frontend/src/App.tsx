import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { Shield, LayoutDashboard, MonitorSmartphone, ScrollText, Activity, Settings as SettingsIcon, LogOut, Users as UsersIcon } from 'lucide-react';
import keycloak from './api';
import Dashboard from './pages/Dashboard';
import Devices from './pages/Devices';
import Policies from './pages/Policies';
import Monitoring from './pages/Monitoring';
import Logs from './pages/Logs';
import Settings from './pages/Settings';
import Users from './pages/Users';

function App() {
    const userName = keycloak.tokenParsed?.name || "User";
    const userRole = (keycloak.tokenParsed as any)?.realm_access?.roles?.find((r: string) =>
        ["Admin", "Dev", "SecOps"].includes(r)) || "User";

    const handleLogout = () => {
        keycloak.logout();
    };

    return (
        <div className="app-layout">
            {/* ── Sidebar ── */}
            <aside className="sidebar">
                <div className="sidebar-header">
                    <div className="sidebar-logo">
                        <div className="logo-icon"><Shield size={24} color="#06b6d4" /></div>
                        <div>
                            <h1>SpecterNAC</h1>
                            <div className="logo-subtitle">Zero Trust Platform</div>
                        </div>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <div className="nav-section-label">Overview</div>
                    <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        <LayoutDashboard size={18} />
                        Dashboard
                    </NavLink>
                    <NavLink to="/monitoring" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        <Activity size={18} />
                        Live Traffic
                    </NavLink>
                    <NavLink to="/logs" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        <ScrollText size={18} />
                        Audit Trail
                    </NavLink>

                    <div className="nav-section-label">Access Control</div>
                    <NavLink to="/users" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        <UsersIcon size={18} />
                        User Directory
                    </NavLink>
                    <NavLink to="/devices" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        <MonitorSmartphone size={18} />
                        Device Inventory
                    </NavLink>
                    <NavLink to="/policies" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        <ScrollText size={18} />
                        Access Policies
                    </NavLink>

                    <div className="nav-section-label">Administration</div>
                    <NavLink to="/settings" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        <SettingsIcon size={18} />
                        Settings
                    </NavLink>
                </nav>

                <div className="sidebar-footer">
                    <div className="user-profile">
                        <div className="avatar">{userName[0]}</div>
                        <div className="user-info">
                            <div className="user-name">{userName}</div>
                            <div className="user-role">{userRole}</div>
                        </div>
                        <LogOut size={16} className="logout-icon" onClick={handleLogout} style={{ cursor: 'pointer' }} />
                    </div>
                </div>
            </aside>

            {/* ── Main Content ── */}
            <main className="main-content">
                <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/users" element={<Users />} />
                    <Route path="/devices" element={<Devices />} />
                    <Route path="/policies" element={<Policies />} />
                    <Route path="/monitoring" element={<Monitoring />} />
                    <Route path="/logs" element={<Logs />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </main>
        </div>
    );
}

export default App;
