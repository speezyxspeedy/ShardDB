import React, { useState } from 'react';
import {
  ChevronUp,
  ChevronDown,
  Terminal,
  Copy,
  Check,
  Search,
  Maximize2,
  Minimize2
} from 'lucide-react';
import type { Execution } from '../../types';

interface ExecutionConsoleProps {
  execution: Execution | null;
  isOpen: boolean;
  onToggle: () => void;
  onSelectNode: (nodeId: string) => void;
}

export const ExecutionConsole: React.FC<ExecutionConsoleProps> = ({
  execution,
  isOpen,
  onToggle,
  onSelectNode
}) => {
  const [activeTab, setActiveTab] = useState<'logs' | 'steps' | 'output'>('logs');
  const [logFilter, setLogFilter] = useState<string>('ALL');
  const [logSearch, setLogSearch] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);

  if (!isOpen) {
    return (
      <div
        style={{
          position: 'absolute',
          bottom: 12,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 15
        }}
      >
        <button
          onClick={onToggle}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 14px',
            borderRadius: 4,
            background: '#FFFFFF',
            border: '1px solid var(--border-strong)',
            color: 'var(--text-primary)',
            fontSize: 11,
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            boxShadow: 'var(--shadow-md)',
            transition: 'all 0.15s ease'
          }}
        >
          <Terminal size={13} color="var(--accent-orange)" />
          <span>EXECUTION CONSOLE</span>
          {execution && (
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background:
                  execution.status === 'COMPLETED'
                    ? 'var(--status-success)'
                    : execution.status === 'FAILED'
                    ? 'var(--status-error)'
                    : 'var(--accent-cobalt)'
              }}
            />
          )}
          <ChevronUp size={13} color="var(--text-secondary)" />
        </button>
      </div>
    );
  }

  // Filter logs
  const filteredLogs = (execution?.logs || []).filter(l => {
    if (logFilter !== 'ALL' && l.level !== logFilter) return false;
    if (logSearch.trim()) {
      const q = logSearch.toLowerCase();
      return (
        l.message.toLowerCase().includes(q) ||
        (l.node_name && l.node_name.toLowerCase().includes(q)) ||
        (l.node_id && l.node_id.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const copyOutput = () => {
    if (!execution) return;
    const finalPayload = execution.final_output_json || execution.node_results;
    navigator.clipboard.writeText(JSON.stringify(finalPayload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const nodeResults = execution?.node_results || {};
  const executionOrder = execution?.execution_order || Object.keys(nodeResults);
  const activeStep = selectedStepId ? nodeResults[selectedStepId] : (executionOrder.length > 0 ? nodeResults[executionOrder[0]] : null);

  const consoleHeight = isExpanded ? '520px' : '280px';

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: consoleHeight,
        background: '#FFFFFF',
        borderTop: '1px solid var(--border-strong)',
        boxShadow: '0 -4px 20px rgba(32, 33, 31, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 20,
        transition: 'height 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      {/* Console Header Bar */}
      <div
        style={{
          height: 38,
          borderBottom: '1px solid var(--border-subtle)',
          background: '#FAF9F5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 14px'
        }}
      >
        {/* Left: Title & Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Terminal size={14} color="var(--accent-orange)" />
            <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.05em' }}>
              EXECUTION CONSOLE
            </span>
          </div>

          {execution ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className={`badge badge-${execution.status.toLowerCase()}`}>
                {execution.status}
              </span>
              <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                ID: {execution.id.substring(0, 8)}... • {execution.duration_ms}ms • {executionOrder.length} steps
              </span>
            </div>
          ) : (
            <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>
              (No execution run yet — click "Run Workflow")
            </span>
          )}
        </div>

        {/* Center: Tabs */}
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            onClick={() => setActiveTab('logs')}
            style={{
              padding: '4px 10px',
              fontSize: 10,
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              color: activeTab === 'logs' ? 'var(--accent-orange)' : 'var(--text-secondary)',
              borderBottom: activeTab === 'logs' ? '2px solid var(--accent-orange)' : '2px solid transparent'
            }}
          >
            LOGS ({execution?.logs?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('steps')}
            style={{
              padding: '4px 10px',
              fontSize: 10,
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              color: activeTab === 'steps' ? 'var(--accent-orange)' : 'var(--text-secondary)',
              borderBottom: activeTab === 'steps' ? '2px solid var(--accent-orange)' : '2px solid transparent'
            }}
          >
            STEP INSPECTOR ({executionOrder.length})
          </button>
          <button
            onClick={() => setActiveTab('output')}
            style={{
              padding: '4px 10px',
              fontSize: 10,
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              color: activeTab === 'output' ? 'var(--accent-orange)' : 'var(--text-secondary)',
              borderBottom: activeTab === 'output' ? '2px solid var(--accent-orange)' : '2px solid transparent'
            }}
          >
            FINAL OUTPUT (JSON)
          </button>
        </div>

        {/* Right: Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Restore height' : 'Expand console'}
            className="btn-icon"
            style={{ width: 24, height: 24 }}
          >
            {isExpanded ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>
          <button
            onClick={onToggle}
            title="Minimize console"
            className="btn-icon"
            style={{ width: 24, height: 24 }}
          >
            <ChevronDown size={14} />
          </button>
        </div>
      </div>

      {/* Console Content */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
        {/* TAB 1: RUN LOGS */}
        {activeTab === 'logs' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Filter toolbar */}
            <div
              style={{
                padding: '6px 14px',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                background: '#FFFFFF'
              }}
            >
              <div style={{ display: 'flex', gap: 4 }}>
                {['ALL', 'INFO', 'SUCCESS', 'WARNING', 'ERROR'].map(lvl => (
                  <button
                    key={lvl}
                    onClick={() => setLogFilter(lvl)}
                    style={{
                      fontSize: 10,
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 600,
                      padding: '2px 6px',
                      borderRadius: 2,
                      background: logFilter === lvl ? 'var(--text-primary)' : '#FAF9F5',
                      color: logFilter === lvl ? '#FFFFFF' : 'var(--text-secondary)',
                      border: '1px solid var(--border-subtle)'
                    }}
                  >
                    {lvl}
                  </button>
                ))}
              </div>

              <div style={{ position: 'relative', width: 180 }}>
                <Search size={11} style={{ position: 'absolute', left: 6, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                <input
                  type="text"
                  placeholder="Filter logs..."
                  value={logSearch}
                  onChange={e => setLogSearch(e.target.value)}
                  style={{ width: '100%', paddingLeft: 22, paddingTop: 3, paddingBottom: 3, fontSize: 11 }}
                />
              </div>
            </div>

            {/* Logs List */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '8px 14px',
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                lineHeight: 1.6
              }}
            >
              {filteredLogs.length === 0 ? (
                <div style={{ color: 'var(--text-dim)', fontStyle: 'italic', padding: '16px 0' }}>
                  {execution ? 'No logs matching current filter.' : 'Execution logs will be recorded here when you run a workflow.'}
                </div>
              ) : (
                filteredLogs.map((log, idx) => {
                  let lvlColor = 'var(--text-secondary)';
                  if (log.level === 'SUCCESS') lvlColor = 'var(--status-success)';
                  if (log.level === 'ERROR') lvlColor = 'var(--status-error)';
                  if (log.level === 'WARNING') lvlColor = 'var(--status-warning)';

                  return (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 10,
                        padding: '2px 0',
                        borderBottom: '1px dotted #EDEAE1'
                      }}
                    >
                      <span style={{ color: 'var(--text-dim)', flexShrink: 0, fontSize: 10 }}>
                        {log.timestamp ? log.timestamp.substring(11, 19) : ''}
                      </span>
                      <span
                        style={{
                          fontWeight: 700,
                          color: lvlColor,
                          width: 58,
                          flexShrink: 0,
                          fontSize: 10
                        }}
                      >
                        [{log.level}]
                      </span>
                      {log.node_name && (
                        <button
                          onClick={() => log.node_id && onSelectNode(log.node_id)}
                          style={{
                            color: 'var(--accent-cobalt)',
                            textDecoration: 'underline',
                            flexShrink: 0,
                            fontSize: 11
                          }}
                        >
                          {log.node_name}:
                        </button>
                      )}
                      <span style={{ color: 'var(--text-primary)', wordBreak: 'break-word' }}>
                        {log.message}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 2: STEP INSPECTOR */}
        {activeTab === 'steps' && (
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            {/* Steps Left List */}
            <div
              style={{
                width: 240,
                borderRight: '1px solid var(--border-subtle)',
                background: '#FAF9F5',
                overflowY: 'auto',
                padding: '8px'
              }}
            >
              <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: 6, paddingLeft: 4 }}>
                EXECUTION ORDER ({executionOrder.length} NODES)
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {executionOrder.map((nid, index) => {
                  const res = nodeResults[nid];
                  if (!res) return null;
                  const isSelected = selectedStepId === nid || (!selectedStepId && index === 0);

                  return (
                    <button
                      key={nid}
                      onClick={() => setSelectedStepId(nid)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 8px',
                        background: isSelected ? '#FFFFFF' : 'transparent',
                        border: isSelected ? '1px solid var(--border-strong)' : '1px solid transparent',
                        borderRadius: 3,
                        textAlign: 'left',
                        fontFamily: 'var(--font-mono)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
                        <span style={{ color: 'var(--text-dim)', fontSize: 10 }}>#{index + 1}</span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {res.node_name || nid}
                        </span>
                      </div>
                      <span className={`badge badge-${res.status.toLowerCase()}`} style={{ fontSize: 9 }}>
                        {res.status}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Step Detail Right */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {activeStep ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-display)' }}>
                        {activeStep.node_name}
                      </div>
                      <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                        Node ID: {activeStep.node_id} • Type: {activeStep.node_type} • Duration: {activeStep.duration_ms}ms
                      </div>
                    </div>
                    <button
                      onClick={() => onSelectNode(activeStep.node_id)}
                      className="btn-secondary"
                      style={{ fontSize: 10, fontFamily: 'var(--font-mono)', padding: '4px 8px' }}
                    >
                      Focus on Canvas
                    </button>
                  </div>

                  {activeStep.error && (
                    <div style={{ padding: '8px 10px', background: 'var(--status-error-bg)', border: '1px solid var(--status-error-border)', borderRadius: 3, color: 'var(--status-error)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                      <strong>Error:</strong> {activeStep.error}
                    </div>
                  )}

                  {activeStep.branch_selected && (
                    <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                      <strong>Evaluated Condition Branch:</strong> <span style={{ color: activeStep.branch_selected === 'true' ? 'var(--status-success)' : 'var(--status-error)', fontWeight: 700 }}>{activeStep.branch_selected.toUpperCase()}</span>
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
                        STEP INPUT DATA
                      </div>
                      <pre style={{ padding: 8, background: '#FAF9F5', border: '1px solid var(--border-subtle)', borderRadius: 3, fontSize: 11, fontFamily: 'var(--font-mono)', maxHeight: 180, overflowY: 'auto' }}>
                        {JSON.stringify(activeStep.inputs, null, 2)}
                      </pre>
                    </div>

                    <div>
                      <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
                        STEP OUTPUT DATA
                      </div>
                      <pre style={{ padding: 8, background: '#FAF9F5', border: '1px solid var(--border-subtle)', borderRadius: 3, fontSize: 11, fontFamily: 'var(--font-mono)', maxHeight: 180, overflowY: 'auto' }}>
                        {JSON.stringify(activeStep.output, null, 2)}
                      </pre>
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ color: 'var(--text-dim)', fontStyle: 'italic', padding: 16 }}>
                  Select an executed node step from the left list.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: FINAL OUTPUT (JSON) */}
        {activeTab === 'output' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '12px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                COMPLETE WORKFLOW RESULTS PAYLOAD
              </div>
              <button
                onClick={copyOutput}
                className="btn-secondary"
                style={{ fontSize: 10, fontFamily: 'var(--font-mono)', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                {copied ? <Check size={12} color="var(--status-success)" /> : <Copy size={12} />}
                <span>{copied ? 'COPIED TO CLIPBOARD' : 'COPY JSON OUTPUT'}</span>
              </button>
            </div>

            <pre
              style={{
                flex: 1,
                padding: 12,
                background: '#FAF9F5',
                border: '1px solid var(--border-subtle)',
                borderRadius: 4,
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                lineHeight: 1.5,
                overflowY: 'auto'
              }}
            >
              {execution ? JSON.stringify(execution.final_output_json || execution.node_results, null, 2) : '// No workflow execution has run yet.'}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
