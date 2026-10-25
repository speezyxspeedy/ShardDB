import React, { useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { ComposeGraphNode, ComposeGraphEdge } from '../../types';
import { ServiceNode } from './ServiceNode';

interface ComposeGraphProps {
  nodesData: ComposeGraphNode[];
  edgesData: ComposeGraphEdge[];
  onSelectService: (serviceName: string) => void;
  selectedServiceName?: string | null;
}

const nodeTypes = {
  serviceNode: ServiceNode,
};

export const ComposeGraph: React.FC<ComposeGraphProps> = ({
  nodesData,
  edgesData,
  onSelectService,
  selectedServiceName,
}) => {
  // Convert backend nodes into React Flow nodes with auto-layout coordinates
  const flowNodes: Node[] = useMemo(() => {
    const total = nodesData.length;
    return nodesData.map((node, index) => {
      // Calculate a nice hierarchical / grid layout
      const col = index % 3;
      const row = Math.floor(index / 3);
      const x = 50 + col * 300;
      const y = 50 + row * 180;

      return {
        id: node.id,
        type: 'serviceNode',
        position: { x, y },
        data: {
          ...node,
          onSelect: onSelectService,
        },
        selected: selectedServiceName === node.name || selectedServiceName === node.id,
      };
    });
  }, [nodesData, onSelectService, selectedServiceName]);

  // Convert backend edges into React Flow edges
  const flowEdges: Edge[] = useMemo(() => {
    return edgesData.map((edge) => {
      const isValid = edge.is_valid;
      return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: 'smoothstep',
        animated: !isValid,
        label: isValid ? 'depends_on' : 'broken dependency',
        labelStyle: {
          fill: isValid ? 'var(--text-muted)' : 'var(--color-error)',
          fontSize: 10,
          fontFamily: 'var(--font-mono)',
        },
        labelBgStyle: {
          fill: 'var(--bg-secondary)',
          stroke: isValid ? 'var(--border-color)' : 'var(--color-error)',
          strokeWidth: 1,
        },
        style: {
          stroke: isValid ? 'var(--docker-blue)' : 'var(--color-error)',
          strokeWidth: isValid ? 2 : 2.5,
          strokeDasharray: isValid ? undefined : '5,5',
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isValid ? 'var(--docker-blue)' : 'var(--color-error)',
          width: 14,
          height: 14,
        },
      };
    });
  }, [edgesData]);

  if (nodesData.length === 0) {
    return (
      <div
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted)',
          backgroundColor: 'var(--bg-main)',
        }}
      >
        <p>No services defined in the current Compose file.</p>
        <p style={{ fontSize: '11px', marginTop: '4px' }}>
          Paste or load a Compose specification to render the dependency graph.
        </p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', backgroundColor: 'var(--bg-main)' }}>
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.2}
        maxZoom={2}
      >
        <Background color="#303842" gap={24} size={1} />
        <Controls
          style={{
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            fill: 'var(--text-primary)',
          }}
        />
        <MiniMap
          nodeColor={(n) => {
            if (n.data?.status === 'missing_dependency') return '#FF6B6B';
            return '#2496ED';
          }}
          style={{
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
          }}
        />
      </ReactFlow>
    </div>
  );
};
