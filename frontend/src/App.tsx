import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  BackgroundVariant
} from '@xyflow/react';
import type { Connection, NodeChange, EdgeChange } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { CustomWorkflowNode } from './components/nodes/CustomWorkflowNode';
import { CustomGlowingEdge } from './components/edges/CustomGlowingEdge';
import { HeaderToolbar } from './components/layout/HeaderToolbar';
import { NavigationRail } from './components/layout/NavigationRail';
import { NodeCatalogSidebar } from './components/sidebar/NodeCatalogSidebar';
import { NodeInspectorPanel } from './components/inspector/NodeInspectorPanel';
import { ExecutionConsole } from './components/debugger/ExecutionConsole';
import { TemplatesModal } from './components/modals/TemplatesModal';
import { ShortcutsModal } from './components/modals/ShortcutsModal';

import { DashboardPage } from './pages/DashboardPage';
import { HistoryPage } from './pages/HistoryPage';
import { WorkflowDetailsPage } from './pages/WorkflowDetailsPage';

import { api } from './services/api';
import type {
  Workflow,
  Execution,
  WorkflowTemplate,
  NodeDefinition,
  CustomNodeType,
  CustomEdgeType,
  ViewMode,
  SystemStats,
  ToastMessage,
  NodeStatus
} from './types';

const nodeTypes = {
  custom: CustomWorkflowNode
};

const edgeTypes = {
  glowing: CustomGlowingEdge
};

// Initial default node setup if starting clean
const DEFAULT_INITIAL_NODES: CustomNodeType[] = [
  {
    id: 'node-trigger-1',
    type: 'custom',
    position: { x: 80, y: 220 },
    data: {
      label: 'Manual Trigger',
      type: 'manual_trigger',
      category: 'Trigger',
      status: 'IDLE',
      payload: '{"source": "canvas_run"}'
    }
  },
  {
    id: 'node-input-1',
    type: 'custom',
    position: { x: 380, y: 220 },
    data: {
      label: 'Text Input',
      type: 'text_input',
      category: 'Input',
      status: 'IDLE',
      text: 'NodeFlow Visual Automation Platform - Industrial Blueprint Edition',
      variable_name: 'input_text',
      required: true
    }
  },
  {
    id: 'node-transform-1',
    type: 'custom',
    position: { x: 700, y: 220 },
    data: {
      label: 'Text Transform',
      type: 'text_transform',
      category: 'Transform',
      status: 'IDLE',
      operation: 'uppercase'
    }
  },
  {
    id: 'node-output-1',
    type: 'custom',
    position: { x: 1020, y: 220 },
    data: {
      label: 'Terminal Output',
      type: 'output',
      category: 'Output',
      status: 'IDLE'
    }
  }
];

const DEFAULT_INITIAL_EDGES: CustomEdgeType[] = [
  { id: 'edge-1-2', source: 'node-trigger-1', target: 'node-input-1', sourceHandle: 'output', targetHandle: 'input', type: 'glowing' },
  { id: 'edge-2-3', source: 'node-input-1', target: 'node-transform-1', sourceHandle: 'output', targetHandle: 'input', type: 'glowing' },
  { id: 'edge-3-4', source: 'node-transform-1', target: 'node-output-1', sourceHandle: 'output', targetHandle: 'input', type: 'glowing' }
];

