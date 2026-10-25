import {
  DockerStatus,
  ContainerSummary,
  ContainerDetail,
  ImageSummary,
  ImageDetail,
  ComposeValidationResponse,
  DiagnosticsReport,
  ContainerLogsResponse,
} from '../types';

const API_BASE = '/api';

export async function fetchDockerStatus(): Promise<DockerStatus> {
  const res = await fetch(`${API_BASE}/docker/status`);
  if (!res.ok) {
    throw new Error(`Failed to fetch Docker status: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchContainers(demo: boolean = false): Promise<ContainerSummary[]> {
  const url = `${API_BASE}/containers?all_containers=true${demo ? '&demo=true' : ''}`;
  const res = await fetch(url);
  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    const msg = errorData?.detail?.message || errorData?.detail || res.statusText;
    throw new Error(msg);
  }
  return res.json();
}

export async function fetchContainerDetail(id: string, demo: boolean = false): Promise<ContainerDetail> {
  const url = `${API_BASE}/containers/${id}${demo ? '?demo=true' : ''}`;
  const res = await fetch(url);
  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.detail?.message || res.statusText);
  }
  return res.json();
}

export async function executeContainerAction(
  containerId: string,
  action: 'start' | 'stop' | 'restart',
  confirm: boolean,
  demo: boolean = false
): Promise<{ success: boolean; message: string; new_state?: string }> {
  const url = `${API_BASE}/containers/${containerId}/action${demo ? '?demo=true' : ''}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, confirm }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.detail?.message || res.statusText);
  }
  return res.json();
}

export async function fetchImages(demo: boolean = false): Promise<ImageSummary[]> {
  const url = `${API_BASE}/images${demo ? '?demo=true' : ''}`;
  const res = await fetch(url);
  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    const msg = errorData?.detail?.message || errorData?.detail || res.statusText;
    throw new Error(msg);
  }
  return res.json();
}

export async function fetchImageDetail(id: string, demo: boolean = false): Promise<ImageDetail> {
  const url = `${API_BASE}/images/${encodeURIComponent(id)}${demo ? '?demo=true' : ''}`;
  const res = await fetch(url);
  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.detail?.message || res.statusText);
  }
  return res.json();
}

export async function validateComposeYaml(
  yamlContent: string,
  projectName: string = 'compose-project'
): Promise<ComposeValidationResponse> {
  const res = await fetch(`${API_BASE}/compose/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ yaml_content: yamlContent, project_name: projectName }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.detail?.message || 'Compose validation failed');
  }
  return res.json();
}

export async function uploadComposeFile(file: File): Promise<ComposeValidationResponse> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE}/compose/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.detail || 'File upload failed');
  }
  return res.json();
}

export async function fetchSampleTemplates(): Promise<Record<string, string>> {
  const res = await fetch(`${API_BASE}/compose/samples`);
  if (!res.ok) {
    throw new Error('Failed to load sample templates');
  }
  return res.json();
}

export async function analyzeDiagnostics(yamlContent: string): Promise<DiagnosticsReport> {
  const res = await fetch(`${API_BASE}/diagnostics/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ yaml_content: yamlContent }),
  });
  if (!res.ok) {
    throw new Error('Failed to run diagnostics');
  }
  return res.json();
}

export async function fetchContainerLogs(
  containerId: string,
  tail: number = 100,
  timestamps: boolean = true,
  demo: boolean = false
): Promise<ContainerLogsResponse> {
  const url = `${API_BASE}/containers/${containerId}/logs?tail=${tail}&timestamps=${timestamps}${demo ? '&demo=true' : ''}`;
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.detail?.message || 'Failed to fetch logs');
  }
  return res.json();
}
