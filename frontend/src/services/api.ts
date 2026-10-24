/**
 * NodeFlow REST API client using native Fetch API.
 */

import type {
  Workflow,
  Execution,
  WorkflowTemplate,
  NodeDefinition,
  ValidationResponse,
  CustomNodeType,
  CustomEdgeType,
  SystemStats
} from '../types';

const API_BASE = '/api';

class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errData: any;
    try {
      errData = await res.json();
    } catch {
      errData = { message: res.statusText };
    }
    const message = errData.detail || errData.message || `Request failed with status ${res.status}`;
    throw new ApiError(message, res.status, errData);
  }
  if (res.status === 204) {
    return {} as T;
  }
  return res.json() as Promise<T>;
}

export const api = {
  // Health
  async checkHealth(): Promise<{ status: string; app: string; version: string }> {
    const res = await fetch(`${API_BASE}/health`);
    return handleResponse(res);
  },

  // Stats
  async getStats(): Promise<SystemStats> {
    const res = await fetch(`${API_BASE}/stats`);
    return handleResponse<SystemStats>(res);
  },

  // Node Definitions
  async getNodeDefinitions(): Promise<NodeDefinition[]> {
    const res = await fetch(`${API_BASE}/nodes/definitions`);
    return handleResponse<NodeDefinition[]>(res);
  },

  // Templates
  async getTemplates(): Promise<WorkflowTemplate[]> {
    const res = await fetch(`${API_BASE}/templates`);
    return handleResponse<WorkflowTemplate[]>(res);
  },

  async getTemplate(id: string): Promise<WorkflowTemplate> {
    const res = await fetch(`${API_BASE}/templates/${id}`);
    return handleResponse<WorkflowTemplate>(res);
  },

  async instantiateTemplate(id: string): Promise<Workflow> {
    const res = await fetch(`${API_BASE}/templates/${id}/instantiate`, {
      method: 'POST'
    });
    return handleResponse<Workflow>(res);
  },

  // Workflows CRUD
  async getWorkflows(query?: string, category?: string): Promise<Workflow[]> {
    const params = new URLSearchParams();
    if (query) params.append('q', query);
    if (category) params.append('category', category);
    const queryString = params.toString() ? `?${params.toString()}` : '';

    const res = await fetch(`${API_BASE}/workflows${queryString}`);
    return handleResponse<Workflow[]>(res);
  },

  async getWorkflow(id: string): Promise<Workflow> {
    const res = await fetch(`${API_BASE}/workflows/${id}`);
    return handleResponse<Workflow>(res);
  },

  async createWorkflow(payload: Partial<Workflow>): Promise<Workflow> {
    const res = await fetch(`${API_BASE}/workflows`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return handleResponse<Workflow>(res);
  },

  async updateWorkflow(id: string, payload: Partial<Workflow>): Promise<Workflow> {
    const res = await fetch(`${API_BASE}/workflows/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return handleResponse<Workflow>(res);
  },

  async deleteWorkflow(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/workflows/${id}`, {
      method: 'DELETE'
    });
    return handleResponse<void>(res);
  },

  async duplicateWorkflow(id: string): Promise<Workflow> {
    const res = await fetch(`${API_BASE}/workflows/${id}/duplicate`, {
      method: 'POST'
    });
    return handleResponse<Workflow>(res);
  },

  // Execution & Validation
  async validateWorkflow(nodes: CustomNodeType[], edges: CustomEdgeType[]): Promise<ValidationResponse> {
    const res = await fetch(`${API_BASE}/workflows/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nodes, edges })
    });
    return handleResponse<ValidationResponse>(res);
  },

  async executeSavedWorkflow(workflowId: string, triggerPayload?: Record<string, any>): Promise<Execution> {
    const res = await fetch(`${API_BASE}/workflows/${workflowId}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trigger_payload: triggerPayload || {} })
    });
    return handleResponse<Execution>(res);
  },

  async executeAdHocWorkflow(
    workflowName: string,
    nodes: CustomNodeType[],
    edges: CustomEdgeType[],
    triggerPayload?: Record<string, any>
  ): Promise<Execution> {
    const res = await fetch(`${API_BASE}/workflows/execute-adhoc`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workflow_name: workflowName,
        nodes,
        edges,
        trigger_payload: triggerPayload || {}
      })
    });
    return handleResponse<Execution>(res);
  },

  // Executions History
  async getExecutions(workflowId?: string, status?: string, limit: number = 50): Promise<Execution[]> {
    const params = new URLSearchParams();
    if (workflowId) params.append('workflow_id', workflowId);
    if (status && status !== 'ALL') params.append('status', status);
    params.append('limit', limit.toString());

    const res = await fetch(`${API_BASE}/executions?${params.toString()}`);
    return handleResponse<Execution[]>(res);
  },

  async getExecution(id: string): Promise<Execution> {
    const res = await fetch(`${API_BASE}/executions/${id}`);
    return handleResponse<Execution>(res);
  },

  async cancelExecution(id: string): Promise<Execution> {
    const res = await fetch(`${API_BASE}/executions/${id}/cancel`, {
      method: 'POST'
    });
    return handleResponse<Execution>(res);
  },

  async deleteExecution(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/executions/${id}`, {
      method: 'DELETE'
    });
    return handleResponse<void>(res);
  },

  async clearExecutions(): Promise<void> {
    const res = await fetch(`${API_BASE}/executions`, {
      method: 'DELETE'
    });
    return handleResponse<void>(res);
  }
};
