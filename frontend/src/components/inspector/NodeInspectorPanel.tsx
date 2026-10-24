import React, { useState } from 'react';
import {
  X,
  Trash2,
  Sliders,
  ArrowDownLeft,
  ArrowUpRight,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import type { CustomNodeType, NodeDefinition } from '../../types';

interface NodeInspectorPanelProps {
  selectedNode: CustomNodeType | null;
  definition: NodeDefinition | null;
  onUpdateNodeData: (nodeId: string, updatedData: Record<string, any>) => void;
  onDeleteNode: (nodeId: string) => void;
  onClose: () => void;
}

export const NodeInspectorPanel: React.FC<NodeInspectorPanelProps> = ({
  selectedNode,
  definition,
  onUpdateNodeData,
  onDeleteNode,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'config' | 'io' | 'docs'>('config');
  const [copied, setCopied] = useState<string | null>(null);

  if (!selectedNode || !definition) {
    return null;
  }

  const nodeData = selectedNode.data || {};
  const execResult = nodeData.executionResult;

  const handleFieldChange = (fieldName: string, value: any) => {
    onUpdateNodeData(selectedNode.id, {
      ...nodeData,
      [fieldName]: value
    });
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1800);
  };

  return (
    <div
      style={{
        width: 340,
        height: '100%',
        background: '#FFFFFF',
        borderLeft: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 10,
        flexShrink: 0
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px 14px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#FAF9F5'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: 3,
              background: '#FFFFFF',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-orange)',
              flexShrink: 0
            }}
          >
            <Sliders size={14} />
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {nodeData.label || definition.label}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
              ID: {selectedNode.id} • [{definition.category.toUpperCase()}]
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button
            onClick={() => onDeleteNode(selectedNode.id)}
            title="Delete this node"
            className="btn-icon"
            style={{ width: 26, height: 26, color: 'var(--status-error)' }}
          >
            <Trash2 size={13} />
          </button>
          <button
            onClick={onClose}
            title="Close inspector"
            className="btn-icon"
            style={{ width: 26, height: 26 }}
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-subtle)',
          background: '#FFFFFF',
          padding: '0 12px'
        }}
      >
        <button
          onClick={() => setActiveTab('config')}
          style={{
            padding: '8px 12px',
            fontSize: 11,
            fontFamily: 'var(--font-mono)',
            fontWeight: 600,
            color: activeTab === 'config' ? 'var(--accent-orange)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'config' ? '2px solid var(--accent-orange)' : '2px solid transparent'
          }}
        >
          CONFIG
        </button>
        <button
          onClick={() => setActiveTab('io')}
          style={{
            padding: '8px 12px',
            fontSize: 11,
            fontFamily: 'var(--font-mono)',
            fontWeight: 600,
            color: activeTab === 'io' ? 'var(--accent-orange)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'io' ? '2px solid var(--accent-orange)' : '2px solid transparent'
          }}
        >
          INSPECT I/O
        </button>
        <button
          onClick={() => setActiveTab('docs')}
          style={{
            padding: '8px 12px',
            fontSize: 11,
            fontFamily: 'var(--font-mono)',
            fontWeight: 600,
            color: activeTab === 'docs' ? 'var(--accent-orange)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'docs' ? '2px solid var(--accent-orange)' : '2px solid transparent'
          }}
        >
          SPECS
        </button>
      </div>

      {/* Panel Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px' }}>
        {/* TAB 1: CONFIGURATION */}
        {activeTab === 'config' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Always allow editing the Node Label */}
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-mono)', marginBottom: 4, color: 'var(--text-secondary)' }}>
                NODE LABEL
              </label>
              <input
                type="text"
                value={nodeData.label || ''}
                onChange={e => handleFieldChange('label', e.target.value)}
                style={{ width: '100%' }}
                placeholder={definition.label}
              />
            </div>

            {/* Dynamic Config Fields */}
            {definition.config_fields && definition.config_fields.map(field => {
              if (field.name === 'label') return null; // already rendered above
              const val = nodeData[field.name] !== undefined ? nodeData[field.name] : field.default;

              return (
                <div key={field.name}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <label style={{ fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                      {field.label.toUpperCase()}
                      {field.required && <span style={{ color: 'var(--status-error)', marginLeft: 3 }}>*</span>}
                    </label>
                    {field.description && (
                      <span title={field.description} style={{ cursor: 'help', color: 'var(--text-dim)' }}>
                        <HelpCircle size={12} />
                      </span>
                    )}
                  </div>

                  {field.type === 'text' && (
                    <input
                      type="text"
                      value={val ?? ''}
                      onChange={e => handleFieldChange(field.name, e.target.value)}
                      placeholder={field.placeholder || ''}
                      style={{ width: '100%' }}
                    />
                  )}

                  {field.type === 'number' && (
                    <input
                      type="number"
                      step="any"
                      value={val ?? ''}
                      onChange={e => handleFieldChange(field.name, e.target.value === '' ? '' : parseFloat(e.target.value))}
                      style={{ width: '100%' }}
                    />
                  )}

                  {field.type === 'textarea' && (
                    <textarea
                      rows={4}
                      value={val ?? ''}
                      onChange={e => handleFieldChange(field.name, e.target.value)}
                      placeholder={field.placeholder || ''}
                      style={{ width: '100%', fontFamily: 'var(--font-mono)', fontSize: 12 }}
                    />
                  )}

                  {field.type === 'select' && field.options && (
                    <select
                      value={val ?? ''}
                      onChange={e => handleFieldChange(field.name, e.target.value)}
                      style={{ width: '100%' }}
                    >
                      {field.options.map(opt => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  )}

                  {field.type === 'boolean' && (
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12 }}>
                      <input
                        type="checkbox"
                        checked={Boolean(val)}
                        onChange={e => handleFieldChange(field.name, e.target.checked)}
                      />
                      <span>Enable {field.label}</span>
                    </label>
                  )}

                  {field.type === 'json' && (
                    <div>
                      <textarea
                        rows={5}
                        value={typeof val === 'object' ? JSON.stringify(val, null, 2) : String(val ?? '')}
                        onChange={e => handleFieldChange(field.name, e.target.value)}
                        style={{ width: '100%', fontFamily: 'var(--font-mono)', fontSize: 11 }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 2: INSPECT I/O */}
        {activeTab === 'io' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Status Card */}
            <div
              style={{
                padding: '10px 12px',
                background: '#FAF9F5',
                border: '1px solid var(--border-subtle)',
                borderRadius: 4
              }}
            >
              <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: 4 }}>
                NODE EXECUTION STATE
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className={`badge badge-${(nodeData.status || 'idle').toLowerCase()}`}>
                  {nodeData.status || 'IDLE'}
                </span>
                {execResult?.duration_ms !== undefined && (
                  <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                    {execResult.duration_ms} ms
                  </span>
                )}
              </div>
            </div>

            {/* Error Message if Failed */}
            {execResult?.error && (
              <div
                style={{
                  padding: '10px 12px',
                  background: 'var(--status-error-bg)',
                  border: '1px solid var(--status-error-border)',
                  borderRadius: 4
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--status-error)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <AlertCircle size={13} />
                  <span>Execution Error</span>
                </div>
                <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--status-error)' }}>
                  {execResult.error}
                </div>
              </div>
            )}

            {/* Selected Branch if Condition */}
            {execResult?.branch_selected && (
              <div
                style={{
                  padding: '8px 10px',
                  background: '#FAF9F5',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11
                }}
              >
                <span>Branch Evaluated:</span>
                <span style={{ fontWeight: 700, color: execResult.branch_selected === 'true' ? 'var(--status-success)' : 'var(--status-error)' }}>
                  {execResult.branch_selected.toUpperCase()}
                </span>
              </div>
            )}

            {/* Inputs Received */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <div style={{ fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <ArrowDownLeft size={12} />
                  <span>INPUT PAYLOAD</span>
                </div>
                {execResult?.inputs && (
                  <button
                    onClick={() => copyToClipboard(JSON.stringify(execResult.inputs, null, 2), 'inputs')}
                    style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--accent-orange)' }}
                  >
                    {copied === 'inputs' ? 'Copied' : 'Copy'}
                  </button>
                )}
              </div>
              <pre
                style={{
                  padding: 8,
                  background: '#FAF9F5',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 4,
                  fontSize: 11,
                  fontFamily: 'var(--font-mono)',
                  maxHeight: 140,
                  overflowY: 'auto'
                }}
              >
                {execResult?.inputs ? JSON.stringify(execResult.inputs, null, 2) : '// No input data yet'}
              </pre>
            </div>

            {/* Outputs Emitted */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <div style={{ fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <ArrowUpRight size={12} />
                  <span>OUTPUT RESULT</span>
                </div>
                {execResult?.output !== undefined && (
                  <button
                    onClick={() => copyToClipboard(JSON.stringify(execResult.output, null, 2), 'output')}
                    style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--accent-orange)' }}
                  >
                    {copied === 'output' ? 'Copied' : 'Copy JSON'}
                  </button>
                )}
              </div>
              <pre
                style={{
                  padding: 8,
                  background: '#FAF9F5',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 4,
                  fontSize: 11,
                  fontFamily: 'var(--font-mono)',
                  maxHeight: 180,
                  overflowY: 'auto'
                }}
              >
                {execResult?.output !== undefined ? JSON.stringify(execResult.output, null, 2) : '// Run workflow to inspect output'}
              </pre>
            </div>
          </div>
        )}

        {/* TAB 3: SPECS / DOCUMENTATION */}
        {activeTab === 'docs' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: 2 }}>
                TYPE IDENTIFIER
              </div>
              <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-primary)' }}>
                {definition.type}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: 2 }}>
                DESCRIPTION
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                {definition.description}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: 6 }}>
                CONNECTION PORTS
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                  <strong>Inputs:</strong> {definition.inputs.length === 0 ? 'None (Entry point)' : definition.inputs.map(p => `${p.id} (${p.type})`).join(', ')}
                </div>
                <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                  <strong>Outputs:</strong> {definition.outputs.map(p => `${p.id} (${p.type})`).join(', ')}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div
        style={{
          padding: '10px 14px',
          borderTop: '1px solid var(--border-subtle)',
          background: '#FAF9F5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
          Changes apply live to canvas
        </span>
        <button
          onClick={onClose}
          className="btn-secondary"
          style={{ fontSize: 11, padding: '4px 10px' }}
        >
          Done
        </button>
      </div>
    </div>
  );
};
