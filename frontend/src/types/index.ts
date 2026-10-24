import type { Node, Edge } from '@xyflow/react';

export type NodeCategory = 'Trigger' | 'Input' | 'Logic' | 'Transform' | 'Aggregator' | 'Output';

export interface NodePort {
  id: string;
  label: string;
  type: string;
  required?: boolean;
  description?: string;
}

export interface ConfigField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'number' | 'boolean' | 'json' | 'code';
  default?: any;
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
  description?: string;
  required?: boolean;
}

export interface NodeDefinition {
  type: string;
  label: string;
  category: NodeCategory;
  description: string;
  icon: string;
  color: string;
  inputs: NodePort[];
  outputs: NodePort[];
  default_data: Record<string, any>;
  config_fields: ConfigField[];
}

export type NodeStatus = 'IDLE' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'SKIPPED';

export interface WorkflowNodeData extends Record<string, any> {
  label: string;
  type?: string;
  category?: NodeCategory;
  color?: string;
  icon?: string;
  status?: NodeStatus;
  executionResult?: {
    output?: any;
    inputs?: any;
    duration_ms?: number;
    error?: string;
    branch_selected?: string;
  };
}

export type CustomNodeType = Node<WorkflowNodeData>;
export type CustomEdgeType = Edge;

export interface Workflow {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  nodes: CustomNodeType[];
  edges: CustomEdgeType[];
  viewport?: { x: number; y: number; zoom: number };
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ExecutionLog {
  timestamp: string;
  level: 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
  message: string;
  node_id?: string;
  node_name?: string;
  data?: any;
}

export interface NodeResult {
  node_id: string;
  node_type: string;
  node_name: string;
  status: 'COMPLETED' | 'FAILED' | 'SKIPPED';
  duration_ms: number;
  inputs: Record<string, any>;
  output: any;
  error?: string;
  branch_selected?: string;
  started_at?: string;
  finished_at?: string;
}

export interface ExecutionStep {
  id: string;
  execution_id: string;
  node_id: string;
  node_type: string;
  node_name: string;
  status: string;
  input_json?: any;
  output_json?: any;
  error_message?: string;
  started_at: string;
  finished_at?: string;
  duration_ms: number;
}

export interface Execution {
  id: string;
  workflow_id?: string | null;
  workflow_name: string;
  status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  triggered_by: string;
  started_at: string;
  completed_at?: string;
  finished_at?: string;
  duration_ms: number;
  error?: string | null;
  error_message?: string | null;
  logs: ExecutionLog[];
  node_results: Record<string, NodeResult>;
  final_output_json?: any;
  execution_order: string[];
  steps?: ExecutionStep[];
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  nodes: CustomNodeType[];
  edges: CustomEdgeType[];
  created_at?: string;
}

export interface ValidationIssue {
  node_id?: string;
  edge_id?: string;
  type: 'error' | 'warning';
  message: string;
}

export interface ValidationResponse {
  valid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  node_count: number;
  edge_count: number;
}

export interface SystemStats {
  total_workflows: number;
  total_executions: number;
  successful_executions: number;
  failed_executions: number;
  success_rate_pct: number;
  avg_duration_ms: number;
}

export type ViewMode = 'dashboard' | 'editor' | 'history' | 'workflow-details';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  description?: string;
}
