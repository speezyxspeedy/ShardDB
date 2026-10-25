import React from 'react';
import {
  LayoutDashboard,
  Box,
  Layers,
  Network,
  Stethoscope,
  Terminal,
  Settings as SettingsIcon,
  HardDrive,
  Database,
} from 'lucide-react';

export type NavView = 'overview' | 'containers' | 'images' | 'compose' | 'diagnostics' | 'logs' | 'settings';

interface SidebarProps {
  currentView: NavView;
  onNavigate: (view: NavView) => void;
  isDemoMode: boolean;
  onToggleDemoMode: () => void;
  dockerConnected: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  isDemoMode,
  onToggleDemoMode,
  dockerConnected,
}) => {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={17} /> },
    { id: 'containers', label: 'Containers', icon: <Box size={17} /> },
    { id: 'images', label: 'Images', icon: <Layers size={17} /> },
    { id: 'compose', label: 'Compose Projects', icon: <Network size={17} /> },
    { id: 'diagnostics', label: 'Diagnostics', icon: <Stethoscope size={17} /> },
    { id: 'logs', label: 'Logs', icon: <Terminal size={17} /> },
    { id: 'settings', label: 'Settings', icon: <SettingsIcon size={17} /> },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo-badge">
          <HardDrive size={18} color="#FFFFFF" />
        </div>
        <div>
          <div className="logo-text">DockSight</div>
          <div className="logo-sub">DevOps Workstation</div>
        </div>
      </div>

      <nav style={{ flex: 1, overflowY: 'auto' }}>
        <ul className="nav-links">
          {navItems.map((item) => (
            <li
              key={item.id}
              className={`nav-item ${currentView === item.id ? 'active' : ''}`}
              onClick={() => onNavigate(item.id as NavView)}
              id={`nav-${item.id}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </li>
          ))}
        </ul>
      </nav>

      <div className="sidebar-footer">
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div
            style={{
              fontSize: '10px',
              textTransform: 'uppercase',
              letterSpacing: '0.6px',
              color: 'var(--text-muted)',
              fontWeight: 600,
            }}
          >
            Environment Mode
          </div>
          <button
            onClick={onToggleDemoMode}
            className={`btn btn-sm ${isDemoMode ? '' : 'btn-primary'}`}
            style={{
              justifyContent: 'flex-start',
              width: '100%',
              backgroundColor: isDemoMode ? 'var(--bg-elevated)' : 'var(--docker-blue-subtle)',
              borderColor: isDemoMode ? 'var(--border-color)' : 'var(--docker-blue)',
              color: isDemoMode ? 'var(--accent-lime)' : 'var(--docker-blue)',
            }}
            id="toggle-env-mode"
          >
            <Database size={13} />
            <span>{isDemoMode ? 'Switch to Live Engine' : 'Explore Demo Sandbox'}</span>
          </button>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
            v1.0.0 • Localhost only
          </div>
        </div>
      </div>
    </aside>
  );
};
