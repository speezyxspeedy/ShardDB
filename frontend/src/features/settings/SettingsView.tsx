import React from 'react';
import {
  ShieldCheck,
  HardDrive,
  Terminal,
  Cpu,
  Key,
  Server,
  Info,
} from 'lucide-react';
import { DockerStatus } from '../../types';

interface SettingsViewProps {
  dockerStatus: DockerStatus | null;
  isDemoMode: boolean;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ dockerStatus, isDemoMode }) => {
  return (
    <div className="content-area">
      <div className="view-header">
        <div className="view-title-group">
          <h1>Settings & Workstation Architecture</h1>
          <div className="view-description">
            Host integration parameters, security safeguards, and connection configurations.
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '840px' }}>
        {/* Docker Engine Connection Diagnostics */}
        <div
          style={{
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <Server size={18} color="var(--docker-blue)" />
            <span style={{ fontWeight: 600, fontSize: '14px' }}>Docker Engine Endpoint Configuration</span>
          </div>

          <div className="key-value-list">
            <div className="key-value-row">
              <span className="kv-key">Platform Architecture</span>
              <span className="kv-val">Windows 11 / x86_64</span>
            </div>
            <div className="key-value-row">
              <span className="kv-key">Engine Transport Protocol</span>
              <span className="kv-val">Windows Named Pipe (npipe:////./pipe/docker_engine)</span>
            </div>
            <div className="key-value-row">
              <span className="kv-key">Fallback Unix Socket</span>
              <span className="kv-val">unix:///var/run/docker.sock</span>
            </div>
            <div className="key-value-row">
              <span className="kv-key">Daemon Status</span>
              <span className="kv-val" style={{ color: dockerStatus?.connected ? 'var(--color-success)' : 'var(--color-warning)' }}>
                {dockerStatus?.connected ? 'Connected' : isDemoMode ? 'Offline Sandbox Mode' : 'Disconnected'}
              </span>
            </div>
            <div className="key-value-row">
              <span className="kv-key">Backend Server Binding</span>
              <span className="kv-val">127.0.0.1:8000 (Localhost only)</span>
            </div>
          </div>
        </div>

        {/* Security Model & Safeguards */}
        <div
          style={{
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <ShieldCheck size={18} color="var(--color-success)" />
            <span style={{ fontWeight: 600, fontSize: '14px' }}>DevOps Security Safeguards</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px', color: 'var(--text-secondary)' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Key size={16} color="var(--accent-lime)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ color: 'var(--text-primary)' }}>Automatic Secret Redaction: </strong>
                All environment variables matching known credential patterns (tokens, keys, passwords, connection strings) are masked in responses before reaching the browser.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <HardDrive size={16} color="var(--docker-blue)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ color: 'var(--text-primary)' }}>No Arbitrary Shell Execution: </strong>
                DockSight does not provide arbitrary command execution or raw container exec capabilities, preserving container isolation.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <Terminal size={16} color="var(--color-warning)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ color: 'var(--text-primary)' }}>Action Confirmation Guard: </strong>
                Container stop and restart actions require explicit user confirmation to prevent accidental production workload disruption.
              </div>
            </div>
          </div>
        </div>

        {/* Windows 11 Troubleshooting Quick Guide */}
        <div
          style={{
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <Info size={18} color="var(--docker-blue)" />
            <span style={{ fontWeight: 600, fontSize: '14px' }}>Windows 11 Troubleshooting Guide</span>
          </div>

          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            <p style={{ marginBottom: '8px' }}>
              If Docker Desktop fails to connect on Windows 11:
            </p>
            <ol style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <li>
                Open <strong>Docker Desktop Settings &gt; Advanced</strong> and verify that the default Docker socket / named pipe is enabled.
              </li>
              <li>
                Run PowerShell as Administrator and check:
                <div style={{ marginTop: '4px' }}>
                  <code className="mono" style={{ backgroundColor: 'var(--bg-main)', padding: '2px 6px', borderRadius: '4px', color: 'var(--docker-blue)' }}>
                    Test-Path //./pipe/docker_engine
                  </code>
                </div>
              </li>
              <li>
                Ensure your user account is in the <code>docker-users</code> group:
                <div style={{ marginTop: '4px' }}>
                  <code className="mono" style={{ backgroundColor: 'var(--bg-main)', padding: '2px 6px', borderRadius: '4px', color: 'var(--docker-blue)' }}>
                    net localgroup docker-users
                  </code>
                </div>
              </li>
              <li>
                If you do not have Docker installed, toggle <strong>Offline Demo Sandbox</strong> mode to explore all features safely.
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};
