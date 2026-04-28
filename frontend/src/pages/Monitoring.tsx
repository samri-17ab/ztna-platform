import { useState, useEffect } from 'react';
import { Activity, ShieldCheck, ShieldAlert, Cpu } from 'lucide-react';

interface LogEvent {
    id: number;
    timestamp: string;
    sourceIp: string;
    sourceUser: string;
    deviceType: string;
    targetResource: string;
    action: string;
    ruleMatched: string;
}

export default function Monitoring() {
    const [logs, setLogs] = useState<LogEvent[]>([]);

    useEffect(() => {
        // Since we don't have a real WebSocket/Log streaming backend yet, we'll
        // simulate live logs being "streamed" in to show a dynamic UI.
        const mockLogStream = [
            { id: 101, sourceIp: "192.168.1.45", sourceUser: "jsmith", deviceType: "Laptop", targetResource: "app.internal.corp:443", action: "ALLOW", ruleMatched: "Default Deny -> Overridden by Dev Access" },
            { id: 102, sourceIp: "10.0.5.12", sourceUser: "UNKNOWN", deviceType: "IoT Camera", targetResource: "10.0.1.50:22", action: "DENY", ruleMatched: "Default Deny (Base)" },
            { id: 103, sourceIp: "192.168.1.189", sourceUser: "asmith", deviceType: "Mobile", targetResource: "portal.internal.corp:80", action: "ALLOW", ruleMatched: "Mobile Access" },
        ];

        // Start with some history
        let idCounter = 104;
        setLogs(mockLogStream.map(l => ({
            ...l,
            timestamp: new Date(Date.now() - Math.random() * 60000).toLocaleTimeString()
        })));

        // Inject new events periodically
        const interval = setInterval(() => {
            const isDeny = Math.random() > 0.7;
            const newLog: LogEvent = {
                id: idCounter++,
                timestamp: new Date().toLocaleTimeString(),
                sourceIp: `192.168.1.${Math.floor(Math.random() * 254)}`,
                sourceUser: isDeny ? "UNKNOWN" : ["jsmith", "asmith", "bwayne"][Math.floor(Math.random() * 3)],
                deviceType: ["Laptop", "Mobile", "Desktop", "IoT"][Math.floor(Math.random() * 4)],
                targetResource: ["app.internal.corp", "db.internal.corp:5432", "10.0.1.50:22"][Math.floor(Math.random() * 3)],
                action: isDeny ? "DENY" : "ALLOW",
                ruleMatched: isDeny ? "Default Deny (Base)" : "Access Granted (Evaluated OPA)",
            };

            setLogs(prev => [newLog, ...prev].slice(0, 50)); // Keep last 50 logs
        }, 3500);

        return () => clearInterval(interval);
    }, []);

    return (
        <div>
            <div className="view-header">
                <div className="view-title">
                    <h2>Live Traffic & Access Logs</h2>
                    <p>Real-time stream of Zero Trust policy evaluations and network requests.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'rgba(6, 182, 212, 0.1)', border: '1px solid var(--primary)', borderRadius: '20px', color: 'var(--primary)', fontWeight: '600', fontSize: '0.85rem' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)', boxShadow: '0 0 8px var(--primary)' }}></div>
                        Receiving Events
                    </div>
                </div>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-header">
                        Events Per Minute
                        <Activity size={20} color="var(--primary)" />
                    </div>
                    <div className="stat-value">342</div>
                    <div className="stat-trend positive">↑ 12% vs last hour</div>
                </div>
                <div className="stat-card">
                    <div className="stat-header">
                        Allowed Requests
                        <ShieldCheck size={20} color="var(--success)" />
                    </div>
                    <div className="stat-value">289</div>
                    <div className="stat-trend">84.5% of total</div>
                </div>
                <div className="stat-card">
                    <div className="stat-header">
                        Blocked Threats
                        <ShieldAlert size={20} color="var(--warning)" />
                    </div>
                    <div className="stat-value">53</div>
                    <div className="stat-trend negative">↑ Spike detected</div>
                </div>
            </div>

            <div className="data-table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Timestamp</th>
                            <th>Identity / Source</th>
                            <th>Target Resource</th>
                            <th>Context (Device)</th>
                            <th>Action Taken</th>
                            <th>Rule Matched</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.map(log => (
                            <tr key={log.id} className="log-row">
                                <td className="log-time">{log.timestamp}</td>
                                <td>
                                    <div style={{ fontWeight: 600 }}>{log.sourceUser}</div>
                                    <div className="log-source" style={{ fontSize: '0.8rem' }}>{log.sourceIp}</div>
                                </td>
                                <td className="log-target">{log.targetResource}</td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Cpu size={14} color="var(--text-muted)" />
                                        {log.deviceType}
                                    </div>
                                </td>
                                <td>
                                    <span style={{ color: log.action === 'ALLOW' ? 'var(--success)' : 'var(--danger)', fontWeight: 700 }}>
                                        {log.action}
                                    </span>
                                </td>
                                <td style={{ color: 'var(--text-muted)' }}>{log.ruleMatched}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
