import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  Download,
  Play,
  Network,
  FileCode,
  AlertTriangle,
  CheckCircle2,
  FileText,
  RefreshCw,
} from 'lucide-react';
import {
  validateComposeYaml,
  uploadComposeFile,
  fetchSampleTemplates,
} from '../../services/api';
import { ComposeValidationResponse, ComposeServiceConfig } from '../../types';
import { ComposeGraph } from './ComposeGraph';
import { Badge } from '../../components/common/Badge';

interface ComposeViewProps {
  onSelectService: (service: ComposeServiceConfig) => void;
  onEmitEvent?: (category: 'Docker' | 'Diagnostics' | 'Compose' | 'Container', type: 'info' | 'success' | 'warn' | 'error', message: string) => void;
}

const DEFAULT_SAMPLE_YAML = `version: '3.8'

services:
  web:
    image: nginx:latest
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - api
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    restart: unless-stopped

  api:
    image: myorg/payment-service:v2.4.1
    ports:
      - "8080:8080"
    depends_on:
      - cache
      - database
      - auth-service  # Note: auth-service is missing in this compose file!
    environment:
      DATABASE_URL: "postgresql://dbuser:supersecretpass123@database:5432/payments"
      REDIS_HOST: "cache"
      NODE_ENV: "production"
      API_KEY: "ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
    restart: on-failure

  cache:
    image: redis:7.2-alpine
    ports:
      - "6379:6379"  # Sensitive port exposed to host!
    volumes:
      - redis-data:/data

  database:
    image: postgres:16-alpine
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: "dbuser"
      POSTGRES_PASSWORD: "supersecretpass123"
      POSTGRES_DB: "payments"
    volumes:
      - db-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U dbuser -d payments"]
      interval: 10s
      timeout: 5s
      retries: 5

  monitoring:
    image: prom/prometheus:v2.50.0
    ports:
      - "9090:9090"
    privileged: true  # Risky privileged mode!
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro  # Docker socket mount!

volumes:
  db-data:
  redis-data:
`;

