import React from 'react';
import { X, History, CheckCircle2, AlertCircle, Clock, Trash2 } from 'lucide-react';
import type { Execution } from '../../types';

interface HistoryModalProps {
  isOpen: boolean;
  executions: Execution[];
  onSelectExecution: (execution: Execution) => void;
  onClearHistory: () => void;
  onClose: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  executions,
  onSelectExecution,
  onClearHistory,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(4, 7, 14, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        padding: 20
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 680,
          maxHeight: '80vh',
          background: 'rgba(15, 23, 42, 0.98)',
          borderRadius: 16,
          border: '1px solid var(--border-medium)',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(18, 26, 45, 0.5)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'rgba(99, 102, 241, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#818cf8'
              }}
            >
              <History size={17} />
            </div>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: '#f8fafc' }}>
                Execution Run History ({executions.length})
              </h2>
              <p style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                Inspect previous workflow executions, timelines, and logs
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {executions.length > 0 && (
              <button
                onClick={() => {
                  if (confirm('Clear all execution history?')) {
                    onClearHistory();
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 11,
                  color: '#ef4444',
                  padding: '5px 10px',
                  borderRadius: 6,
                  background: 'rgba(239, 68, 68, 0.1)'
                }}
              >
                <Trash2 size={13} />
                <span>Clear All</span>
              </button>
            )}
            <button
              onClick={onClose}
              style={{ padding: 6, borderRadius: 6, color: 'var(--text-dim)' }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Executions List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {executions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-dim)', fontSize: 13 }}>
              No execution runs logged yet. Execute workflows to view timeline runs here.
            </div>
          ) : (
            executions.map(exec => {
              const isSuccess = exec.status === 'COMPLETED';

              return (
                <div
                  key={exec.id}
                  onClick={() => {
                    onSelectExecution(exec);
                    onClose();
                  }}
                  style={{
                    padding: '12px 16px',
                    borderRadius: 10,
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.4)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                    e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {isSuccess ? <CheckCircle2 size={18} color="#34d399" /> : <AlertCircle size={18} color="#ef4444" />}

                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9' }}>
                        {exec.workflow_name}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span>Trigger: {exec.triggered_by}</span>
                        <span>•</span>
                        <span>{Object.keys(exec.node_results || {}).length} nodes executed</span>
                        <span>•</span>
                        <span>{new Date(exec.started_at).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: 12,
                        fontWeight: 600,
                        color: '#38bdf8',
                        fontFamily: 'var(--font-mono)'
                      }}
                    >
                      <Clock size={13} />
                      <span>{exec.duration_ms}ms</span>
                    </div>

                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 6,
                        background: isSuccess ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: isSuccess ? '#34d399' : '#f87171'
                      }}
                    >
                      {exec.status}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
