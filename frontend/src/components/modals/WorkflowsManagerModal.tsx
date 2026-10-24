import React, { useState } from 'react';
import { X, FolderOpen, Plus, Trash2, ArrowRight, Clock, Search } from 'lucide-react';
import type { Workflow } from '../../types';

interface WorkflowsManagerModalProps {
  isOpen: boolean;
  workflows: Workflow[];
  currentWorkflowId?: string;
  onSelectWorkflow: (workflowId: string) => void;
  onCreateNewWorkflow: () => void;
  onDeleteWorkflow: (workflowId: string) => void;
  onClose: () => void;
}

export const WorkflowsManagerModal: React.FC<WorkflowsManagerModalProps> = ({
  isOpen,
  workflows,
  currentWorkflowId,
  onSelectWorkflow,
  onCreateNewWorkflow,
  onDeleteWorkflow,
  onClose
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filteredWorkflows = workflows.filter(w =>
    w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (w.description && w.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
                background: 'rgba(14, 165, 233, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#38bdf8'
              }}
            >
              <FolderOpen size={17} />
            </div>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: '#f8fafc' }}>
                Saved Workflows ({workflows.length})
              </h2>
              <p style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                Switch between saved pipelines or create a new visual canvas
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => {
                onCreateNewWorkflow();
                onClose();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 6,
                background: '#6366f1',
                color: '#fff',
                fontSize: 12,
                fontWeight: 600,
                transition: 'background 0.15s ease'
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#4f46e5'}
              onMouseLeave={e => e.currentTarget.style.background = '#6366f1'}
            >
              <Plus size={14} />
              <span>New Flow</span>
            </button>
            <button
              onClick={onClose}
              style={{ padding: 6, borderRadius: 6, color: 'var(--text-dim)' }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Search */}
        <div style={{ padding: '12px 20px 0 20px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
            <input
              type="text"
              placeholder="Search workflows..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ width: '100%', paddingLeft: 30 }}
            />
          </div>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filteredWorkflows.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-dim)', fontSize: 13 }}>
              No workflows found matching your search.
            </div>
          ) : (
            filteredWorkflows.map(wf => {
              const isCurrent = wf.id === currentWorkflowId;

              return (
                <div
                  key={wf.id}
                  style={{
                    padding: '12px 16px',
                    borderRadius: 10,
                    background: isCurrent ? 'rgba(99, 102, 241, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                    border: `1px solid ${isCurrent ? 'rgba(99, 102, 241, 0.4)' : 'var(--border-subtle)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ overflow: 'hidden', paddingRight: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9' }}>
                        {wf.name}
                      </span>
                      {isCurrent && (
                        <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: '#6366f1', color: '#fff', fontWeight: 600 }}>
                          Current
                        </span>
                      )}
                    </div>
                    {wf.description && (
                      <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {wf.description}
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6, fontSize: 10, color: 'var(--text-dim)' }}>
                      <span>{wf.nodes?.length ?? 0} nodes</span>
                      <span>•</span>
                      <span>{wf.edges?.length ?? 0} connections</span>
                      <span>•</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Clock size={11} />
                        <span>{new Date(wf.updated_at).toLocaleDateString()}</span>
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    {!isCurrent && (
                      <button
                        onClick={() => {
                          onSelectWorkflow(wf.id);
                          onClose();
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '6px 12px',
                          borderRadius: 6,
                          background: 'rgba(255, 255, 255, 0.06)',
                          color: '#f1f5f9',
                          fontSize: 12,
                          fontWeight: 500,
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = '#6366f1';
                          e.currentTarget.style.color = '#fff';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                          e.currentTarget.style.color = '#f1f5f9';
                        }}
                      >
                        <span>Open</span>
                        <ArrowRight size={13} />
                      </button>
                    )}

                    <button
                      onClick={() => {
                        if (confirm(`Delete workflow "${wf.name}"?`)) {
                          onDeleteWorkflow(wf.id);
                        }
                      }}
                      title="Delete workflow"
                      style={{
                        padding: 7,
                        borderRadius: 6,
                        color: 'var(--text-dim)',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.color = '#ef4444';
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.color = 'var(--text-dim)';
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
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