export const ComposeView: React.FC<ComposeViewProps> = ({ onSelectService, onEmitEvent }) => {
  const [yamlContent, setYamlContent] = useState<string>(DEFAULT_SAMPLE_YAML);
  const [activeTab, setActiveTab] = useState<'graph' | 'yaml' | 'split'>('split');
  const [validationResult, setValidationResult] = useState<ComposeValidationResponse | null>(null);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [samples, setSamples] = useState<Record<string, string>>({});
  const [selectedServiceName, setSelectedServiceName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load sample templates on mount
  useEffect(() => {
    fetchSampleTemplates()
      .then((data) => setSamples(data))
      .catch(() => {});
    handleValidate(DEFAULT_SAMPLE_YAML);
  }, []);

  const handleValidate = async (contentToValidate?: string) => {
    const text = contentToValidate ?? yamlContent;
    setIsValidating(true);
    try {
      const res = await validateComposeYaml(text, 'compose-project');
      setValidationResult(res);
      if (onEmitEvent) {
        if (res.is_valid) {
          onEmitEvent('Compose', 'success', `Compose validated successfully: ${res.services_count} services parsed.`);
        } else {
          onEmitEvent('Compose', 'warn', `Compose validation completed with ${res.diagnostics.length} findings.`);
        }
      }
    } catch (err: any) {
      if (onEmitEvent) {
        onEmitEvent('Compose', 'error', `Validation error: ${err.message}`);
      }
    } finally {
      setIsValidating(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      setYamlContent(text);
      await handleValidate(text);
      if (onEmitEvent) {
        onEmitEvent('Compose', 'info', `Loaded Compose file from disk: ${file.name}`);
      }
    } catch (err: any) {
      alert(`Failed to load file: ${err.message}`);
    }
  };

  const handleExportYaml = () => {
    const blob = new Blob([yamlContent], { type: 'text/yaml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'docker-compose.validated.yml';
    link.click();
    URL.revokeObjectURL(url);
    if (onEmitEvent) {
      onEmitEvent('Compose', 'info', 'Exported validated YAML file');
    }
  };

  const handleSelectServiceFromGraph = (serviceName: string) => {
    setSelectedServiceName(serviceName);
    const found = validationResult?.services.find((s) => s.name === serviceName);
    if (found) {
      onSelectService(found);
    }
  };

  return (
    <div className="content-area" style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingBottom: '40px' }}>
      <div className="view-header" style={{ marginBottom: '14px' }}>
        <div className="view-title-group">
          <h1>
            <span>ComposeCraft — Visual Project Explorer</span>
            {validationResult && (
              <Badge variant={validationResult.is_valid ? 'running' : 'warning'}>
                {validationResult.is_valid ? 'Valid Specification' : `${validationResult.diagnostics.filter(d => d.severity === 'error').length} Errors`}
              </Badge>
            )}
          </h1>
          <div className="view-description">
            Interactive topology mapping, depends_on dependency analysis, and offline syntax verification.
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Sample template selector */}
          {Object.keys(samples).length > 0 && (
            <select
              className="btn btn-sm"
              style={{ padding: '5px 8px', outline: 'none' }}
              onChange={(e) => {
                const chosen = samples[e.target.value];
                if (chosen) {
                  setYamlContent(chosen);
                  handleValidate(chosen);
                }
              }}
              defaultValue="microservices"
              id="compose-sample-select"
            >
              <option value="microservices">Template: Microservices (With Issues)</option>
              <option value="basic">Template: Basic Clean Service</option>
            </select>
          )}

          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept=".yml,.yaml"
            onChange={handleFileUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn btn-sm"
            title="Import Compose file from local disk"
            id="btn-import-compose"
          >
            <Upload size={13} />
            <span>Import</span>
          </button>

          <button
            onClick={handleExportYaml}
            className="btn btn-sm"
            title="Export YAML configuration"
            id="btn-export-compose"
          >
            <Download size={13} />
            <span>Export</span>
          </button>

          <button
            onClick={() => handleValidate()}
            className="btn btn-sm btn-primary"
            disabled={isValidating}
            id="btn-validate-compose"
          >
            <Play size={13} />
            <span>{isValidating ? 'Validating...' : 'Analyze & Render'}</span>
          </button>
        </div>
      </div>

      {/* View Toggle Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 14px',
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderBottom: 'none',
          borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
        }}
      >
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            className={`btn btn-sm ${activeTab === 'split' ? 'btn-primary' : ''}`}
            onClick={() => setActiveTab('split')}
          >
            Split View (Editor + Graph)
          </button>
          <button
            className={`btn btn-sm ${activeTab === 'graph' ? 'btn-primary' : ''}`}
            onClick={() => setActiveTab('graph')}
          >
            <Network size={13} />
            <span>Graph Only</span>
          </button>
          <button
            className={`btn btn-sm ${activeTab === 'yaml' ? 'btn-primary' : ''}`}
            onClick={() => setActiveTab('yaml')}
          >
            <FileCode size={13} />
            <span>YAML Only</span>
          </button>
        </div>

        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
          {validationResult?.services_count ?? 0} Services detected •{' '}
          {validationResult?.edges.length ?? 0} Dependencies mapped
        </div>
      </div>

      {/* Main Workspace (Split or Solo) */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          border: '1px solid var(--border-color)',
          borderRadius: '0 0 var(--radius-md) var(--radius-md)',
          overflow: 'hidden',
          backgroundColor: 'var(--bg-secondary)',
          minHeight: '480px',
        }}
      >
        {/* YAML Editor Panel */}
        {(activeTab === 'split' || activeTab === 'yaml') && (
          <div
            style={{
              flex: activeTab === 'split' ? 0.45 : 1,
              display: 'flex',
              flexDirection: 'column',
              borderRight: activeTab === 'split' ? '1px solid var(--border-color)' : 'none',
              backgroundColor: 'var(--bg-main)',
            }}
          >
            <div
              style={{
                padding: '6px 12px',
                backgroundColor: 'var(--bg-elevated)',
                borderBottom: '1px solid var(--border-color)',
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <FileText size={13} />
              <span>Compose YAML Editor</span>
            </div>
            <textarea
              value={yamlContent}
              onChange={(e) => setYamlContent(e.target.value)}
              style={{
                flex: 1,
                padding: '12px 14px',
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                lineHeight: 1.6,
                backgroundColor: 'var(--bg-main)',
                color: 'var(--text-primary)',
                border: 'none',
                outline: 'none',
                resize: 'none',
                whiteSpace: 'pre',
                tabSize: 2,
              }}
              spellCheck={false}
              id="compose-textarea"
            />
          </div>
        )}

        {/* Visual Graph Panel */}
        {(activeTab === 'split' || activeTab === 'graph') && (
          <div
            style={{
              flex: activeTab === 'split' ? 0.55 : 1,
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
            }}
          >
            <div
              style={{
                padding: '6px 12px',
                backgroundColor: 'var(--bg-elevated)',
                borderBottom: '1px solid var(--border-color)',
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Network size={13} color="var(--accent-lime)" />
                <span>Service Dependency Topology</span>
              </div>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'none' }}>
                Click any service card to inspect configuration
              </span>
            </div>

            <div style={{ flex: 1, position: 'relative' }}>
              <ComposeGraph
                nodesData={validationResult?.nodes || []}
                edgesData={validationResult?.edges || []}
                onSelectService={handleSelectServiceFromGraph}
                selectedServiceName={selectedServiceName}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
