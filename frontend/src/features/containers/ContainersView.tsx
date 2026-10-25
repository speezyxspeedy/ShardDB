import React, { useState } from 'react';
import {
  Search,
  Play,
  Square,
  RotateCw,
  Terminal,
  Info,
  Shield,
  Box,
  AlertTriangle,
} from 'lucide-react';
import { ContainerSummary } from '../../types';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';

interface ContainersViewProps {
  containers: ContainerSummary[];
  isLoading: boolean;
  error: string | null;
  onSelectContainer: (id: string) => void;
  onAction: (containerId: string, action: 'start' | 'stop' | 'restart', confirm: boolean) => Promise<void>;
  onViewLogs: (containerId: string) => void;
  isDemoMode: boolean;
  onToggleDemoMode: () => void;
}

export const ContainersView: React.FC<ContainersViewProps> = ({
  containers,
  isLoading,
  error,
  onSelectContainer,
  onAction,
  onViewLogs,
  isDemoMode,
  onToggleDemoMode,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'running' | 'exited'>('all');

  // Confirmation Modal state for destructive actions
  const [pendingAction, setPendingAction] = useState<{
    containerId: string;
    containerName: string;
    action: 'start' | 'stop' | 'restart';
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const filtered = containers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.short_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.image.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'running') return c.state === 'running';
    if (statusFilter === 'exited') return c.state === 'exited';
    return true;
  });

  const handleActionClick = (
    e: React.MouseEvent,
    container: ContainerSummary,
    action: 'start' | 'stop' | 'restart'
  ) => {
    e.stopPropagation();
    if (action === 'start') {
      // Starting is safe, can execute directly
      onAction(container.id, 'start', true);
    } else {
      // Stopping or restarting can disrupt active services -> requires confirmation modal!
      setPendingAction({
        containerId: container.id,
        containerName: container.name,
        action,
      });
    }
  };

  const confirmPendingAction = async () => {
    if (!pendingAction) return;
    setActionLoading(true);
    try {
      await onAction(pendingAction.containerId, pendingAction.action, true);
      setPendingAction(null);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="content-area">
      <div className="view-header">
        <div className="view-title-group">
          <h1>
            <span>Container Explorer</span>
            {isDemoMode && <span className="badge badge-demo">Demo Data</span>}
          </h1>
          <div className="view-description">
            Inspect live container instances, view published ports, and manage lifecycle.
          </div>
        </div>
      </div>

      {error && !isDemoMode && (
        <div
          style={{
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--color-warning)',
            borderRadius: 'var(--radius-md)',
            padding: '16px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertTriangle size={18} color="var(--color-warning)" />
            <span>Docker Engine is offline. {error}</span>
          </div>
          <button onClick={onToggleDemoMode} className="btn btn-sm">
            Switch to Demo Sandbox
          </button>
        </div>
      )}

      <div className="table-container">
        <div className="table-toolbar">
          <div className="search-input-group">
            <Search size={14} />
            <input
              type="text"
              placeholder="Filter by name, ID, or image..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              id="container-search"
            />
          </div>

          <div className="filter-btn-group">
            <button
              className={`btn btn-sm ${statusFilter === 'all' ? 'btn-primary' : ''}`}
              onClick={() => setStatusFilter('all')}
            >
              All ({containers.length})
            </button>
            <button
              className={`btn btn-sm ${statusFilter === 'running' ? 'btn-primary' : ''}`}
              onClick={() => setStatusFilter('running')}
            >
              Running ({containers.filter((c) => c.state === 'running').length})
            </button>
            <button
              className={`btn btn-sm ${statusFilter === 'exited' ? 'btn-primary' : ''}`}
              onClick={() => setStatusFilter('exited')}
            >
              Exited ({containers.filter((c) => c.state === 'exited').length})
            </button>
          </div>
        </div>

        <table className="table-dense">
          <thead>
            <tr>
              <th>Status</th>
              <th>Name</th>
              <th>Container ID</th>
              <th>Image</th>
              <th>Ports</th>
              <th>Created</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                  Querying container daemon...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                  <Box size={24} style={{ marginBottom: '8px', opacity: 0.5 }} />
                  <div>No containers found matching your search criteria.</div>
                </td>
              </tr>
            ) : (
              filtered.map((c) => (
                <tr key={c.id} onClick={() => onSelectContainer(c.id)}>
                  <td>
                    <Badge variant={c.state === 'running' ? 'running' : 'exited'}>
                      {c.status}
                    </Badge>
                  </td>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {c.name}
                    {c.compose_service && (
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block' }}>
                        svc: {c.compose_service}
                      </span>
                    )}
                  </td>
                  <td className="mono" style={{ color: 'var(--docker-blue)', fontSize: '11px' }}>
                    {c.short_id}
                  </td>
                  <td className="mono" style={{ fontSize: '11px' }}>
                    {c.image}
                  </td>
                  <td style={{ fontSize: '11px' }}>
                    {c.ports.length > 0 ? (
                      <span className="mono">{c.ports.slice(0, 2).join(', ')}{c.ports.length > 2 ? ' ...' : ''}</span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>—</span>
                    )}
                  </td>
                  <td style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    {c.created ? c.created.split('T')[0] : '—'}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '4px' }} onClick={(e) => e.stopPropagation()}>
                      <button
                        className="btn btn-sm"
                        title="View Container Logs"
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewLogs(c.id);
                        }}
                      >
                        <Terminal size={12} />
                      </button>
                      <button
                        className="btn btn-sm"
                        title="Inspect Container"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectContainer(c.id);
                        }}
                      >
                        <Info size={12} />
                      </button>
                      {c.state === 'running' ? (
                        <>
                          <button
                            className="btn btn-sm"
                            title="Restart Container"
                            onClick={(e) => handleActionClick(e, c, 'restart')}
                          >
                            <RotateCw size={12} />
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            title="Stop Container"
                            onClick={(e) => handleActionClick(e, c, 'stop')}
                          >
                            <Square size={12} />
                          </button>
                        </>
                      ) : (
                        <button
                          className="btn btn-sm btn-primary"
                          title="Start Container"
                          onClick={(e) => handleActionClick(e, c, 'start')}
                        >
                          <Play size={12} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Confirmation Dialog for Destructive Actions */}
      <Modal
        isOpen={pendingAction !== null}
        onClose={() => setPendingAction(null)}
        onConfirm={confirmPendingAction}
        title={`Confirm Container ${pendingAction?.action === 'stop' ? 'Stop' : 'Restart'}`}
        description={`Are you sure you want to ${pendingAction?.action} container "${pendingAction?.containerName}"? This may interrupt active network connections or running background workloads.`}
        confirmLabel={pendingAction?.action === 'stop' ? 'Stop Container' : 'Restart Container'}
        confirmVariant={pendingAction?.action === 'stop' ? 'danger' : 'primary'}
        isLoading={actionLoading}
      />
    </div>
  );
};
