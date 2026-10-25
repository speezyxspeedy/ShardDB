import React from 'react';
import { X, Box, Layers, Network, ShieldCheck, HardDrive, Terminal } from 'lucide-react';
import { ContainerDetail, ImageDetail, ComposeServiceConfig } from '../../types';
import { Badge } from '../common/Badge';

export type SelectedItem =
  | { type: 'container'; data: ContainerDetail }
  | { type: 'image'; data: ImageDetail }
  | { type: 'service'; data: ComposeServiceConfig };

interface DetailsSlideOverProps {
  selectedItem: SelectedItem | null;
  onClose: () => void;
  onViewLogs?: (containerId: string) => void;
}

export const DetailsSlideOver: React.FC<DetailsSlideOverProps> = ({
  selectedItem,
  onClose,
  onViewLogs,
}) => {
  if (!selectedItem) return null;

  return (
    <div className="slideover-overlay" onClick={onClose}>
      <aside className="slideover-panel" onClick={(e) => e.stopPropagation()}>
        <div className="slideover-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {selectedItem.type === 'container' && <Box size={18} color="var(--docker-blue)" />}
            {selectedItem.type === 'image' && <Layers size={18} color="var(--docker-blue)" />}
            {selectedItem.type === 'service' && <Network size={18} color="var(--accent-lime)" />}
            <span style={{ fontWeight: 600, fontSize: '14px' }}>
              {selectedItem.type === 'container' && `Container: ${selectedItem.data.name}`}
              {selectedItem.type === 'image' && `Image: ${selectedItem.data.tags[0] || selectedItem.data.short_id}`}
              {selectedItem.type === 'service' && `Service: ${selectedItem.data.name}`}
            </span>
          </div>
          <button
            onClick={onClose}
            className="btn btn-sm"
            style={{ background: 'transparent', border: 'none', padding: '4px' }}
            aria-label="Close panel"
          >
            <X size={16} />
          </button>
        </div>

        <div className="slideover-body">
          {/* Container View */}
          {selectedItem.type === 'container' && (
            <>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <Badge variant={selectedItem.data.state === 'running' ? 'running' : 'exited'}>
                  {selectedItem.data.status}
                </Badge>
                {selectedItem.data.health && (
                  <Badge variant={selectedItem.data.health === 'healthy' ? 'healthy' : 'warning'}>
                    Health: {selectedItem.data.health}
                  </Badge>
                )}
                {selectedItem.data.is_demo && <Badge variant="demo">Demo Data</Badge>}
              </div>

              <div className="detail-section">
                <div className="detail-section-title">Identity & Runtime</div>
                <div className="key-value-list">
                  <div className="key-value-row">
                    <span className="kv-key">Full ID</span>
                    <span className="kv-val" title={selectedItem.data.id}>{selectedItem.data.id}</span>
                  </div>
                  <div className="key-value-row">
                    <span className="kv-key">Image</span>
                    <span className="kv-val" title={selectedItem.data.image}>{selectedItem.data.image}</span>
                  </div>
                  <div className="key-value-row">
                    <span className="kv-key">Created</span>
                    <span className="kv-val">{selectedItem.data.created}</span>
                  </div>
                  <div className="key-value-row">
                    <span className="kv-key">Started At</span>
                    <span className="kv-val">{selectedItem.data.started_at || '—'}</span>
                  </div>
                  <div className="key-value-row">
                    <span className="kv-key">Exit Code</span>
                    <span className="kv-val">{selectedItem.data.exit_code ?? 'None'}</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <div className="detail-section-title">Port Mappings</div>
                {selectedItem.data.ports.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>No exposed ports</div>
                ) : (
                  <div className="key-value-list">
                    {selectedItem.data.ports.map((p, idx) => (
                      <div key={idx} className="key-value-row">
                        <span className="kv-key">Port {p.container_port}/{p.protocol}</span>
                        <span className="kv-val">
                          {p.host_port ? `${p.host_ip || '0.0.0.0'}:${p.host_port}` : 'Not bound to host'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="detail-section">
                <div className="detail-section-title">Mounts & Volumes</div>
                {selectedItem.data.mounts.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>No volumes mounted</div>
                ) : (
                  <div className="key-value-list">
                    {selectedItem.data.mounts.map((m, idx) => (
                      <div key={idx} className="key-value-row">
                        <span className="kv-key" title={m.source}>{m.source}</span>
                        <span className="kv-val" title={m.destination}>&rarr; {m.destination} ({m.mode})</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="detail-section">
                <div className="detail-section-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldCheck size={14} color="var(--color-success)" />
                  <span>Environment Variables (Redacted)</span>
                </div>
                <div className="key-value-list">
                  {Object.entries(selectedItem.data.env).map(([k, v]) => (
                    <div key={k} className="key-value-row">
                      <span className="kv-key">{k}</span>
                      <span className="kv-val" style={{ color: v.includes('REDACTED') ? 'var(--color-warning)' : 'inherit' }}>
                        {v || '(empty)'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {onViewLogs && (
                <button
                  onClick={() => onViewLogs(selectedItem.data.id)}
                  className="btn btn-primary"
                  style={{ marginTop: '8px' }}
                >
                  <Terminal size={14} />
                  <span>Open Container Logs</span>
                </button>
              )}
            </>
          )}

          {/* Image View */}
          {selectedItem.type === 'image' && (
            <>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <Badge variant="info">{selectedItem.data.size_formatted}</Badge>
                {selectedItem.data.is_demo && <Badge variant="demo">Demo Image</Badge>}
              </div>

              <div className="detail-section">
                <div className="detail-section-title">Image Properties</div>
                <div className="key-value-list">
                  <div className="key-value-row">
                    <span className="kv-key">Image ID</span>
                    <span className="kv-val" title={selectedItem.data.id}>{selectedItem.data.id}</span>
                  </div>
                  <div className="key-value-row">
                    <span className="kv-key">Architecture</span>
                    <span className="kv-val">{selectedItem.data.architecture || 'Unknown'} / {selectedItem.data.os || 'Linux'}</span>
                  </div>
                  <div className="key-value-row">
                    <span className="kv-key">Docker Version</span>
                    <span className="kv-val">{selectedItem.data.docker_version || 'N/A'}</span>
                  </div>
                  <div className="key-value-row">
                    <span className="kv-key">Created</span>
                    <span className="kv-val">{selectedItem.data.created}</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <div className="detail-section-title">Layer History ({selectedItem.data.layers.length} layers)</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {selectedItem.data.layers.map((l, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '8px 10px',
                        background: 'var(--bg-main)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '11px',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--docker-blue)' }}>
                        <span>{l.id}</span>
                        <span>{l.size_formatted}</span>
                      </div>
                      <div style={{ color: 'var(--text-secondary)', marginTop: '2px', wordBreak: 'break-all' }}>
                        {l.created_by || '(empty layer)'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Service View */}
          {selectedItem.type === 'service' && (
            <>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <Badge variant="info">Compose Service</Badge>
                {selectedItem.data.privileged && <Badge variant="error">Privileged Mode</Badge>}
              </div>

              <div className="detail-section">
                <div className="detail-section-title">Service Configuration</div>
                <div className="key-value-list">
                  <div className="key-value-row">
                    <span className="kv-key">Service Name</span>
                    <span className="kv-val">{selectedItem.data.name}</span>
                  </div>
                  <div className="key-value-row">
                    <span className="kv-key">Image</span>
                    <span className="kv-val">{selectedItem.data.image || '(Build from source)'}</span>
                  </div>
                  <div className="key-value-row">
                    <span className="kv-key">Restart Policy</span>
                    <span className="kv-val">{selectedItem.data.restart || 'None (default: no)'}</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <div className="detail-section-title">Declared Dependencies (depends_on)</div>
                {selectedItem.data.depends_on.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>No dependencies declared</div>
                ) : (
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {selectedItem.data.depends_on.map((dep) => (
                      <Badge key={dep} variant="info">{dep}</Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="detail-section">
                <div className="detail-section-title">Published Ports</div>
                {selectedItem.data.ports.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>No ports declared</div>
                ) : (
                  <div className="key-value-list">
                    {selectedItem.data.ports.map((p, idx) => (
                      <div key={idx} className="key-value-row">
                        <span className="kv-key">Port {idx + 1}</span>
                        <span className="kv-val">{p}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="detail-section">
                <div className="detail-section-title">Volumes</div>
                {selectedItem.data.volumes.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>No volumes declared</div>
                ) : (
                  <div className="key-value-list">
                    {selectedItem.data.volumes.map((v, idx) => (
                      <div key={idx} className="key-value-row">
                        <span className="kv-key">Vol {idx + 1}</span>
                        <span className="kv-val" title={v}>{v}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </aside>
    </div>
  );
};
