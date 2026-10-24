import React, { memo } from 'react';
import { BaseEdge, EdgeLabelRenderer, getBezierPath } from '@xyflow/react';
import type { EdgeProps } from '@xyflow/react';

export const CustomGlowingEdge = memo(({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  selected,
  label
}: EdgeProps) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const isTrueBranch = id.includes('true') || label?.toString().toLowerCase().includes('true');
  const isFalseBranch = id.includes('false') || label?.toString().toLowerCase().includes('false');

  let strokeColor = '#D5D1C7';

  if (isTrueBranch) {
    strokeColor = 'var(--status-success)';
  } else if (isFalseBranch) {
    strokeColor = 'var(--status-error)';
  } else if (selected) {
    strokeColor = 'var(--accent-orange)';
  }

  const customStyle: React.CSSProperties = {
    strokeWidth: selected ? 2.5 : 1.5,
    stroke: strokeColor,
    ...style
  };

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={customStyle} />
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              background: '#FFFFFF',
              padding: '2px 6px',
              borderRadius: 3,
              fontSize: 9,
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              color: isTrueBranch ? 'var(--status-success)' : (isFalseBranch ? 'var(--status-error)' : 'var(--text-secondary)'),
              border: `1px solid ${strokeColor}`,
              pointerEvents: 'all',
              boxShadow: 'var(--shadow-sm)',
              userSelect: 'none'
            }}
            className="nodrag nopan"
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
});

CustomGlowingEdge.displayName = 'CustomGlowingEdge';
