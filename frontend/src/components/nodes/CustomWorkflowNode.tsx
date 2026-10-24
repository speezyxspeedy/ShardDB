import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import {
  Play,
  FileText,
  GitBranch,
  Sparkles,
  Clock,
  Download,
  Bell,
  Calculator,
  Globe,
  Smile,
  ScrollText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  HelpCircle,
  Hash
} from 'lucide-react';
import type { CustomNodeType } from '../../types';

// Map icon names to Lucide icons
const ICON_MAP: Record<string, React.FC<{ size?: number; className?: string; style?: React.CSSProperties }>> = {
  Play,
  FileText,
  GitBranch,
  Sparkles,
  Clock,
  Download,
  Bell,
  Calculator,
  Globe,
  Smile,
  ScrollText,
  Hash
};

// Swiss Editorial & Industrial Blueprint Category Accents
const CATEGORY_STYLES: Record<string, { tag: string; border: string; accent: string; bg: string }> = {
  Trigger: { tag: 'TRIGGER', border: '#FF5A1F', accent: '#FF5A1F', bg: 'rgba(255, 90, 31, 0.08)' },
  Input: { tag: 'INPUT', border: '#315BDB', accent: '#315BDB', bg: 'rgba(49, 91, 219, 0.08)' },
  Logic: { tag: 'LOGIC', border: '#D97706', accent: '#D97706', bg: 'rgba(217, 119, 6, 0.08)' },
  Transform: { tag: 'TRANSFORM', border: '#FF5A1F', accent: '#FF5A1F', bg: 'rgba(255, 90, 31, 0.08)' },
  Aggregator: { tag: 'AGGREGATE', border: '#315BDB', accent: '#315BDB', bg: 'rgba(49, 91, 219, 0.08)' },
  Output: { tag: 'OUTPUT', border: '#1B7F48', accent: '#1B7F48', bg: 'rgba(27, 127, 72, 0.08)' }
};

