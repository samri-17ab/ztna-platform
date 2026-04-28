import { useState, useEffect } from 'react';
import { ScrollText, Search, ShieldAlert, Shield } from 'lucide-react';
import { apiFetch } from '../api';

interface AuditLog {
    id: string;
    event_type: string;
    mac_address: string;
    user_id: string | null;
    switch_ip: string;
    risk_score: number;
    action_taken: string;
    reason: string;
    created_at: string;
}

export default function Logs() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchLogs();
        const interval = setInterval(fetchLogs, 10000); // Polling every 10s
        return () => clearInterval(interval);
    }, []);

    const fetchLogs = async () => {
        try {
            const res = await apiFetch('/api/v1/monitoring/logs');
            if (res.ok) {
                const data = await res.json();
                setLogs(data);
            }
        } catch (error) {
            console.error("Failed to fetch logs", error);
        }
    };

    const getEventIcon = (type: string) => {
        switch (type) {
            case 'access_decision': return <Shield size={16} color="var(--primary)" />;
            case 'quarantine': return <ShieldAlert size={16} color="var(--danger)" />;
            default: return <ScrollText size={16} />;
        }
    };

    const getStatusBadge = (action: string) => {
        if (action.startsWith('ALLOW')) return <span className="badge compliant">Permitted</span>;
        if (action.startsWith('DENY') || action.startsWith('RESTRICT')) return <span className="badge non-compliant">Blocked/Restricted</span>;
        return <span className="badge untrusted">{action}</span>;
    };

    const filteredLogs = logs.filter(l =>
        l.mac_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.action_taken.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div>
            <div className="view-header">
                <div className="view-title">
                    <h2>Audit Trail</h2>
                    <p>Live history of all access decisions and policy enforcement events.</p>
                </div>
                <button className="btn-secondary" onClick={fetchLogs}>
                    Refresh Logs
                </button>
            </div>

            <div className="data-table-container">
                <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-dark)', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', flex: 1 }}>
                        <Search size={16} color="var(--text-muted)" style={{ marginRight: '8px' }} />
                        <input
                            type="text"
                            placeholder="Search MAC, Reason or Action..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ background: 'transparent', border: 'none', color: '#fff', outline: 'none', width: '100%' }}
                        />
                    </div>
                </div>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Timestamp</th>
                            <th>Event Type</th>
                            <th>MAC Address</th>
                            <th>Source IP</th>
                            <th>Risk</th>
                            <th>Action</th>
                            <th>Reason / Policy</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredLogs.map((log) => (
                            <tr key={log.id}>
                                <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                    {new Date(log.created_at).toLocaleString()}
                                </td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {getEventIcon(log.event_type)}
                                        <span style={{ textTransform: 'capitalize' }}>{log.event_type.replace('_', ' ')}</span>
                                    </div>
                                </td>
                                <td style={{ fontFamily: 'monospace', color: 'var(--primary)' }}>{log.mac_address}</td>
                                <td>{log.switch_ip || 'N/A'}</td>
                                <td style={{ fontWeight: '600' }}>
                                    <span style={{ color: log.risk_score > 70 ? 'var(--danger)' : log.risk_score > 40 ? 'var(--warning)' : 'var(--success)' }}>
                                        {log.risk_score}
                                    </span>
                                </td>
                                <td>{getStatusBadge(log.action_taken)}</td>
                                <td style={{ fontSize: '0.9rem' }}>{log.reason}</td>
                            </tr>
                        ))}
                        {filteredLogs.length === 0 && (
                            <tr>
                                <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                                    No audit logs found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
