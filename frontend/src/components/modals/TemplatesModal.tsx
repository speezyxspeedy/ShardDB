import React from 'react';
import { X, Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import type { WorkflowTemplate } from '../../types';

interface TemplatesModalProps {
  isOpen: boolean;
  templates: WorkflowTemplate[];
  onSelectTemplate: (templateId: string) => void;
  onClose: () => void;
  isLoading: boolean;
}

export const TemplatesModal: React.FC<TemplatesModalProps> = ({
  isOpen,
  templates,
  onSelectTemplate,
  onClose,
  isLoading
}) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(32, 33, 31, 0.4)',
        backdropFilter: 'blur(4px)',
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
          maxWidth: 820,
          maxHeight: '85vh',
          background: '#FFFFFF',
          borderRadius: 4,
          border: '1px solid var(--border-strong)',
          boxShadow: 'var(--shadow-modal)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#FAF9F5'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 3,
                background: '#FFFFFF',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-orange)'
              }}
            >
              <Sparkles size={16} />
            </div>
            <div>
              <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--accent-orange)', fontWeight: 700 }}>
                [STARTER LIBRARY]
              </div>
              <h2 style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                Workflow Starter Templates
              </h2>
            </div>
          </div>

          <button onClick={onClose} className="btn-icon" style={{ width: 28, height: 28 }}>
            <X size={16} />
          </button>
        </div>

        {/* Modal Body / Templates Grid */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 14 }}>
            {templates.map(tpl => (
              <div
                key={tpl.id}
                style={{
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 4,
                  padding: '16px',
                  background: '#FFFFFF',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 12,
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--text-primary)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span
                      style={{
                        fontSize: 9,
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        color: 'var(--accent-cobalt)',
                        background: 'var(--accent-cobalt-subtle)',
                        padding: '2px 5px',
                        borderRadius: 2
                      }}
                    >
                      {tpl.category}
                    </span>
                    <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>
                      {tpl.nodes.length} Nodes
                    </span>
                  </div>

                  <h3 style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                    {tpl.name}
                  </h3>

                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.4 }}>
                    {tpl.description}
                  </p>
                </div>

                {/* Node Pipeline Preview */}
                <div style={{ background: '#FAF9F5', padding: '6px 10px', borderRadius: 3, border: '1px solid var(--border-subtle)', fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {tpl.nodes.map(n => n.data?.label || n.type).join(' → ')}
                </div>

                <button
                  onClick={() => onSelectTemplate(tpl.id)}
                  disabled={isLoading}
                  className="btn-primary"
                  style={{ width: '100%', justifyContent: 'center', fontSize: 11, padding: '7px 12px' }}
                >
                  {isLoading ? <Loader2 size={13} className="spin" /> : <ArrowRight size={13} />}
                  <span>Instantiate & Load Blueprint</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
