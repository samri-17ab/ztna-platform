import { ShieldAlert, MonitorCheck, Network } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const authData = [
    { time: '08:00', success: 120, blocked: 5 },
    { time: '09:00', success: 350, blocked: 12 },
    { time: '10:00', success: 420, blocked: 8 },
    { time: '11:00', success: 380, blocked: 45 }, // Spike in blocked
    { time: '12:00', success: 290, blocked: 6 },
    { time: '13:00', success: 310, blocked: 4 },
    { time: '14:00', success: 405, blocked: 9 },
];

export default function Dashboard() {
    return (
        <div>
            <div className="view-header">
                <div className="view-title">
                    <h2>Network Dashboard</h2>
                    <p>Real-time overview of authentication requests and device posture.</p>
                </div>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-header">
                        Active Sessions
                        <Network size={20} color="var(--primary)" />
                    </div>
                    <div className="stat-value">1,204</div>
                    <div className="stat-trend positive">↑ 12% vs last hour</div>
                </div>
                <div className="stat-card">
                    <div className="stat-header">
                        Compliant Devices
                        <MonitorCheck size={20} color="var(--success)" />
                    </div>
                    <div className="stat-value">1,180</div>
                    <div className="stat-trend">98% of active fleet</div>
                </div>
                <div className="stat-card">
                    <div className="stat-header">
                        Authentications Blocked
                        <ShieldAlert size={20} color="var(--danger)" />
                    </div>
                    <div className="stat-value">84</div>
                    <div className="stat-trend negative">↑ Spike detected at 11:00 AM</div>
                </div>
            </div>

            <div className="chart-card">
                <div className="chart-title">Authentication Traffic (Today)</div>
                <div style={{ height: 300, width: '100%' }}>
                    <ResponsiveContainer>
                        <AreaChart data={authData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorBlocked" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                            <XAxis dataKey="time" stroke="#94a3b8" />
                            <YAxis stroke="#94a3b8" />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                                itemStyle={{ color: '#f8fafc' }}
                            />
                            <Area type="monotone" dataKey="success" name="Successful Auths" stroke="#10b981" fillOpacity={1} fill="url(#colorSuccess)" />
                            <Area type="monotone" dataKey="blocked" name="Blocked/Quarantined" stroke="#ef4444" fillOpacity={1} fill="url(#colorBlocked)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
