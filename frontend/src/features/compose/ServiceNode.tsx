import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Network, AlertTriangle, AlertCircle, Box, ArrowRight } from 'lucide-react';
import { ComposeGraphNode } from '../../types';

interface ServiceNodeProps {
  data: ComposeGraphNode & {
    onSelect: (serviceName: string) => void;
  };
  selected: boolean;
}

export const ServiceNode = memo(({ data, selected }: ServiceNodeProps) => {
  const isMissing = data.status === 'missing_dependency';
  const hasIssues = data.issues_count > 0 || isMissing;

  return (
    <div
      className={`service-flow-node ${selected ? 'selected' : ''} ${isMissing ? 'broken' : ''}`}
      onClick={() => data.onSelect(data.name.replace(' (Missing)', ''))}
      style={{
        cursor: 'pointer',
      }}
    >
      {/* React Flow Handles for incoming and outgoing edges */}
      <Handle
        type="target"
        position={Position.Top}
        style={{
          background: isMissing ? 'var(--color-error)' : 'var(--docker-blue)',
          width: 8,
          height: 8,
          border: '1px solid #FFFFFF',
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {isMissing ? (
            <AlertCircle size={16} color="var(--color-error)" />
          ) : (
            <Box size={16} color="var(--docker-blue)" />
          )}
          <span style={{ fontWeight: 600, fontSize: '13px', color: isMissing ? 'var(--color-error)' : 'var(--text-primary)' }}>
            {data.name}
          </span>
        </div>

        {hasIssues && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px',
              padding: '1px 5px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '10px',
              fontWeight: 600,
              backgroundColor: isMissing ? 'var(--color-error-bg)' : 'var(--color-warning-bg)',
              color: isMissing ? 'var(--color-error)' : 'var(--color-warning)',
              border: `1px solid ${isMissing ? 'var(--color-error)' : 'var(--color-warning)'}`,
            }}
          >
            <AlertTriangle size={10} />
            {isMissing ? 'Missing' : `${data.issues_count} issue${data.issues_count > 1 ? 's' : ''}`}
          </span>
        )}
      </div>

      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
        <span style={{ color: 'var(--text-muted)' }}>Image: </span>
        <span className="mono" style={{ color: 'var(--text-primary)' }}>
          {data.image || '(build context)'}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '10px' }}>
        <span style={{ color: 'var(--text-muted)' }}>
          {data.ports && data.ports.length > 0 ? (
            <span className="mono" style={{ color: 'var(--accent-lime)' }}>
              ports: {data.ports.slice(0, 2).join(', ')}
            </span>
          ) : (
            'No ports published'
          )}
        </span>

        {data.dependency_count > 0 && (
          <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '2px' }}>
            deps: {data.dependency_count}
          </span>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          background: 'var(--accent-lime)',
          width: 8,
          height: 8,
          border: '1px solid #FFFFFF',
        }}
      />
    </div>
  );
});
