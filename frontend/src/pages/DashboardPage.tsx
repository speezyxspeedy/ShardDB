import React, { useState } from 'react';
import {
  Plus,
  Search,
  Copy,
  Trash2,
  ExternalLink,
  Play,
  Clock,
  Activity,
  CheckCircle2,
  Sparkles,
  Workflow as WorkflowIcon,
  Filter
} from 'lucide-react';
import type { Workflow, SystemStats } from '../types';

interface DashboardPageProps {
  workflows: Workflow[];
  stats: SystemStats | null;
  onOpenWorkflow: (workflow: Workflow) => void;
  onViewDetails: (workflow: Workflow) => void;
  onCreateNew: () => void;
  onDuplicateWorkflow: (workflowId: string) => void;
  onDeleteWorkflow: (workflowId: string) => void;
  onQuickRun: (workflow: Workflow) => void;
  onOpenTemplates: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  workflows,
  stats,
  onOpenWorkflow,
  onViewDetails,
  onCreateNew,
  onDuplicateWorkflow,
  onDeleteWorkflow,
  onQuickRun,
  onOpenTemplates
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Extract categories
  const categories = ['All', ...Array.from(new Set(workflows.map(w => w.category).filter(Boolean)))];

  // Filter workflows
  const filteredWorkflows = workflows.filter(w => {
    const matchesSearch =
      w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (w.description && w.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (w.tags && w.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase())));

    const matchesCategory = selectedCategory === 'All' || w.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const confirmDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeletingId(id);
  };

