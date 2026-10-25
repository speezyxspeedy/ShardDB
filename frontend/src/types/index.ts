export type Severity = 'error' | 'warning' | 'info';

export interface DockerStatus {
  connected: boolean;
  status: string;
  version?: string | null;
  api_version?: string | null;
  os?: string | null;
  arch?: string | null;
  containers_running: number;
  containers_stopped: number;
  containers_total: number;
  images_count: number;
  server_time?: string | null;
  error_message?: string | null;
  troubleshooting: string[];
  is_demo: boolean;
}

export interface ContainerPortMapping {
  host_ip?: string | null;
  host_port?: string | null;
  container_port: string;
  protocol: string;
}

export interface ContainerMount {
  source: string;
  destination: string;
  mode: string;
  rw: boolean;
  type: string;
}

export interface ContainerNetwork {
  name: string;
  ip_address?: string | null;
  gateway?: string | null;
  mac_address?: string | null;
}

export interface ContainerSummary {
  id: string;
  short_id: string;
  name: string;
  image: string;
  status: string;
  state: string;
  created: string;
  ports: string[];
  health?: string | null;
  compose_project?: string | null;
  compose_service?: string | null;
  is_demo: boolean;
}

export interface ContainerDetail {
  id: string;
  short_id: string;
  name: string;
  image: string;
  image_id: string;
  status: string;
  state: string;
  created: string;
  started_at?: string | null;
  finished_at?: string | null;
  exit_code?: number | null;
  restart_count: number;
  ports: ContainerPortMapping[];
  mounts: ContainerMount[];
  networks: ContainerNetwork[];
  env: Record<string, string>;
  command?: string[] | null;
  labels: Record<string, string>;
  health?: string | null;
  recent_logs: string[];
  is_demo: boolean;
}

export interface ImageSummary {
  id: string;
  short_id: string;
  repository: string;
  tag: string;
  size_bytes: number;
  size_formatted: string;
  created: string;
  containers_count: number;
  is_demo: boolean;
}

export interface ImageLayer {
  id: string;
  created_by: string;
  size_bytes: number;
  size_formatted: string;
  comment?: string;
}

export interface ImageDetail {
  id: string;
  short_id: string;
  tags: string[];
  size_bytes: number;
  size_formatted: string;
  created: string;
  architecture?: string | null;
  os?: string | null;
  docker_version?: string | null;
  author?: string | null;
  env: string[];
  entrypoint?: string[] | null;
  cmd?: string[] | null;
  layers: ImageLayer[];
  labels: Record<string, string>;
  is_demo: boolean;
}

export interface DiagnosticItem {
  id: string;
  rule_id: string;
  severity: Severity;
  title: string;
  explanation: string;
  service?: string | null;
  path?: string | null;
  suggested_remediation: string;
  auto_fix_available: boolean;
}

export interface DiagnosticsReport {
  total_issues: number;
  errors_count: number;
  warnings_count: number;
  info_count: number;
  items: DiagnosticItem[];
}

export interface ComposeServiceConfig {
  name: string;
  image?: string | null;
  build?: any;
  ports: string[];
  volumes: string[];
  environment: Record<string, string>;
  depends_on: string[];
  networks: string[];
  healthcheck?: Record<string, any> | null;
  restart?: string | null;
  command?: any;
  entrypoint?: any;
  privileged: boolean;
}

export interface ComposeGraphNode {
  id: string;
  name: string;
  image?: string | null;
  ports: string[];
  dependency_count: number;
  issues_count: number;
  status: string;
  missing_dependencies: string[];
}

export interface ComposeGraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  is_valid: boolean;
  error_detail?: string | null;
}

export interface ComposeValidationResponse {
  is_valid: boolean;
  services_count: number;
  services: ComposeServiceConfig[];
  nodes: ComposeGraphNode[];
  edges: ComposeGraphEdge[];
  diagnostics: DiagnosticItem[];
  raw_yaml: string;
  project_name?: string;
}

export interface LogLine {
  timestamp?: string | null;
  stream: 'stdout' | 'stderr' | 'unknown';
  message: string;
}

export interface ContainerLogsResponse {
  container_id: string;
  container_name?: string | null;
  tail: number;
  total_lines: number;
  logs: LogLine[];
  is_demo: boolean;
}

export interface ConsoleEvent {
  id: string;
  timestamp: string;
  type: 'info' | 'success' | 'warn' | 'error';
  category: 'Docker' | 'Diagnostics' | 'Compose' | 'Container';
  message: string;
}
