
import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api';
import { Plus, Search, ShieldAlert, Monitor, X } from 'lucide-react';

interface Device {
    mac: string;
    owner: string;
    type: string;
    source?: string;
    risk: number;
    status: string;
    lastSeen: string;
    os?: string;
    patch?: string;
    av?: string;
    encryption?: boolean;
    firewall?: boolean;
}

export default function Devices() {
    const [devices, setDevices] = useState<Device[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingDevice, setEditingDevice] = useState<Device | null>(null);

    // Form state
    const [macAddress, setMacAddress] = useState('');
    const [deviceType, setDeviceType] = useState('Laptop');
    const [ownerName, setOwnerName] = useState('');

    useEffect(() => {
        fetchDevices();
    }, []);

    const fetchDevices = async () => {
        try {
            const res = await apiFetch('/api/v1/devices');
            if (res.ok) {
                const data = await res.json();
                setDevices(data);
            }
        } catch (error) {
            console.error("Failed to fetch devices", error);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await apiFetch('/api/v1/devices', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    mac_address: macAddress,
                    device_type: deviceType,
                    owner_name: ownerName
                }),
            });

            if (res.ok) {
                setIsModalOpen(false);
                setMacAddress('');
                setDeviceType('Laptop');
                setOwnerName('');
                fetchDevices(); // Refresh list
            } else {
                console.error("Failed to register device");
            }
        } catch (error) {
            console.error("Error registering device", error);
        }
    };

    const handleEditClick = (device: Device) => {
        setEditingDevice(device);
        setIsEditModalOpen(true);
    };

    const handleEditSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingDevice) return;

        try {
            const res = await apiFetch(`/api/v1/devices/${editingDevice.mac}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    owner_name: editingDevice.owner,
                    device_type: editingDevice.type,
                    risk_score: editingDevice.risk,
                    posture_status: editingDevice.status,
                }),
            });

            if (res.ok) {
                setIsEditModalOpen(false);
                setEditingDevice(null);
                fetchDevices(); // Refresh list
            } else {
                console.error("Failed to update device");
            }
        } catch (error) {
            console.error("Error updating device", error);
        }
    };

    const handleQuarantine = async (mac: string) => {
        if (!confirm(`Are you sure you want to quarantine device ${mac}? This will trigger NAC enforcement.`)) return;

        try {
            const res = await apiFetch(`/api/v1/devices/${mac}/quarantine`, {
                method: 'POST',
            });
            if (res.ok) {
                fetchDevices(); // Refresh list
            } else {
                console.error("Failed to quarantine device");
            }
        } catch (error) {
            console.error("Error during quarantine", error);
        }
    };

    return (
        <div>
            <div className="view-header">
                <div className="view-title">
                    <h2>Device Inventory</h2>
                    <p>Real-time posture and risk scoring for all authenticated endpoints.</p>
                </div>
                <button className="btn" onClick={() => setIsModalOpen(true)}>
                    <Plus size={18} />
                    Register Device
                </button>
            </div>

            <div className="data-table-container">
                <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-dark)', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', flex: 1 }}>
                        <Search size={16} color="var(--text-muted)" style={{ marginRight: '8px' }} />
                        <input type="text" placeholder="Search MAC or Owner..." style={{ background: 'transparent', border: 'none', color: '#fff', outline: 'none', width: '100%' }} />
                    </div>
                </div>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>MAC Address</th>
                            <th>Owner / Name</th>
                            <th>Type</th>
                            <th>Health Indicators</th>
                            <th>Risk Score</th>
                            <th>Posture Status</th>
                            <th>Last Seen</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {devices.map((d, i) => (
                            <tr key={i}>
                                <td style={{ fontFamily: 'monospace', color: 'var(--primary)' }}>{d.mac}</td>
                                <td>{d.owner}</td>

                                <td>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Monitor size={16} />
                                        {d.type}
                                    </span>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                        <span title={`AV: ${d.av}`} style={{ width: '8px', height: '8px', borderRadius: '50%', background: d.av === 'active' ? 'var(--success)' : 'var(--danger)' }}></span>
                                        <span title={`Patch: ${d.patch}`} style={{ width: '8px', height: '8px', borderRadius: '50%', background: d.patch === 'up_to_date' ? 'var(--success)' : 'var(--danger)' }}></span>
                                        <span title={`Encryption: ${d.encryption ? 'Enabled' : 'Disabled'}`} style={{ width: '8px', height: '8px', borderRadius: '50%', background: d.encryption ? 'var(--success)' : 'var(--danger)' }}></span>
                                        <span title={`Firewall: ${d.firewall ? 'On' : 'Off'}`} style={{ width: '8px', height: '8px', borderRadius: '50%', background: d.firewall ? 'var(--success)' : 'var(--danger)' }}></span>
                                    </div>
                                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{d.os || 'Unknown OS'}</span>
                                </td>
                                <td style={{ fontWeight: '600' }}>
                                    <span style={{ color: d.risk > 70 ? 'var(--danger)' : d.risk > 40 ? 'var(--warning)' : 'var(--success)' }}>
                                        {d.risk} / 100
                                    </span>
                                </td>
                                <td><span className={`badge ${d.status === 'compliant' || d.status === 'Compliant' ? 'compliant' : d.status === 'Quarantined' ? 'untrusted' : d.status === 'Untrusted' ? 'untrusted' : 'non-compliant'}`}>{d.status}</span></td>
                                <td style={{ color: 'var(--text-muted)' }}>{d.lastSeen}</td>
                                <td>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        {d.status !== 'Quarantined' ? (
                                            <button onClick={() => handleQuarantine(d.mac)} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem', borderColor: 'var(--danger)', color: 'var(--danger)' }}>
                                                <ShieldAlert size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                                                Quarantine
                                            </button>
                                        ) : (
                                            <button className="btn-secondary" disabled style={{ padding: '6px 12px', fontSize: '0.8rem', opacity: 0.5 }}>Isolated</button>
                                        )}
                                        <button onClick={() => handleEditClick(d)} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>Edit</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {devices.length === 0 && (
                            <tr>
                                <td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                                    No devices found. Register a device to get started.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Registration Modal Overlay */}
            {isModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '8px', border: '1px solid var(--border-color)', width: '400px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0 }}>Register New Device</h3>
                            <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleRegister}>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-muted)' }}>MAC Address</label>
                                <input
                                    type="text"
                                    required
                                    value={macAddress}
                                    onChange={(e) => setMacAddress(e.target.value)}
                                    placeholder="00:1A:2B:3C:4D:5E"
                                    style={{ width: '100%', padding: '10px', background: 'var(--bg-dark)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#fff' }}
                                />
                            </div>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-muted)' }}>Device Type</label>
                                <select
                                    value={deviceType}
                                    onChange={(e) => setDeviceType(e.target.value)}
                                    style={{ width: '100%', padding: '10px', background: 'var(--bg-dark)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#fff' }}
                                >
                                    <option value="Laptop">Laptop</option>
                                    <option value="Mobile">Mobile</option>
                                    <option value="Server">Server</option>
                                    <option value="IoT">IoT</option>
                                </select>
                            </div>
                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-muted)' }}>Owner Name</label>
                                <input
                                    type="text"
                                    required
                                    value={ownerName}
                                    onChange={(e) => setOwnerName(e.target.value)}
                                    placeholder="e.g. Alice Smith"
                                    style={{ width: '100%', padding: '10px', background: 'var(--bg-dark)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#fff' }}
                                />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary" style={{ padding: '8px 16px' }}>Cancel</button>
                                <button type="submit" className="btn" style={{ padding: '8px 16px' }}>Register</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Device Modal Overlay */}
            {isEditModalOpen && editingDevice && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>Edit Device Profile</h3>
                            <button className="icon-btn" onClick={() => setIsEditModalOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        <form className="modal-form" onSubmit={handleEditSave}>
                            <div className="form-group">
                                <label>MAC Address (Immutable)</label>
                                <input
                                    type="text"
                                    disabled
                                    value={editingDevice.mac}
                                    style={{ opacity: 0.6, cursor: 'not-allowed' }}
                                />
                            </div>

                            <div className="form-group">
                                <label>Device Type</label>
                                <select
                                    value={editingDevice.type}
                                    onChange={(e) => setEditingDevice({ ...editingDevice, type: e.target.value })}
                                >
                                    <option value="Laptop">Laptop</option>
                                    <option value="Mobile">Mobile</option>
                                    <option value="Server">Server</option>
                                    <option value="IoT">IoT</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Manual Risk Override</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={editingDevice.risk}
                                    onChange={(e) => setEditingDevice({ ...editingDevice, risk: parseInt(e.target.value) || 0 })}
                                />
                            </div>

                            <div className="form-group">
                                <label>Posture Status</label>
                                <select
                                    value={editingDevice.status}
                                    onChange={(e) => setEditingDevice({ ...editingDevice, status: e.target.value })}
                                >
                                    <option value="Compliant">Compliant</option>
                                    <option value="Untrusted">Untrusted</option>
                                    <option value="Non-Compliant">Non-Compliant</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Owner Name</label>
                                <input
                                    type="text"
                                    value={editingDevice.owner}
                                    onChange={(e) => setEditingDevice({ ...editingDevice, owner: e.target.value })}
                                />
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
                                <button type="submit" className="btn">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