  const executeDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onDeleteWorkflow(id);
    setDeletingId(null);
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
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Editorial Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 16 }}>
          <div>
            <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--accent-orange)', fontWeight: 700, letterSpacing: '0.06em', marginBottom: 4 }}>
              SYSTEM OVERVIEW • AUTOMATED PIPELINES
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
              Workflow Dashboard
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
              Inspect, orchestrate, and execute deterministic local workflow blueprints.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onOpenTemplates} className="btn-secondary" style={{ padding: '8px 14px' }}>
              <Sparkles size={14} color="var(--accent-orange)" />
              <span>Browse Templates</span>
            </button>
            <button onClick={onCreateNew} className="btn-primary" style={{ padding: '8px 16px' }}>
              <Plus size={15} />
              <span>Create Workflow</span>
            </button>
          </div>
        </div>

        {/* Real DB Metrics Bar */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 16
          }}
        >
          {/* Card 1: Workflows */}
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid var(--border-subtle)',
              borderRadius: 4,
              padding: '16px 18px',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', fontWeight: 600 }}>
                SAVED BLUEPRINTS
              </span>
              <WorkflowIcon size={16} color="var(--accent-orange)" />
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
              {stats ? stats.total_workflows : workflows.length}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>
              Active in local SQLite store
            </div>
          </div>

          {/* Card 2: Total Executions */}
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid var(--border-subtle)',
              borderRadius: 4,
              padding: '16px 18px',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', fontWeight: 600 }}>
                TOTAL EXECUTIONS
              </span>
              <Activity size={16} color="var(--accent-cobalt)" />
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
              {stats ? stats.total_executions : 0}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>
              Persisted with step audit traces
            </div>
          </div>

          {/* Card 3: Success Rate */}
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid var(--border-subtle)',
              borderRadius: 4,
              padding: '16px 18px',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', fontWeight: 600 }}>
                SUCCESS RATE
              </span>
              <CheckCircle2 size={16} color="var(--status-success)" />
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--status-success)' }}>
              {stats ? `${stats.success_rate_pct}%` : '100%'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>
              {stats ? `${stats.successful_executions} successful, ${stats.failed_executions} failed` : 'All runs operational'}
            </div>
          </div>

          {/* Card 4: Avg Runtime */}
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid var(--border-subtle)',
              borderRadius: 4,
              padding: '16px 18px',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', fontWeight: 600 }}>
                AVG LATENCY
              </span>
              <Clock size={16} color="var(--text-dim)" />
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
              {stats ? `${stats.avg_duration_ms}ms` : '0ms'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>
              Deterministic in-process engine
            </div>
          </div>
        </div>

        {/* Search & Category Filter Toolbar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap'
          }}
        >
          {/* Search Box */}
          <div style={{ position: 'relative', width: 300 }}>
            <Search
              size={14}
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
              placeholder="Filter workflows by name or tag..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                paddingLeft: 32,
                background: '#FFFFFF',
                borderRadius: 4
              }}
            />
          </div>

          {/* Category Filter Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <Filter size={13} style={{ color: 'var(--text-dim)', marginRight: 2 }} />
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '5px 10px',
                  borderRadius: 4,
                  fontSize: 11,
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 600,
                  background: selectedCategory === cat ? 'var(--text-primary)' : '#FFFFFF',
                  color: selectedCategory === cat ? '#FFFFFF' : 'var(--text-secondary)',
                  border: '1px solid var(--border-subtle)',
                  transition: 'all 0.15s ease'
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Workflow Grid */}
        {filteredWorkflows.length === 0 ? (
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
                background: 'var(--accent-orange-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-orange)'
              }}
            >
              <WorkflowIcon size={24} />
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
              {searchTerm ? 'No workflows match your search query' : 'No workflows in database yet'}
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', maxWidth: 420 }}>
              {searchTerm
                ? 'Try clearing your search keyword or switching category filters.'
                : 'Get started by creating a clean workflow canvas or load one of our industrial blueprint starter templates.'}
            </p>
            <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
              {searchTerm ? (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('All');
                  }}
                  className="btn-secondary"
                >
                  Clear Filters
                </button>
              ) : (
                <>
                  <button onClick={onOpenTemplates} className="btn-secondary">
                    <Sparkles size={14} color="var(--accent-orange)" />
                    <span>Load Starter Template</span>
                  </button>
                  <button onClick={onCreateNew} className="btn-primary">
                    <Plus size={14} />
                    <span>Create Blank Workflow</span>
                  </button>
                </>
              )}
            </div>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
              gap: 18
            }}
          >
            {filteredWorkflows.map(wf => {
              const nodeCount = wf.nodes?.length || 0;
              const edgeCount = wf.edges?.length || 0;
              const updatedTime = wf.updated_at
                ? new Date(wf.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                : 'Recently';

              const isConfirmingDelete = deletingId === wf.id;

              return (
                <div
                  key={wf.id}
                  onClick={() => onOpenWorkflow(wf)}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 4,
                    padding: '18px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: 14,
                    cursor: 'pointer',
                    boxShadow: 'var(--shadow-sm)',
                    transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                    position: 'relative'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'var(--text-primary)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--border-subtle)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                  }}
                >
                  {/* Card Header */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
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
                        {wf.category || 'GENERAL'}
                      </span>

                      <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>
                        {nodeCount} NODES • {edgeCount} EDGES
                      </span>
                    </div>

                    <h3
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        fontFamily: 'var(--font-display)',
                        color: 'var(--text-primary)',
                        lineHeight: 1.3
                      }}
                    >
                      {wf.name}
                    </h3>

                    <p
                      style={{
                        fontSize: 12,
                        color: 'var(--text-secondary)',
                        marginTop: 6,
                        lineHeight: 1.4,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}
                    >
                      {wf.description || 'No description provided.'}
                    </p>
                  </div>

                  {/* Tags */}
                  {wf.tags && wf.tags.length > 0 && (
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {wf.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          style={{
                            fontSize: 10,
                            fontFamily: 'var(--font-mono)',
                            color: 'var(--text-secondary)',
                            background: '#FAF9F5',
                            border: '1px solid var(--border-subtle)',
                            padding: '1px 5px',
                            borderRadius: 2
                          }}
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Card Footer / Actions */}
                  <div
                    style={{
                      borderTop: '1px solid var(--border-subtle)',
                      paddingTop: 12,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>
                      Updated {updatedTime}
                    </span>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={e => e.stopPropagation()}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onQuickRun(wf);
                        }}
                        title="Quick Run (execute on engine)"
                        className="btn-secondary"
                        style={{ padding: '4px 8px', fontSize: 11 }}
                      >
                        <Play size={11} fill="var(--text-primary)" />
                        <span>Run</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewDetails(wf);
                        }}
                        title="View workflow metadata & executions"
                        className="btn-icon"
                        style={{ width: 28, height: 28 }}
                      >
                        <ExternalLink size={13} />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDuplicateWorkflow(wf.id);
                        }}
                        title="Duplicate workflow"
                        className="btn-icon"
                        style={{ width: 28, height: 28 }}
                      >
                        <Copy size={13} />
                      </button>

                      {isConfirmingDelete ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <button
                            onClick={(e) => executeDelete(e, wf.id)}
                            style={{
                              padding: '2px 8px',
                              background: 'var(--status-error)',
                              color: '#FFFFFF',
                              borderRadius: 3,
                              fontSize: 10,
                              fontFamily: 'var(--font-mono)',
                              fontWeight: 700
                            }}
                          >
                            CONFIRM
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingId(null);
                            }}
                            style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => confirmDelete(e, wf.id)}
                          title="Delete workflow"
                          className="btn-icon"
                          style={{ width: 28, height: 28, color: 'var(--status-error)' }}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
