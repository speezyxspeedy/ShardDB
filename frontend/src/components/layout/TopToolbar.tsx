import React from 'react';
import { RefreshCw, Radio, Sparkles } from 'lucide-react';
import { DockerStatus } from '../../types';

interface TopToolbarProps {
  dockerStatus: DockerStatus | null;
  isDemoMode: boolean;
  onToggleDemoMode: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  lastRefreshed: string;
}

export const TopToolbar: React.FC<TopToolbarProps> = ({
  dockerStatus,
  isDemoMode,
  onToggleDemoMode,
  onRefresh,
  isRefreshing,
  lastRefreshed,
}) => {
  const getStatusBadge = () => {
    if (isDemoMode) {
      return (
        <div className="status-pill" style={{ borderColor: 'var(--accent-lime)' }}>
          <span className="status-dot demo"></span>
          <span style={{ color: 'var(--accent-lime)' }}>Demo Sandbox (Offline Data)</span>
        </div>
      );
    }

    if (dockerStatus?.connected) {
      return (
        <div className="status-pill" style={{ borderColor: 'var(--color-success)' }}>
          <span className="status-dot connected"></span>
          <span style={{ color: 'var(--color-success)' }}>
            Docker Engine {dockerStatus.version || 'Connected'}
          </span>
        </div>
      );
    }

    return (
      <div className="status-pill" style={{ borderColor: 'var(--color-warning)' }}>
        <span className="status-dot disconnected"></span>
        <span style={{ color: 'var(--color-warning)' }}>Docker Daemon Disconnected</span>
      </div>
    );
  };

  return (
    <header className="top-toolbar">
      <div className="toolbar-left">
        {getStatusBadge()}
        {isDemoMode && (
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Simulated environment for exploration
          </span>
        )}
      </div>

      <div className="toolbar-right">
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          Updated {lastRefreshed || 'Just now'}
        </span>

        <button
          onClick={onRefresh}
          className="btn btn-sm"
          disabled={isRefreshing}
          title="Refresh current state from Docker API"
          id="btn-refresh"
        >
          <RefreshCw size={13} className={isRefreshing ? 'spin-icon' : ''} style={{
            animation: isRefreshing ? 'spin 1s linear infinite' : 'none'
          }} />
          <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
        </button>

        <style>{`
          @keyframes spin {
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </header>
  );
};
