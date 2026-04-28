import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api';
import { Search, Shield, UserX, Edit2, X, MonitorSmartphone } from 'lucide-react';

interface User {
    id: string;
    email: string;
    full_name: string;
    department: string;
    role: string;
    status: string;
    device_count: number;
}

export default function Users() {
    const [users, setUsers] = useState<User[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    const fetchUsers = async () => {
        try {
            const res = await apiFetch('/api/v1/users');
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            }
        } catch (error) {
            console.error("Failed to fetch users", error);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleEditClick = (user: User) => {
        setEditingUser(user);
        setIsEditModalOpen(true);
    };

    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;

        try {
            const res = await apiFetch(`/api/v1/users/${editingUser.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    role: editingUser.role,
                    department: editingUser.department,
                    status: editingUser.status
                }),
            });

            if (res.ok) {
                setIsEditModalOpen(false);
                setEditingUser(null);
                fetchUsers();
            }
        } catch (error) {
            console.error("Error updating user", error);
        }
    };

    const handleSuspendUser = async (id: string) => {
        if (!confirm("Are you sure you want to suspend this user? They will lose all network access.")) return;

        try {
            const res = await apiFetch(`/api/v1/users/${id}`, { method: 'DELETE' });
            if (res.ok) fetchUsers();
        } catch (error) {
            console.error("Error suspending user", error);
        }
    };

    const filteredUsers = users.filter(u =>
        u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div>
            <div className="view-header">
                <div className="view-title">
                    <h2>User Directory</h2>
                    <p>Manage corporate identities, RBAC roles, and device ownership.</p>
                </div>
            </div>

            <div className="data-table-container">
                <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-dark)', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', flex: 1 }}>
                        <Search size={16} color="var(--text-muted)" style={{ marginRight: '8px' }} />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ background: 'transparent', border: 'none', color: '#fff', outline: 'none', width: '100%' }}
                        />
                    </div>
                </div>

                <table className="data-table">
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Department</th>
                            <th>Role</th>
                            <th>Status</th>
                            <th>Devices</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map((u) => (
                            <tr key={u.id}>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div className="avatar">{u.full_name[0]}</div>
                                        <div>
                                            <div style={{ fontWeight: '600' }}>{u.full_name}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{u.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td style={{ color: 'var(--text-muted)' }}>{u.department}</td>
                                <td>
                                    <span style={{
                                        display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '4px', background: 'rgba(6, 182, 212, 0.1)', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: '600'
                                    }}>
                                        <Shield size={12} />
                                        {u.role}
                                    </span>
                                </td>
                                <td>
                                    <span className={`badge ${u.status === 'Active' ? 'compliant' : 'untrusted'}`}>
                                        {u.status}
                                    </span>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
                                        <MonitorSmartphone size={14} />
                                        {u.device_count} Endpoints
                                    </div>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button onClick={() => handleEditClick(u)} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                                            <Edit2 size={14} style={{ marginRight: '4px' }} />
                                            Edit
                                        </button>
                                        <button onClick={() => handleSuspendUser(u.id)} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem', color: 'var(--danger)' }}>
                                            <UserX size={14} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isEditModalOpen && editingUser && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>Edit User Permissions</h3>
                            <button className="icon-btn" onClick={() => setIsEditModalOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleUpdateUser} className="modal-form">
                            <div style={{ marginBottom: '20px', padding: '12px', background: 'var(--bg-dark)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                <div style={{ fontWeight: '600', marginBottom: '4px' }}>{editingUser.full_name}</div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{editingUser.email}</div>
                            </div>

                            <div className="form-group">
                                <label>RBAC Role</label>
                                <select
                                    value={editingUser.role}
                                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                                >
                                    <option value="Standard">Standard User</option>
                                    <option value="Dev">Developer</option>
                                    <option value="SecOps">Security Ops</option>
                                    <option value="Admin">Administrator</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Department</label>
                                <input
                                    type="text"
                                    value={editingUser.department}
                                    onChange={(e) => setEditingUser({ ...editingUser, department: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label>Network Status</label>
                                <select
                                    value={editingUser.status}
                                    onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value })}
                                >
                                    <option value="Active">Active (Network Access Allowed)</option>
                                    <option value="Suspended">Suspended (Blocked at NAC Layer)</option>
                                </select>
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
                                <button type="submit" className="btn">Update Identity</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