export const CustomWorkflowNode = memo(({ id, data, selected }: NodeProps<CustomNodeType>) => {
  const nodeType = data.type || (id.startsWith('tp-node-1') ? 'manual_trigger' : 'transform_text');
  const category = data.category || (nodeType.includes('trigger') ? 'Trigger' : (nodeType.includes('output') ? 'Output' : (nodeType.includes('condition') || nodeType.includes('delay') ? 'Logic' : 'Transform')));
  const styleConfig = CATEGORY_STYLES[category] || CATEGORY_STYLES.Transform;
  
  const status = data.status || 'IDLE';
  const execResult = data.executionResult;

  const IconComponent = (data.icon && ICON_MAP[data.icon]) || (
    nodeType === 'manual_trigger' ? Play :
    nodeType === 'text_input' ? FileText :
    nodeType === 'condition' ? GitBranch :
    nodeType === 'text_transform' || nodeType === 'transform_text' ? Sparkles :
    nodeType === 'delay' ? Clock :
    nodeType === 'output' ? Download :
    nodeType === 'notification_simulator' || nodeType === 'notification_mock' ? Bell :
    HelpCircle
  );

  const isCondition = nodeType === 'condition' || id.includes('condition');
  const isTrigger = category === 'Trigger' || nodeType === 'manual_trigger' || nodeType === 'webhook_trigger';

  // Preview snippet based on configured data
  const renderPreview = () => {
    if (nodeType === 'manual_trigger') {
      return (
        <span style={{ fontSize: 11, color: '#777970', fontFamily: 'var(--font-mono)' }}>
          Click Run to trigger
        </span>
      );
    }
    if (nodeType === 'text_input') {
      const text = data.text || '';
      return (
        <div style={{ fontSize: 11, color: '#20211F', fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 190 }}>
          "{text.length > 24 ? text.substring(0, 24) + '...' : text}"
        </div>
      );
    }
    if (nodeType === 'condition') {
      return (
        <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: '#D97706', fontWeight: 600 }}>
          {data.operator || 'equals'} "{data.target_value ?? ''}"
        </span>
      );
    }
    if (nodeType === 'text_transform' || nodeType === 'transform_text') {
      return (
        <span style={{ fontSize: 10, padding: '2px 6px', background: '#F4F1E8', color: '#20211F', borderRadius: 2, fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
          {data.operation || 'uppercase'}
        </span>
      );
    }
    if (nodeType === 'delay') {
      return (
        <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: '#777970' }}>
          wait {data.delay_seconds ?? (data.delay_ms ? data.delay_ms / 1000 : 0.5)}s
        </span>
      );
    }
    if (nodeType === 'output') {
      return (
        <span style={{ fontSize: 10, padding: '2px 6px', background: 'rgba(27, 127, 72, 0.08)', color: '#1B7F48', borderRadius: 2, fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
          JSON / Terminal Result
        </span>
      );
    }
    if (nodeType === 'notification_simulator' || nodeType === 'notification_mock') {
      return (
        <span style={{ fontSize: 10, padding: '2px 6px', background: 'rgba(49, 91, 219, 0.08)', color: '#315BDB', borderRadius: 2, fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
          SIMULATOR • {data.channel || 'Slack'}
        </span>
      );
    }
    return null;
  };

  // Status border & background styling
  let borderColor = selected ? 'var(--text-primary)' : 'var(--border-subtle)';
  let boxShadow = selected ? '0 0 0 2px var(--text-primary), 0 4px 12px rgba(32, 33, 31, 0.08)' : '0 1px 3px rgba(32, 33, 31, 0.04)';

  if (status === 'RUNNING') {
    borderColor = 'var(--accent-cobalt)';
    boxShadow = '0 0 0 2px var(--accent-cobalt), 0 4px 16px rgba(49, 91, 219, 0.15)';
  } else if (status === 'FAILED') {
    borderColor = 'var(--status-error)';
    boxShadow = '0 0 0 2px var(--status-error), 0 4px 16px rgba(217, 45, 32, 0.15)';
  } else if (status === 'COMPLETED') {
    borderColor = selected ? 'var(--text-primary)' : '#C9C5B8';
  }

  return (
    <div
      style={{
        width: 230,
        background: '#FFFFFF',
        border: `1px solid ${borderColor}`,
        borderRadius: 4,
        boxShadow,
        position: 'relative',
        transition: 'all 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
        opacity: status === 'SKIPPED' ? 0.5 : 1
      }}
    >
      {/* Top Technical Accent Line */}
      <div
        style={{
          height: 3,
          background: styleConfig.accent,
          borderTopLeftRadius: 3,
          borderTopRightRadius: 3,
          width: '100%'
        }}
      />

      {/* Input Handle (Left) - Non-trigger nodes */}
      {!isTrigger && (
        <Handle
          type="target"
          position={Position.Left}
          id="input"
          style={{
            top: 28,
            left: -6,
            background: '#FFFFFF',
            borderColor: 'var(--text-primary)'
          }}
        />
      )}

      {/* Card Header */}
      <div
        style={{
          padding: '8px 10px 6px 10px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#FAF9F5'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: 3,
              background: '#FFFFFF',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: styleConfig.accent
            }}
          >
            <IconComponent size={13} />
          </div>
          <div>
            <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', letterSpacing: '0.05em' }}>
              [{styleConfig.tag}]
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>
              {data.label || nodeType}
            </div>
          </div>
        </div>

        {/* Status Indicator */}
        <div>
          {status === 'RUNNING' && <Loader2 size={13} className="spin" style={{ color: 'var(--accent-cobalt)' }} />}
          {status === 'COMPLETED' && <CheckCircle2 size={13} style={{ color: 'var(--status-success)' }} />}
          {status === 'FAILED' && <AlertCircle size={13} style={{ color: 'var(--status-error)' }} />}
          {status === 'IDLE' && (
            <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>
              #{id.replace('node-', '')}
            </span>
          )}
        </div>
      </div>

      {/* Card Body / Preview */}
      <div style={{ padding: '8px 10px', minHeight: 34, display: 'flex', alignItems: 'center' }}>
        {renderPreview()}
      </div>

      {/* Execution Results Footer if present */}
      {execResult && execResult.duration_ms !== undefined && (
        <div
          style={{
            padding: '4px 10px',
            borderTop: '1px solid var(--border-subtle)',
            background: status === 'FAILED' ? 'var(--status-error-bg)' : '#FAF9F5',
            fontSize: 10,
            fontFamily: 'var(--font-mono)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: status === 'FAILED' ? 'var(--status-error)' : 'var(--text-secondary)'
          }}
        >
          <span>{status}</span>
          <span>{execResult.duration_ms}ms</span>
        </div>
      )}

      {/* Output Handles */}
      {isCondition ? (
        <>
          {/* True Handle (Upper Right) */}
          <Handle
            type="source"
            position={Position.Right}
            id="true"
            style={{
              top: 24,
              right: -6,
              background: '#FFFFFF',
              borderColor: 'var(--status-success)'
            }}
          />
          <div
            style={{
              position: 'absolute',
              right: 8,
              top: 17,
              fontSize: 9,
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              color: 'var(--status-success)',
              pointerEvents: 'none'
            }}
          >
            TRUE →
          </div>

          {/* False Handle (Lower Right) */}
          <Handle
            type="source"
            position={Position.Right}
            id="false"
            style={{
              top: 48,
              right: -6,
              background: '#FFFFFF',
              borderColor: 'var(--status-error)'
            }}
          />
          <div
            style={{
              position: 'absolute',
              right: 8,
              top: 41,
              fontSize: 9,
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              color: 'var(--status-error)',
              pointerEvents: 'none'
            }}
          >
            FALSE →
          </div>
        </>
      ) : (
        /* Standard Output Handle */
        <Handle
          type="source"
          position={Position.Right}
          id="output"
          style={{
            top: 28,
            right: -6,
            background: '#FFFFFF',
            borderColor: 'var(--text-primary)'
          }}
        />
      )}
    </div>
  );
});

CustomWorkflowNode.displayName = 'CustomWorkflowNode';
