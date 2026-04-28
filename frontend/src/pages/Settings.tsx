import { Save, Server, Key, RefreshCw } from 'lucide-react';

export default function Settings() {
    return (
        <div>
            <div className="view-header">
                <div className="view-title">
                    <h2>Platform Settings</h2>
                    <p>Configure SpecterNAC system preferences and integrations.</p>
                </div>
                <button className="btn">
                    <Save size={18} />
                    Save Changes
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '32px' }}>
                {/* Main Settings Panel */}
                <div>
                    <div className="settings-section">
                        <h3>Identity Provider (IdP) Integration</h3>
                        <p>Configure SSO and directory syncing for user context gathering.</p>

                        <div className="setting-row">
                            <div className="setting-info">
                                <h4>Active Directory / LDAP Server</h4>
                                <p>Used for primary attribute syncing</p>
                            </div>
                            <button className="btn-secondary" style={{ padding: '6px 16px' }}>Edit Connection</button>
                        </div>
                        <div className="setting-row">
                            <div className="setting-info">
                                <h4>Okta / SAML Configuration</h4>
                                <p>Authentication portal integration</p>
                            </div>
                            <span className="badge compliant">Connected</span>
                        </div>
                    </div>

                    <div className="settings-section">
                        <h3>Open Policy Agent (OPA) Orchestration</h3>
                        <p>Configure how Access Rules are compiled and distributed to Enforcement Nodes.</p>

                        <div className="setting-row">
                            <div className="setting-info">
                                <h4>Compilation Interval</h4>
                                <p>How frequently Rego policies are pushed to the Redis stream</p>
                            </div>
                            <select style={{ padding: '8px 12px', background: 'var(--bg-dark)', color: '#fff', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                                <option>Every 1 minute</option>
                                <option>Every 5 minutes</option>
                                <option>Instantly</option>
                            </select>
                        </div>

                        <div className="setting-row">
                            <div className="setting-info">
                                <h4>Strict Policy Mode</h4>
                                <p>Fails completely closed on evaluation errors</p>
                            </div>
                            <div style={{ width: '40px', height: '22px', background: 'var(--primary)', borderRadius: '11px', position: 'relative', cursor: 'pointer' }}>
                                <div style={{ position: 'absolute', right: '2px', top: '2px', width: '18px', height: '18px', background: '#fff', borderRadius: '50%' }}></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* API Keys Sidebar */}
                <div>
                    <div className="settings-section">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                            <Key size={20} color="var(--primary)" />
                            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>API Keys</h3>
                        </div>
                        <p style={{ fontSize: '0.85rem' }}>Keys required for headless device enrollment.</p>

                        <div style={{ background: 'var(--bg-dark)', padding: '12px', borderRadius: '6px', border: '1px dashed var(--border-color)', marginBottom: '16px' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>Production Master Key</div>
                            <div style={{ fontFamily: 'monospace', color: 'var(--accent)', fontSize: '0.85rem', wordBreak: 'break-all' }}>
                                sp_prod_89f2a24bc9100...
                            </div>
                        </div>

                        <button className="btn-secondary" style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '8px', fontSize: '0.85rem' }}>
                            <RefreshCw size={14} />
                            Rotate Keys
                        </button>
                    </div>

                    <div className="settings-section">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                            <Server size={20} color="var(--primary)" />
                            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>System Status</h3>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.85rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Database</span>
                                <span style={{ color: 'var(--success)', fontWeight: 600 }}>Healthy</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Redis Stream</span>
                                <span style={{ color: 'var(--success)', fontWeight: 600 }}>Healthy</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Workers</span>
                                <span style={{ color: 'var(--success)', fontWeight: 600 }}>4/4 Online</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