export function App() {
  // Navigation View Mode
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');

  // Workflows & Active State
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [currentWorkflow, setCurrentWorkflow] = useState<Workflow | null>(null);
  const [selectedWorkflowForDetails, setSelectedWorkflowForDetails] = useState<Workflow | null>(null);
  const [stats, setStats] = useState<SystemStats | null>(null);

  // Executions & History
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [latestExecution, setLatestExecution] = useState<Execution | null>(null);

  // Catalogs & Templates
  const [definitions, setDefinitions] = useState<NodeDefinition[]>([]);
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);

  // UI Panels
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const [isCatalogCollapsed, setIsCatalogCollapsed] = useState(false);
  const [selectedNode, setSelectedNode] = useState<CustomNodeType | null>(null);
  const [selectedNodeDef, setSelectedNodeDef] = useState<NodeDefinition | null>(null);

  // Modals & Toasts
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Async Loaders
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [systemHealthy, setSystemHealthy] = useState(true);

  // React Flow Graph State
  const [nodes, setNodes, onNodesChangeBase] = useNodesState<CustomNodeType>(DEFAULT_INITIAL_NODES);
  const [edges, setEdges, onEdgesChangeBase] = useEdgesState<CustomEdgeType>(DEFAULT_INITIAL_EDGES);

  // Undo / Redo Stack
  const historyRef = useRef<{ nodes: CustomNodeType[]; edges: CustomEdgeType[] }[]>([]);
  const historyIndexRef = useRef<number>(-1);

  const addToast = useCallback((type: 'success' | 'error' | 'info', title: string, description?: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    setToasts(prev => [...prev, { id, type, title, description }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  // Save graph state to history stack
  const pushHistory = useCallback((newNodes: CustomNodeType[], newEdges: CustomEdgeType[]) => {
    const nextIdx = historyIndexRef.current + 1;
    historyRef.current = historyRef.current.slice(0, nextIdx);
    historyRef.current.push({ nodes: newNodes, edges: newEdges });
    historyIndexRef.current = nextIdx;
  }, []);

  const handleUndo = useCallback(() => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current -= 1;
      const snapshot = historyRef.current[historyIndexRef.current];
      setNodes(snapshot.nodes);
      setEdges(snapshot.edges);
      setHasUnsavedChanges(true);
      addToast('info', 'Undo applied');
    }
  }, [addToast, setNodes, setEdges]);

  const handleRedo = useCallback(() => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current += 1;
      const snapshot = historyRef.current[historyIndexRef.current];
      setNodes(snapshot.nodes);
      setEdges(snapshot.edges);
      setHasUnsavedChanges(true);
      addToast('info', 'Redo applied');
    }
  }, [addToast, setNodes, setEdges]);

  // Wrapped node changes to track unsaved edits
  const onNodesChange = useCallback((changes: NodeChange<CustomNodeType>[]) => {
    onNodesChangeBase(changes);
    setHasUnsavedChanges(true);
  }, [onNodesChangeBase]);

  const onEdgesChange = useCallback((changes: EdgeChange<CustomEdgeType>[]) => {
    onEdgesChangeBase(changes);
    setHasUnsavedChanges(true);
  }, [onEdgesChangeBase]);

  // Connect handles
  const onConnect = useCallback((connection: Connection) => {
    setEdges(eds => {
      const isTrueBranch = connection.sourceHandle === 'true';
      const isFalseBranch = connection.sourceHandle === 'false';
      const label = isTrueBranch ? 'True' : isFalseBranch ? 'False' : undefined;

      const newEdges = addEdge(
        {
          ...connection,
          type: 'glowing',
          label
        },
        eds
      ) as CustomEdgeType[];
      setHasUnsavedChanges(true);
      pushHistory(nodes, newEdges);
      return newEdges;
    });
  }, [nodes, pushHistory, setEdges]);

  // Node selection sync with Inspector
  const onNodeClick = useCallback((_: React.MouseEvent, node: CustomNodeType) => {
    setSelectedNode(node);
    const ntype = node.data?.type || node.type || 'text_transform';
    const def = definitions.find(d => d.type === ntype) || null;
    setSelectedNodeDef(def);
  }, [definitions]);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setSelectedNodeDef(null);
  }, []);

  // Update node data from Inspector
  const handleUpdateNodeData = useCallback((nodeId: string, updatedData: Record<string, any>) => {
    setNodes(nds =>
      nds.map(node => {
        if (node.id === nodeId) {
          const updatedNode = {
            ...node,
            data: {
              ...node.data,
              ...updatedData
            }
          };
          if (selectedNode?.id === nodeId) {
            setSelectedNode(updatedNode);
          }
          return updatedNode;
        }
        return node;
      })
    );
    setHasUnsavedChanges(true);
  }, [selectedNode, setNodes]);

  // Delete node
  const handleDeleteNode = useCallback((nodeId: string) => {
    setNodes(nds => nds.filter(n => n.id !== nodeId));
    setEdges(eds => eds.filter(e => e.source !== nodeId && e.target !== nodeId));
    if (selectedNode?.id === nodeId) {
      setSelectedNode(null);
      setSelectedNodeDef(null);
    }
    setHasUnsavedChanges(true);
    addToast('info', 'Node deleted from canvas');
  }, [addToast, selectedNode, setNodes, setEdges]);

  // Fetch initial data from backend
  const fetchInitialData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [wfs, defs, tpls, stat, execs] = await Promise.all([
        api.getWorkflows(),
        api.getNodeDefinitions(),
        api.getTemplates(),
        api.getStats().catch(() => null),
        api.getExecutions(undefined, 'ALL', 40).catch(() => [])
      ]);

      setWorkflows(wfs);
      setDefinitions(defs);
      setTemplates(tpls);
      setStats(stat);
      setExecutions(execs);
      setSystemHealthy(true);

      if (wfs.length > 0 && !currentWorkflow) {
        // Load first workflow into editor state
        loadWorkflowIntoState(wfs[0]);
      }
    } catch (err: any) {
      setSystemHealthy(false);
      addToast('error', 'Connecting to NodeFlow engine...', 'FastAPI backend warming up.');
    } finally {
      setIsLoading(false);
    }
  }, [addToast, currentWorkflow]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Helper to load a workflow graph into canvas
  const loadWorkflowIntoState = (wf: Workflow) => {
    setCurrentWorkflow(wf);
    const loadedNodes: CustomNodeType[] = (wf.nodes && wf.nodes.length > 0)
      ? wf.nodes.map(n => ({
          ...n,
          type: 'custom',
          data: {
            ...n.data,
            type: n.data?.type || n.type || 'text_transform',
            status: ('IDLE' as NodeStatus),
            executionResult: undefined
          }
        }))
      : DEFAULT_INITIAL_NODES;

    const loadedEdges: CustomEdgeType[] = (wf.edges && wf.edges.length > 0)
      ? wf.edges.map(e => ({
          ...e,
          type: 'glowing'
        }))
      : DEFAULT_INITIAL_EDGES;

    setNodes(loadedNodes);
    setEdges(loadedEdges);
    setHasUnsavedChanges(false);
    setSelectedNode(null);
    setSelectedNodeDef(null);
    pushHistory(loadedNodes, loadedEdges);
  };

  // Drag & drop node creation
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    const type = event.dataTransfer.getData('application/reactflow');
    if (!type) return;

    const def = definitions.find(d => d.type === type);
    const bounds = event.currentTarget.getBoundingClientRect();
    const position = {
      x: event.clientX - bounds.left - 100,
      y: event.clientY - bounds.top - 40
    };

    const newId = `node-${type.replace(/_/g, '-')}-${Date.now().toString().slice(-4)}`;
    const newNode: CustomNodeType = {
      id: newId,
      type: 'custom',
      position,
      data: {
        label: def?.label || type,
        type: type,
        category: def?.category || 'Transform',
        status: 'IDLE',
        ...(def?.default_data || {})
      }
    };

    setNodes(nds => {
      const next = [...nds, newNode];
      pushHistory(next, edges);
      return next;
    });
    setHasUnsavedChanges(true);
    addToast('info', `Added ${def?.label || type}`);
  }, [definitions, edges, pushHistory, setNodes, addToast]);

  const handleAddNodeFromSidebar = (type: string) => {
    const def = definitions.find(d => d.type === type);
    const newId = `node-${type.replace(/_/g, '-')}-${Date.now().toString().slice(-4)}`;
    const newNode: CustomNodeType = {
      id: newId,
      type: 'custom',
      position: { x: 300 + Math.random() * 100, y: 150 + Math.random() * 100 },
      data: {
        label: def?.label || type,
        type: type,
        category: def?.category || 'Transform',
        status: 'IDLE',
        ...(def?.default_data || {})
      }
    };

    setNodes(nds => {
      const next = [...nds, newNode];
      pushHistory(next, edges);
      return next;
    });
    setHasUnsavedChanges(true);
    addToast('info', `Added ${def?.label || type}`);
  };

  // Save workflow
  const handleSaveWorkflow = async () => {
    try {
      setIsSaving(true);
      const payload: Partial<Workflow> = {
        name: currentWorkflow?.name || 'Untitled Workflow',
        description: currentWorkflow?.description || '',
        category: currentWorkflow?.category || 'General',
        tags: currentWorkflow?.tags || ['automation'],
        nodes,
        edges,
        viewport: { x: 0, y: 0, zoom: 1.0 }
      };

      let saved: Workflow;
      if (currentWorkflow?.id) {
        saved = await api.updateWorkflow(currentWorkflow.id, payload);
      } else {
        saved = await api.createWorkflow(payload);
      }

      setCurrentWorkflow(saved);
      setHasUnsavedChanges(false);
      addToast('success', 'Workflow Saved', `"${saved.name}" stored in database.`);

      // Refresh workflows list
      const updatedList = await api.getWorkflows();
      setWorkflows(updatedList);
      api.getStats().then(setStats).catch(() => {});
    } catch (err: any) {
      addToast('error', 'Save Failed', err.message || 'Could not save workflow graph.');
    } finally {
      setIsSaving(false);
    }
  };

  // Validate workflow DAG
  const handleValidateWorkflow = async () => {
    try {
      setIsValidating(true);
      const res = await api.validateWorkflow(nodes, edges);
      if (res.valid) {
        addToast('success', 'DAG Validation Passed', `Graph is a valid acyclic DAG (${res.node_count} nodes, ${res.edge_count} edges).`);
      } else {
        const firstErr = res.errors[0]?.message || 'Validation error detected.';
        addToast('error', 'DAG Validation Issue', firstErr);
      }
    } catch (err: any) {
      addToast('error', 'Validation Request Failed', err.message);
    } finally {
      setIsValidating(false);
    }
  };

  // Execute workflow
  const handleExecuteWorkflow = async () => {
    try {
      setIsRunning(true);
      setIsConsoleOpen(true);

      // Set all nodes to RUNNING visually
      setNodes(nds =>
        nds.map(n => ({
          ...n,
          data: {
            ...n.data,
            status: 'RUNNING'
          }
        }))
      );

      let execResult: Execution;
      if (currentWorkflow?.id && !hasUnsavedChanges) {
        execResult = await api.executeSavedWorkflow(currentWorkflow.id);
      } else {
        execResult = await api.executeAdHocWorkflow(
          currentWorkflow?.name || 'Interactive Run',
          nodes,
          edges
        );
      }

      setLatestExecution(execResult);

      // Update nodes with step results and status
      setNodes(nds =>
        nds.map(n => {
          const res = execResult.node_results[n.id];
          const st: NodeStatus = res?.status ? (res.status as NodeStatus) : (execResult.status === 'COMPLETED' ? 'COMPLETED' : 'FAILED');
          return {
            ...n,
            data: {
              ...n.data,
              status: st,
              executionResult: res
            }
          };
        })
      );

      if (execResult.status === 'COMPLETED') {
        addToast('success', 'Execution Succeeded', `Completed in ${execResult.duration_ms}ms.`);
      } else {
        addToast('error', 'Execution Error', execResult.error || 'A step failed during execution.');
      }

      // Refresh stats & executions
      api.getStats().then(setStats).catch(() => {});
      api.getExecutions(undefined, 'ALL', 40).then(setExecutions).catch(() => {});
    } catch (err: any) {
      addToast('error', 'Execution Engine Error', err.message || 'Execution failed.');
      setNodes(nds =>
        nds.map(n => ({
          ...n,
          data: { ...n.data, status: ('FAILED' as NodeStatus) }
        }))
      );
    } finally {
      setIsRunning(false);
    }
  };

  // Duplicate workflow
  const handleDuplicateWorkflow = async (workflowId: string) => {
    try {
      const dup = await api.duplicateWorkflow(workflowId);
      addToast('success', 'Workflow Duplicated', `Created "${dup.name}"`);
      const wfs = await api.getWorkflows();
      setWorkflows(wfs);
      api.getStats().then(setStats).catch(() => {});
    } catch (err: any) {
      addToast('error', 'Duplicate Failed', err.message);
    }
  };

  // Delete workflow
  const handleDeleteWorkflow = async (workflowId: string) => {
    try {
      await api.deleteWorkflow(workflowId);
      addToast('info', 'Workflow Deleted');
      const wfs = await api.getWorkflows();
      setWorkflows(wfs);
      api.getStats().then(setStats).catch(() => {});
      if (currentWorkflow?.id === workflowId) {
        setCurrentWorkflow(null);
        setNodes(DEFAULT_INITIAL_NODES);
        setEdges(DEFAULT_INITIAL_EDGES);
      }
    } catch (err: any) {
      addToast('error', 'Delete Failed', err.message);
    }
  };

  // Cancel execution
  const handleCancelExecution = async (executionId: string) => {
    try {
      const cancelled = await api.cancelExecution(executionId);
      addToast('info', 'Execution Cancelled');
      setExecutions(prev => prev.map(e => (e.id === executionId ? cancelled : e)));
    } catch (err: any) {
      addToast('error', 'Cancel Failed', err.message);
    }
  };

  // Clear executions
  const handleClearAllExecutions = async () => {
    try {
      await api.clearExecutions();
      setExecutions([]);
      setLatestExecution(null);
      api.getStats().then(setStats).catch(() => {});
      addToast('info', 'Execution history cleared');
    } catch (err: any) {
      addToast('error', 'Clear Failed', err.message);
    }
  };

  // Select starter template
  const handleSelectTemplate = async (templateId: string) => {
    try {
      setIsLoading(true);
      const newWf = await api.instantiateTemplate(templateId);
      loadWorkflowIntoState(newWf);
      setViewMode('editor');
      setIsTemplatesModalOpen(false);
      addToast('success', 'Blueprint Loaded', `"${newWf.name}" ready in editor.`);
      const wfs = await api.getWorkflows();
      setWorkflows(wfs);
      api.getStats().then(setStats).catch(() => {});
    } catch (err: any) {
      addToast('error', 'Template Load Failed', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Create clean new workflow
  const handleCreateNewWorkflow = () => {
    const newWf: Workflow = {
      id: '',
      name: 'Untitled Blueprint',
      description: 'Custom visual workflow pipeline',
      category: 'General',
      tags: ['automation'],
      nodes: DEFAULT_INITIAL_NODES,
      edges: DEFAULT_INITIAL_EDGES,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    loadWorkflowIntoState(newWf);
    setViewMode('editor');
    addToast('info', 'New canvas blueprint initialized');
  };

  // Export JSON
  const handleExportJson = () => {
    const data = {
      name: currentWorkflow?.name || 'workflow-export',
      nodes,
      edges
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(currentWorkflow?.name || 'workflow').replace(/\s+/g, '_').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('success', 'Graph JSON Exported');
  };

  // Import JSON
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        if (parsed.nodes && parsed.edges) {
          setNodes(parsed.nodes);
          setEdges(parsed.edges);
          setHasUnsavedChanges(true);
          addToast('success', 'Graph Imported');
        } else {
          addToast('error', 'Import Error', 'File missing nodes or edges array.');
        }
      } catch (err: any) {
        addToast('error', 'Invalid JSON File', err.message);
      }
    };
    reader.readAsText(file);
  };

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (viewMode === 'editor') handleSaveWorkflow();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (viewMode === 'editor') handleExecuteWorkflow();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      } else if (e.key === 'Escape') {
        setSelectedNode(null);
        setSelectedNodeDef(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, handleSaveWorkflow, handleExecuteWorkflow, handleUndo, handleRedo]);

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Top Header Toolbar */}
      <HeaderToolbar
        currentWorkflow={currentWorkflow}
        onUpdateWorkflowMeta={(name, description) => {
          if (currentWorkflow) {
            setCurrentWorkflow({ ...currentWorkflow, name, description });
          }
          setHasUnsavedChanges(true);
        }}
        onSaveWorkflow={handleSaveWorkflow}
        isSaving={isSaving}
        hasUnsavedChanges={hasUnsavedChanges}
        onExecuteWorkflow={handleExecuteWorkflow}
        isRunning={isRunning}
        onValidateWorkflow={handleValidateWorkflow}
        isValidating={isValidating}
        onOpenTemplates={() => setIsTemplatesModalOpen(true)}
        onExportJson={handleExportJson}
        onImportJson={handleImportJson}
        onClearCanvas={() => {
          if (window.confirm('Clear all nodes and connections from canvas?')) {
            setNodes([]);
            setEdges([]);
            setHasUnsavedChanges(true);
          }
        }}
        onOpenShortcuts={() => setIsShortcutsModalOpen(true)}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={historyIndexRef.current > 0}
        canRedo={historyIndexRef.current < historyRef.current.length - 1}
        viewMode={viewMode}
        onNavigate={setViewMode}
      />

      {/* Main Workspace Layout */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        {/* Narrow Left Rail */}
        <NavigationRail
          currentView={viewMode}
          onNavigate={setViewMode}
          onOpenTemplates={() => setIsTemplatesModalOpen(true)}
          systemHealthy={systemHealthy}
        />

        {/* View Page A: DASHBOARD */}
        {viewMode === 'dashboard' && (
          <DashboardPage
            workflows={workflows}
            stats={stats}
            onOpenWorkflow={wf => {
              loadWorkflowIntoState(wf);
              setViewMode('editor');
            }}
            onViewDetails={wf => {
              setSelectedWorkflowForDetails(wf);
              setViewMode('workflow-details');
            }}
            onCreateNew={handleCreateNewWorkflow}
            onDuplicateWorkflow={handleDuplicateWorkflow}
            onDeleteWorkflow={handleDeleteWorkflow}
            onQuickRun={async wf => {
              loadWorkflowIntoState(wf);
              setViewMode('editor');
              setTimeout(() => {
                handleExecuteWorkflow();
              }, 150);
            }}
            onOpenTemplates={() => setIsTemplatesModalOpen(true)}
          />
        )}

        {/* View Page B: WORKFLOW EDITOR CANVAS */}
        {viewMode === 'editor' && (
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
            {/* Left Node Catalog Sidebar */}
            <NodeCatalogSidebar
              definitions={definitions}
              onAddNode={handleAddNodeFromSidebar}
              collapsed={isCatalogCollapsed}
              onToggleCollapse={() => setIsCatalogCollapsed(!isCatalogCollapsed)}
            />

            {/* Main Interactive React Flow Canvas */}
            <div
              style={{ flex: 1, height: '100%', position: 'relative' }}
              onDragOver={onDragOver}
              onDrop={onDrop}
            >
              <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={onNodeClick}
                onPaneClick={onPaneClick}
                fitView
                snapToGrid
                snapGrid={[15, 15]}
                defaultEdgeOptions={{ type: 'glowing' }}
                proOptions={{ hideAttribution: true }}
              >
                {/* Dotted Blueprint Grid */}
                <Background
                  variant={BackgroundVariant.Dots}
                  gap={18}
                  size={1.5}
                  color="var(--canvas-dot)"
                />
                <Controls showInteractive={false} position="top-right" />
                <MiniMap
                  position="bottom-right"
                  nodeColor={n => {
                    if (n.data?.status === 'COMPLETED') return '#1B7F48';
                    if (n.data?.status === 'FAILED') return '#D92D20';
                    if (n.data?.status === 'RUNNING') return '#315BDB';
                    return '#DDD9CD';
                  }}
                  maskColor="rgba(247, 245, 239, 0.7)"
                  style={{ width: 130, height: 90, marginBottom: isConsoleOpen ? 290 : 20 }}
                />
              </ReactFlow>

              {/* Bottom Execution Console */}
              <ExecutionConsole
                execution={latestExecution}
                isOpen={isConsoleOpen}
                onToggle={() => setIsConsoleOpen(!isConsoleOpen)}
                onSelectNode={nodeId => {
                  const target = nodes.find(n => n.id === nodeId);
                  if (target) {
                    setSelectedNode(target);
                    const ntype = target.data?.type || target.type || 'text_transform';
                    setSelectedNodeDef(definitions.find(d => d.type === ntype) || null);
                  }
                }}
              />
            </div>

            {/* Right Configuration Inspector */}
            {selectedNode && (
              <NodeInspectorPanel
                selectedNode={selectedNode}
                definition={selectedNodeDef}
                onUpdateNodeData={handleUpdateNodeData}
                onDeleteNode={handleDeleteNode}
                onClose={() => {
                  setSelectedNode(null);
                  setSelectedNodeDef(null);
                }}
              />
            )}
          </div>
        )}

        {/* View Page C: EXECUTION HISTORY */}
        {viewMode === 'history' && (
          <HistoryPage
            executions={executions}
            onInspectExecution={async execId => {
              const exec = executions.find(e => e.id === execId);
              if (exec) {
                setLatestExecution(exec);
                setIsConsoleOpen(true);
                setViewMode('editor');
              }
            }}
            onCancelExecution={handleCancelExecution}
            onDeleteExecution={async execId => {
              await api.deleteExecution(execId);
              setExecutions(prev => prev.filter(e => e.id !== execId));
              addToast('info', 'Execution record deleted');
            }}
            onClearAllExecutions={handleClearAllExecutions}
            onNavigateToEditor={() => setViewMode('editor')}
          />
        )}

        {/* View Page D: WORKFLOW DETAILS */}
        {viewMode === 'workflow-details' && (
          <WorkflowDetailsPage
            workflow={selectedWorkflowForDetails}
            recentExecutions={executions}
            onBackToDashboard={() => setViewMode('dashboard')}
            onOpenInEditor={wf => {
              loadWorkflowIntoState(wf);
              setViewMode('editor');
            }}
            onRunWorkflow={async wf => {
              loadWorkflowIntoState(wf);
              setViewMode('editor');
              setTimeout(() => {
                handleExecuteWorkflow();
              }, 150);
            }}
            onDuplicateWorkflow={handleDuplicateWorkflow}
            onDeleteWorkflow={handleDeleteWorkflow}
          />
        )}
      </div>

      {/* Templates Modal */}
      <TemplatesModal
        isOpen={isTemplatesModalOpen}
        templates={templates}
        onSelectTemplate={handleSelectTemplate}
        onClose={() => setIsTemplatesModalOpen(false)}
        isLoading={isLoading}
      />

      {/* Keyboard Shortcuts Modal */}
      <ShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
      />

      {/* Global Toast Notifications Container */}
      <div className="nodeflow-toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`nodeflow-toast toast-${toast.type}`}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                {toast.title}
              </div>
              {toast.description && (
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                  {toast.description}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
