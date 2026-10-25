import React from 'react';
import {
  Box,
  Layers,
  Network,
  Stethoscope,
  Terminal,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  PlayCircle,
  HelpCircle,
} from 'lucide-react';
import { DockerStatus } from '../../types';
import { StatCard } from '../../components/common/StatCard';
import { NavView } from '../../components/layout/Sidebar';

interface OverviewViewProps {
  dockerStatus: DockerStatus | null;
  isDemoMode: boolean;
  onNavigate: (view: NavView) => void;
  onToggleDemoMode: () => void;
  onRefresh: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  dockerStatus,
  isDemoMode,
  onNavigate,
  onToggleDemoMode,
  onRefresh,
}) => {
  const isConnected = dockerStatus?.connected || false;

  return (
    <div className="content-area">
      <div className="view-header">
        <div className="view-title-group">
          <h1>
            <span>Overview & System Status</span>
            {isDemoMode && <span className="badge badge-demo">Simulated Sandbox</span>}
          </h1>
          <div className="view-description">
            Real-time observability of Docker runtime, container states, and workload topology.
          </div>
        </div>
      </div>

      {/* Disconnected / Troubleshooting Banner */}
      {!isConnected && !isDemoMode && (
        <div
          style={{
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--color-warning)',
            borderRadius: 'var(--radius-md)',
            padding: '18px 20px',
            marginBottom: '24px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
            <AlertTriangle size={24} color="var(--color-warning)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Docker Engine is Disconnected or Not Running
              </div>
              <div style={{ color: 'var(--text-secondary)', margin: '6px 0 12px 0', fontSize: '12px' }}>
                {dockerStatus?.error_message ||
                  'DockSight could not establish a connection to the Docker daemon via standard Windows named pipe or local socket.'}
              </div>

              <div
                style={{
                  backgroundColor: 'var(--bg-main)',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  marginBottom: '14px',
                }}
              >
                <div style={{ fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                  Troubleshooting Checklist
                </div>
                <ul style={{ paddingLeft: '16px', marginTop: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  <li>Start Docker Desktop from the Start menu or system tray.</li>
                  <li>Check Docker daemon status in PowerShell with: <code className="mono" style={{ color: 'var(--docker-blue)' }}>docker info</code>.</li>
                  <li>Ensure your Windows user is a member of the <code className="mono">docker-users</code> group.</li>
                  <li>If using WSL 2, verify integration is enabled in Docker Desktop settings.</li>
                </ul>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={onRefresh} className="btn btn-primary btn-sm">
                  Retry Connection
                </button>
                <button
                  onClick={onToggleDemoMode}
                  className="btn btn-sm"
                  style={{ borderColor: 'var(--accent-lime)', color: 'var(--accent-lime)' }}
                >
                  <PlayCircle size={13} />
                  <span>Explore Demo Sandbox (No Docker Required)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Connected / Demo Status Banner */}
      {(isConnected || isDemoMode) && (
        <div
          style={{
            backgroundColor: 'var(--bg-secondary)',
            border: `1px solid ${isDemoMode ? 'var(--border-color)' : 'var(--border-color)'}`,
            borderRadius: 'var(--radius-md)',
            padding: '14px 18px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <CheckCircle2 size={18} color={isDemoMode ? 'var(--accent-lime)' : 'var(--color-success)'} />
            <div>
              <span style={{ fontWeight: 600 }}>
                {isDemoMode ? 'Sandbox Mode Active' : `Engine Active: ${dockerStatus?.version || 'Docker Desktop'}`}
              </span>
              <span style={{ color: 'var(--text-secondary)', marginLeft: '8px', fontSize: '12px' }}>
                {isDemoMode
                  ? 'All metrics and resources below are simulated sample data.'
                  : `OS: ${dockerStatus?.os || 'Linux'} • Arch: ${dockerStatus?.arch || 'x86_64'} • API: ${dockerStatus?.api_version || '1.45'}`}
              </span>
            </div>
          </div>
          {isDemoMode ? (
            <button onClick={onToggleDemoMode} className="btn btn-sm">
              Connect to Live Engine
            </button>
          ) : (
            <div className="badge badge-running">Live Daemon</div>
          )}
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="stats-grid">
        <StatCard
          label="Running Containers"
          value={isConnected || isDemoMode ? (dockerStatus?.containers_running ?? 0) : '—'}
          icon={<Box size={20} color="var(--color-success)" />}
          hint={isConnected || isDemoMode ? 'Active workloads' : 'Unavailable offline'}
          onClick={() => onNavigate('containers')}
        />
        <StatCard
          label="Stopped Containers"
          value={isConnected || isDemoMode ? (dockerStatus?.containers_stopped ?? 0) : '—'}
          icon={<Box size={20} color="var(--text-muted)" />}
          hint={isConnected || isDemoMode ? 'Exited or created' : 'Unavailable offline'}
          onClick={() => onNavigate('containers')}
        />
        <StatCard
          label="Docker Images"
          value={isConnected || isDemoMode ? (dockerStatus?.images_count ?? 0) : '—'}
          icon={<Layers size={20} color="var(--docker-blue)" />}
          hint={isConnected || isDemoMode ? 'Locally cached images' : 'Unavailable offline'}
          onClick={() => onNavigate('images')}
        />
        <StatCard
          label="Compose Visualizer"
          value="Ready"
          icon={<Network size={20} color="var(--accent-lime)" />}
          hint="Offline static analysis"
          onClick={() => onNavigate('compose')}
        />
      </div>

      {/* Quick Launchpad */}
      <div style={{ marginTop: '16px' }}>
        <div style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '10px' }}>
          Workstation Tools
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
          <div
            className="stat-card"
            style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}
            onClick={() => onNavigate('compose')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="stat-icon-wrap">
                <Network size={18} color="var(--accent-lime)" />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '14px' }}>ComposeCraft Visualizer</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  Interactive dependency graph & validation
                </div>
              </div>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '10px', lineHeight: 1.4 }}>
              Paste or upload Docker Compose YAML to map service hierarchies, detect broken depends_on references, and inspect ports.
            </p>
          </div>

          <div
            className="stat-card"
            style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}
            onClick={() => onNavigate('diagnostics')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="stat-icon-wrap">
                <Stethoscope size={18} color="var(--color-warning)" />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '14px' }}>DockSight Doctor</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  18-rule static configuration scanner
                </div>
              </div>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '10px', lineHeight: 1.4 }}>
              Automated linting for hardcoded secrets, port collisions, unpinned tags, and dangerous host root mounts.
            </p>
          </div>

          <div
            className="stat-card"
            style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}
            onClick={() => onNavigate('logs')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="stat-icon-wrap">
                <Terminal size={18} color="var(--docker-blue)" />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '14px' }}>Live Log Streamer</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  Searchable container log viewer
                </div>
              </div>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '10px', lineHeight: 1.4 }}>
              Stream stdout and stderr with timestamp parsing, custom tail limits, and real-time auto-refresh.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
