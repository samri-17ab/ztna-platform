import React, { useState, useEffect } from 'react';
import { Shield, Plus, X } from 'lucide-react';
import { apiFetch } from '../api';

interface Policy {
    id: string;
    name: string;
    description: string;
    condition: string;
    action: string;
    is_active: boolean;
    priority: number;
}

export default function Policies() {
    const [policies, setPolicies] = useState<Policy[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null);

    // Form state
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [condition, setCondition] = useState('');
    const [action, setAction] = useState('ALLOW');
    const [priority, setPriority] = useState(100);

    const fetchPolicies = async () => {
        try {
            const res = await apiFetch('/api/v1/policies');
            if (res.ok) {
                const data = await res.json();
                setPolicies(data);
            }
        } catch (error) {
            console.error("Failed to fetch policies", error);
        }
    };

    useEffect(() => {
        fetchPolicies();
    }, []);

    const handleCreateRule = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await apiFetch('/api/v1/policies', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name,
                    description,
                    condition,
                    action,
                    priority: Number(priority)
                }),
            });

            if (res.ok) {
                setIsModalOpen(false);
                // Reset form
                setName('');
                setDescription('');
                setCondition('');
                setAction('ALLOW');
                setPriority(100);
                // Refresh list
                fetchPolicies();
            }
        } catch (error) {
            console.error("Error creating policy", error);
        }
    };

    const handleEditClick = (policy: Policy) => {
        setEditingPolicy(policy);
        setIsEditModalOpen(true);
    };

    const handleEditSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingPolicy) return;

        try {
            const res = await apiFetch(`/api/v1/policies/${editingPolicy.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: editingPolicy.name,
                    description: editingPolicy.description,
                    condition: editingPolicy.condition,
                    action: editingPolicy.action,
                    priority: Number(editingPolicy.priority),
                    is_active: editingPolicy.is_active
                }),
            });

            if (res.ok) {
                setIsEditModalOpen(false);
                setEditingPolicy(null);
                fetchPolicies(); // Refresh list
            }
        } catch (error) {
            console.error("Error updating policy", error);
        }
    };

    return (
        <div>
            <div className="view-header">
                <div className="view-title">
                    <h2>Access Policies</h2>
                    <p>Manage Zero Trust Contextual Rules (Synched with Open Policy Agent).</p>
                </div>
                <button className="btn" onClick={() => setIsModalOpen(true)}>
                    <Plus size={18} />
                    Create Rule
                </button>
            </div>

            <div className="data-table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Priority (Order)</th>
                            <th>Policy Name</th>
                            <th>Evaluation Condition (Rego Format)</th>
                            <th>Enforcement Action</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {policies.map((p) => (
                            <tr key={p.id}>
                                <td style={{ color: 'var(--text-muted)' }}>#{p.priority}</td>
                                <td>
                                    <div style={{ fontWeight: '600' }}>{p.name}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.description}</div>
                                </td>
                                <td>
                                    <code style={{ background: 'rgba(0,0,0,0.2)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', color: 'var(--accent)' }}>
                                        {p.condition}
                                    </code>
                                </td>
                                <td>
                                    <span style={{
                                        display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: '600',
                                        color: p.action.includes('ALLOW') ? 'var(--success)' : p.action.includes('DENY') ? 'var(--text-muted)' : 'var(--warning)'
                                    }}>
                                        <Shield size={14} />
                                        {p.action}
                                    </span>
                                </td>
                                <td>
                                    <span className={`badge ${p.is_active ? 'compliant' : 'untrusted'}`}>
                                        {p.is_active ? 'Active' : 'Disabled'}
                                    </span>
                                </td>
                                <td>
                                    <button onClick={() => handleEditClick(p)} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>Edit Rule</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>Create Access Rule</h3>
                            <button className="icon-btn" onClick={() => setIsModalOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateRule} className="modal-form">
                            <div className="form-group">
                                <label>Rule Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. Engineering VLAN 10"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <input
                                    type="text"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Optional description"
                                />
                            </div>
                            <div className="form-group">
                                <label>Evaluation Condition</label>
                                <input
                                    type="text"
                                    value={condition}
                                    onChange={(e) => setCondition(e.target.value)}
                                    placeholder="e.g. user.role == 'Dev' && device.risk < 50"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Enforcement Action</label>
                                <select
                                    value={action}
                                    onChange={(e) => setAction(e.target.value)}
                                >
                                    <option value="ALLOW">ALLOW (General)</option>
                                    <option value="ALLOW_VLAN_10">ALLOW_VLAN_10 (Engineering)</option>
                                    <option value="ALLOW_VLAN_50">ALLOW_VLAN_50 (Guest)</option>
                                    <option value="RESTRICT_VLAN_99">RESTRICT_VLAN_99 (Quarantine)</option>
                                    <option value="DENY">DENY</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Priority (Lower executes first)</label>
                                <input
                                    type="number"
                                    value={priority}
                                    onChange={(e) => setPriority(Number(e.target.value))}
                                    required
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                                <button type="submit" className="btn">Save Rule</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Policy Modal Overlay */}
            {isEditModalOpen && editingPolicy && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>Edit Access Rule</h3>
                            <button className="icon-btn" onClick={() => setIsEditModalOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleEditSave} className="modal-form">
                            <div className="form-group">
                                <label>Rule Name</label>
                                <input
                                    type="text"
                                    value={editingPolicy.name}
                                    onChange={(e) => setEditingPolicy({ ...editingPolicy, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <input
                                    type="text"
                                    value={editingPolicy.description}
                                    onChange={(e) => setEditingPolicy({ ...editingPolicy, description: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Evaluation Condition</label>
                                <input
                                    type="text"
                                    value={editingPolicy.condition}
                                    onChange={(e) => setEditingPolicy({ ...editingPolicy, condition: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Enforcement Action</label>
                                <select
                                    value={editingPolicy.action}
                                    onChange={(e) => setEditingPolicy({ ...editingPolicy, action: e.target.value })}
                                >
                                    <option value="ALLOW">ALLOW (General)</option>
                                    <option value="ALLOW_VLAN_10">ALLOW_VLAN_10 (Engineering)</option>
                                    <option value="ALLOW_VLAN_50">ALLOW_VLAN_50 (Guest)</option>
                                    <option value="RESTRICT_VLAN_99">RESTRICT_VLAN_99 (Quarantine)</option>
                                    <option value="DENY">DENY</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Priority (Lower executes first)</label>
                                <input
                                    type="number"
                                    value={editingPolicy.priority}
                                    onChange={(e) => setEditingPolicy({ ...editingPolicy, priority: Number(e.target.value) })}
                                    required
                                />
                            </div>
                            <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    checked={editingPolicy.is_active}
                                    onChange={(e) => setEditingPolicy({ ...editingPolicy, is_active: e.target.checked })}
                                    style={{ width: '16px', height: '16px' }}
                                />
                                <label htmlFor="isActive" style={{ margin: 0 }}>Policy is Active</label>
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
