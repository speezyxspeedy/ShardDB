import React, { useState } from 'react';
import {
  Clock,
  Search,
  Trash2,
  Copy,
  Check,
  X
} from 'lucide-react';
import type { Execution } from '../types';

interface HistoryPageProps {
  executions: Execution[];
  onInspectExecution: (executionId: string) => void;
  onCancelExecution: (executionId: string) => void;
  onDeleteExecution: (executionId: string) => void;
  onClearAllExecutions: () => void;
  onNavigateToEditor: () => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({
  executions,
  onInspectExecution,
  onCancelExecution,
  onDeleteExecution,
  onClearAllExecutions,
  onNavigateToEditor
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedExecution, setSelectedExecution] = useState<Execution | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  // Filter executions
  const filteredExecutions = executions.filter(exec => {
    const matchesStatus = statusFilter === 'ALL' || exec.status === statusFilter;
    const matchesSearch =
      exec.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exec.workflow_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (exec.workflow_id && exec.workflow_id.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesStatus && matchesSearch;
  });

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  return (
    <div
      style={{
        flex: 1,
        height: '100%',
        overflowY: 'auto',
        background: 'var(--bg-canvas)',
        padding: '24px 32px'
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 16 }}>
          <div>
            <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--accent-orange)', fontWeight: 700, letterSpacing: '0.06em', marginBottom: 4 }}>
              AUDIT TRAIL • LOCAL RUN LOGS
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
              Execution History
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
              Persisted audit log of all workflow runs, step durations, inputs, outputs, and errors.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            {confirmClear ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button
                  onClick={() => {
                    onClearAllExecutions();
                    setConfirmClear(false);
                  }}
                  style={{
                    background: 'var(--status-error)',
                    color: '#FFFFFF',
                    padding: '6px 12px',
                    borderRadius: 4,
                    fontSize: 11,
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700
                  }}
                >
                  CONFIRM CLEAR
                </button>
                <button
                  onClick={() => setConfirmClear(false)}
                  className="btn-secondary"
                  style={{ padding: '6px 10px', fontSize: 11 }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmClear(true)}
                disabled={executions.length === 0}
                className="btn-secondary"
                style={{ padding: '8px 14px', fontSize: 12 }}
              >
                <Trash2 size={13} color="var(--status-error)" />
                <span>Clear All History</span>
              </button>
            )}
          </div>
        </div>

        {/* Filters Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap'
          }}
        >
          {/* Status Tabs */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {['ALL', 'COMPLETED', 'FAILED', 'RUNNING', 'CANCELLED'].map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 4,
                  fontSize: 11,
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 600,
                  background: statusFilter === st ? 'var(--text-primary)' : '#FFFFFF',
                  color: statusFilter === st ? '#FFFFFF' : 'var(--text-secondary)',
                  border: '1px solid var(--border-subtle)',
                  transition: 'all 0.15s ease'
                }}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', width: 280 }}>
            <Search
              size={13}
              style={{
                position: 'absolute',
                left: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-dim)'
              }}
            />
            <input
              type="text"
              placeholder="Search by workflow name or run ID..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                paddingLeft: 30,
                background: '#FFFFFF'
              }}
            />
          </div>
        </div>

        {/* Table of Executions */}
        {filteredExecutions.length === 0 ? (
          /* Empty State */
          <div
            style={{
              padding: '60px 24px',
              background: '#FFFFFF',
              border: '1px dashed var(--border-medium)',
              borderRadius: 6,
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                background: '#FAF9F5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary)'
              }}
            >
              <Clock size={24} />
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
              {executions.length === 0 ? 'No executions recorded yet' : 'No executions matching filter'}
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', maxWidth: 420 }}>
              {executions.length === 0
                ? 'Run any workflow from the editor canvas or the dashboard to see step-by-step outputs and traces recorded here.'
                : 'Try selecting the "ALL" filter or clearing the search query.'}
            </p>
            {executions.length === 0 && (
              <button onClick={onNavigateToEditor} className="btn-primary" style={{ marginTop: 6 }}>
                Open Editor Canvas
              </button>
            )}
          </div>
        ) : (
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid var(--border-subtle)',
              borderRadius: 4,
              overflow: 'hidden',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#FAF9F5', borderBottom: '1px solid var(--border-subtle)', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '10px 14px' }}>RUN ID</th>
                  <th style={{ padding: '10px 14px' }}>WORKFLOW NAME</th>
                  <th style={{ padding: '10px 14px' }}>TRIGGER</th>
                  <th style={{ padding: '10px 14px' }}>STATUS</th>
                  <th style={{ padding: '10px 14px' }}>STARTED AT</th>
                  <th style={{ padding: '10px 14px' }}>DURATION</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredExecutions.map(exec => {
                  const startTime = exec.started_at
                    ? new Date(exec.started_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })
                    : 'Unknown';

                  const isSelected = selectedExecution?.id === exec.id;

                  return (
                    <tr
                      key={exec.id}
                      onClick={() => setSelectedExecution(exec)}
                      style={{
                        borderBottom: '1px solid var(--border-subtle)',
                        background: isSelected ? 'var(--bg-active)' : 'transparent',
                        cursor: 'pointer',
                        transition: 'background 0.1s ease'
                      }}
                    >
                      <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-primary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span>{exec.id.substring(0, 8)}...</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(exec.id, exec.id);
                            }}
                            title="Copy Run ID"
                            style={{ color: 'var(--text-dim)', padding: 2 }}
                          >
                            {copiedKey === exec.id ? <Check size={11} color="var(--status-success)" /> : <Copy size={11} />}
                          </button>
                        </div>
                      </td>

                      <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {exec.workflow_name}
                      </td>

                      <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-secondary)' }}>
                        [{exec.triggered_by || 'MANUAL'}]
                      </td>

                      <td style={{ padding: '12px 14px' }}>
                        <span className={`badge badge-${exec.status.toLowerCase()}`}>
                          {exec.status}
                        </span>
                      </td>

                      <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                        {startTime}
                      </td>

                      <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                        {exec.duration_ms} ms
                      </td>

                      <td style={{ padding: '12px 14px', textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <button
                            onClick={() => {
                              setSelectedExecution(exec);
                              onInspectExecution(exec.id);
                            }}
                            className="btn-secondary"
                            style={{ padding: '4px 8px', fontSize: 10, fontFamily: 'var(--font-mono)' }}
                          >
                            Inspect
                          </button>

                          {exec.status === 'RUNNING' && (
                            <button
                              onClick={() => onCancelExecution(exec.id)}
                              title="Cancel execution"
                              style={{
                                padding: '4px 8px',
                                background: 'var(--status-warning-bg)',
                                color: 'var(--status-warning)',
                                border: '1px solid var(--status-warning-border)',
                                borderRadius: 3,
                                fontSize: 10,
                                fontFamily: 'var(--font-mono)',
                                fontWeight: 600
                              }}
                            >
                              Cancel
                            </button>
                          )}

                          <button
                            onClick={() => onDeleteExecution(exec.id)}
                            title="Delete execution record"
                            className="btn-icon"
                            style={{ width: 24, height: 24, color: 'var(--status-error)' }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Selected Execution Inspection Drawer */}
        {selectedExecution && (
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid var(--border-strong)',
              borderRadius: 4,
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              boxShadow: 'var(--shadow-md)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 12 }}>
              <div>
                <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--accent-orange)', fontWeight: 700 }}>
                  STEP-BY-STEP RUN INSPECTOR
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                  {selectedExecution.workflow_name}
                </div>
                <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                  Run ID: {selectedExecution.id} • Started: {selectedExecution.started_at} • Total: {selectedExecution.duration_ms}ms
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  onClick={() => copyToClipboard(JSON.stringify(selectedExecution, null, 2), 'full_exec')}
                  className="btn-secondary"
                  style={{ fontSize: 10, fontFamily: 'var(--font-mono)', padding: '5px 10px' }}
                >
                  {copiedKey === 'full_exec' ? 'Copied' : 'Copy Full Run JSON'}
                </button>
                <button
                  onClick={() => setSelectedExecution(null)}
                  className="btn-icon"
                  style={{ width: 28, height: 28 }}
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Error Banner if Failed */}
            {selectedExecution.error && (
              <div
                style={{
                  padding: '10px 14px',
                  background: 'var(--status-error-bg)',
                  border: '1px solid var(--status-error-border)',
                  borderRadius: 4,
                  color: 'var(--status-error)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12
                }}
              >
                <strong>Execution Failed:</strong> {selectedExecution.error}
              </div>
            )}

            {/* Step Timeline */}
            <div>
              <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8 }}>
                NODE EXECUTION STEPS ({Object.keys(selectedExecution.node_results || {}).length} NODES)
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {Object.entries(selectedExecution.node_results || {}).map(([nid, res], idx) => (
                  <div
                    key={nid}
                    style={{
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 4,
                      padding: '10px 12px',
                      background: '#FAF9F5'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>
                          #{idx + 1}
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
                          {res.node_name || nid}
                        </span>
                        <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                          ({res.node_type})
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className={`badge badge-${res.status.toLowerCase()}`}>
                          {res.status}
                        </span>
                        <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                          {res.duration_ms} ms
                        </span>
                      </div>
                    </div>

                    {res.branch_selected && (
                      <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: res.branch_selected === 'true' ? 'var(--status-success)' : 'var(--status-error)', marginBottom: 6 }}>
                        Branch Evaluated: <strong>{res.branch_selected.toUpperCase()}</strong>
                      </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 6 }}>
                      <div>
                        <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: 2 }}>
                          INPUTS:
                        </div>
                        <pre style={{ fontSize: 10, fontFamily: 'var(--font-mono)', padding: 6, background: '#FFFFFF', border: '1px solid var(--border-subtle)', borderRadius: 2, maxHeight: 100, overflowY: 'auto' }}>
                          {JSON.stringify(res.inputs, null, 2)}
                        </pre>
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                          <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                            OUTPUT:
                          </span>
                          <button
                            onClick={() => copyToClipboard(JSON.stringify(res.output, null, 2), `step_${nid}`)}
                            style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--accent-orange)' }}
                          >
                            {copiedKey === `step_${nid}` ? 'Copied' : 'Copy'}
                          </button>
                        </div>
                        <pre style={{ fontSize: 10, fontFamily: 'var(--font-mono)', padding: 6, background: '#FFFFFF', border: '1px solid var(--border-subtle)', borderRadius: 2, maxHeight: 100, overflowY: 'auto' }}>
                          {JSON.stringify(res.output, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
