import React from 'react';
import {
  ArrowLeft,
  Play,
  Edit2,
  Copy,
  Trash2
} from 'lucide-react';
import type { Workflow, Execution } from '../types';

interface WorkflowDetailsPageProps {
  workflow: Workflow | null;
  recentExecutions: Execution[];
  onBackToDashboard: () => void;
  onOpenInEditor: (workflow: Workflow) => void;
  onRunWorkflow: (workflow: Workflow) => void;
  onDuplicateWorkflow: (workflowId: string) => void;
  onDeleteWorkflow: (workflowId: string) => void;
}

export const WorkflowDetailsPage: React.FC<WorkflowDetailsPageProps> = ({
  workflow,
  recentExecutions,
  onBackToDashboard,
  onOpenInEditor,
  onRunWorkflow,
  onDuplicateWorkflow,
  onDeleteWorkflow
}) => {
  if (!workflow) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <p>No workflow selected.</p>
        <button onClick={onBackToDashboard} className="btn-secondary" style={{ marginTop: 12 }}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  const nodeCount = workflow.nodes?.length || 0;
  const edgeCount = workflow.edges?.length || 0;
  const createdDate = workflow.created_at ? new Date(workflow.created_at).toLocaleString() : 'N/A';
  const updatedDate = workflow.updated_at ? new Date(workflow.updated_at).toLocaleString() : 'N/A';

  const runsForThisWorkflow = recentExecutions.filter(e => e.workflow_id === workflow.id);

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
      <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Back Link */}
        <button
          onClick={onBackToDashboard}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-secondary)'
          }}
        >
          <ArrowLeft size={14} />
          <span>Back to Workflows Dashboard</span>
        </button>

        {/* Workflow Title & Action Bar */}
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid var(--border-subtle)',
            borderRadius: 4,
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span
                style={{
                  fontSize: 9,
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: 'var(--accent-cobalt)',
                  background: 'var(--accent-cobalt-subtle)',
                  padding: '2px 6px',
                  borderRadius: 2
                }}
              >
                {workflow.category || 'GENERAL'}
              </span>
              <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>
                ID: {workflow.id}
              </span>
            </div>

            <h1 style={{ fontSize: 24, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
              {workflow.name}
            </h1>

            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 6, maxWidth: 640 }}>
              {workflow.description || 'No description provided.'}
            </p>

            {/* Tags */}
            {workflow.tags && workflow.tags.length > 0 && (
              <div style={{ display: 'flex', gap: 4, marginTop: 10 }}>
                {workflow.tags.map((t, i) => (
                  <span
                    key={i}
                    style={{
                      fontSize: 10,
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--text-secondary)',
                      background: '#FAF9F5',
                      border: '1px solid var(--border-subtle)',
                      padding: '2px 6px',
                      borderRadius: 2
                    }}
                  >
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => onRunWorkflow(workflow)} className="btn-primary" style={{ padding: '8px 14px' }}>
              <Play size={13} fill="#FFFFFF" />
              <span>Run Now</span>
            </button>

            <button onClick={() => onOpenInEditor(workflow)} className="btn-secondary" style={{ padding: '8px 14px' }}>
              <Edit2 size={13} />
              <span>Edit in Canvas</span>
            </button>

            <button
              onClick={() => onDuplicateWorkflow(workflow.id)}
              title="Duplicate workflow"
              className="btn-icon"
              style={{ width: 34, height: 34, border: '1px solid var(--border-subtle)' }}
            >
              <Copy size={14} />
            </button>

            <button
              onClick={() => {
                if (window.confirm(`Delete workflow "${workflow.name}"?`)) {
                  onDeleteWorkflow(workflow.id);
                  onBackToDashboard();
                }
              }}
              title="Delete workflow"
              className="btn-icon"
              style={{ width: 34, height: 34, border: '1px solid var(--border-subtle)', color: 'var(--status-error)' }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Technical Blueprint Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          <div style={{ background: '#FFFFFF', border: '1px solid var(--border-subtle)', borderRadius: 4, padding: 14 }}>
            <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
              NODE COUNT
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-display)', marginTop: 4 }}>
              {nodeCount}
            </div>
          </div>

          <div style={{ background: '#FFFFFF', border: '1px solid var(--border-subtle)', borderRadius: 4, padding: 14 }}>
            <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
              CONNECTION EDGES
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-display)', marginTop: 4 }}>
              {edgeCount}
            </div>
          </div>

          <div style={{ background: '#FFFFFF', border: '1px solid var(--border-subtle)', borderRadius: 4, padding: 14 }}>
            <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
              CREATED AT
            </div>
            <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', marginTop: 4, color: 'var(--text-primary)' }}>
              {createdDate}
            </div>
          </div>

          <div style={{ background: '#FFFFFF', border: '1px solid var(--border-subtle)', borderRadius: 4, padding: 14 }}>
            <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
              LAST MODIFIED
            </div>
            <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', marginTop: 4, color: 'var(--text-primary)' }}>
              {updatedDate}
            </div>
          </div>
        </div>

        {/* Nodes In Graph List */}
        <div style={{ background: '#FFFFFF', border: '1px solid var(--border-subtle)', borderRadius: 4, padding: '16px 20px' }}>
          <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 12 }}>
            CONFIGURED NODES IN GRAPH ({nodeCount})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {workflow.nodes?.map(node => (
              <div
                key={node.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  background: '#FAF9F5',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 3,
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: 'var(--text-dim)' }}>#{node.id}</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {node.data?.label || node.type}
                  </span>
                </div>
                <span style={{ color: 'var(--text-secondary)' }}>
                  [{node.type}]
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Executions specifically for this workflow */}
        <div style={{ background: '#FFFFFF', border: '1px solid var(--border-subtle)', borderRadius: 4, padding: '16px 20px' }}>
          <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 12 }}>
            RECENT EXECUTIONS FOR THIS WORKFLOW ({runsForThisWorkflow.length})
          </div>

          {runsForThisWorkflow.length === 0 ? (
            <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-dim)', fontStyle: 'italic', fontSize: 12 }}>
              No recorded runs for this workflow yet. Click "Run Now" to test.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 11, fontFamily: 'var(--font-mono)' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '6px 8px' }}>RUN ID</th>
                  <th style={{ padding: '6px 8px' }}>STATUS</th>
                  <th style={{ padding: '6px 8px' }}>STARTED</th>
                  <th style={{ padding: '6px 8px' }}>LATENCY</th>
                </tr>
              </thead>
              <tbody>
                {runsForThisWorkflow.slice(0, 8).map(run => (
                  <tr key={run.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '8px' }}>{run.id.substring(0, 8)}...</td>
                    <td style={{ padding: '8px' }}>
                      <span className={`badge badge-${run.status.toLowerCase()}`}>{run.status}</span>
                    </td>
                    <td style={{ padding: '8px', color: 'var(--text-secondary)' }}>{run.started_at ? run.started_at.substring(0, 19) : ''}</td>
                    <td style={{ padding: '8px' }}>{run.duration_ms} ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
