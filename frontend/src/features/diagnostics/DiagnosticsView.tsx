import React, { useState, useEffect } from 'react';
import {
  Stethoscope,
  AlertTriangle,
  AlertCircle,
  Info,
  ShieldCheck,
  Filter,
  CheckCircle2,
  HelpCircle,
  Play,
} from 'lucide-react';
import { analyzeDiagnostics, fetchSampleTemplates } from '../../services/api';
import { DiagnosticsReport, DiagnosticItem, Severity } from '../../types';
import { Badge } from '../../components/common/Badge';

interface DiagnosticsViewProps {
  onEmitEvent?: (category: 'Docker' | 'Diagnostics' | 'Compose' | 'Container', type: 'info' | 'success' | 'warn' | 'error', message: string) => void;
}

export const DiagnosticsView: React.FC<DiagnosticsViewProps> = ({ onEmitEvent }) => {
  const [report, setReport] = useState<DiagnosticsReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [severityFilter, setSeverityFilter] = useState<'all' | Severity>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [yamlInput, setYamlInput] = useState<string>('');
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  useEffect(() => {
    // Initial analysis using default sample template
    fetchSampleTemplates().then((samples) => {
      const defaultYaml = samples['microservices'] || '';
      setYamlInput(defaultYaml);
      runAnalysis(defaultYaml);
    });
  }, []);

  const runAnalysis = async (yamlToRun?: string) => {
    const text = yamlToRun ?? yamlInput;
    setIsLoading(true);
    try {
      const res = await analyzeDiagnostics(text);
      setReport(res);
      if (onEmitEvent) {
        onEmitEvent(
          'Diagnostics',
          res.errors_count > 0 ? 'error' : res.warnings_count > 0 ? 'warn' : 'success',
          `Analysis finished: ${res.total_issues} findings (${res.errors_count} errors, ${res.warnings_count} warnings, ${res.info_count} info)`
        );
      }
    } catch (err: any) {
      if (onEmitEvent) {
        onEmitEvent('Diagnostics', 'error', `Diagnostic scan failed: ${err.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const servicesList = Array.from(
    new Set(report?.items.map((i) => i.service).filter(Boolean) as string[])
  );

  const filteredItems = (report?.items || []).filter((item) => {
    if (severityFilter !== 'all' && item.severity !== severityFilter) return false;
    if (serviceFilter !== 'all' && item.service !== serviceFilter) return false;
    return true;
  });

  const getSeverityIcon = (sev: Severity) => {
    switch (sev) {
      case 'error':
        return <AlertCircle size={16} color="var(--color-error)" />;
      case 'warning':
        return <AlertTriangle size={16} color="var(--color-warning)" />;
      default:
        return <Info size={16} color="var(--docker-blue)" />;
    }
  };

  return (
    <div className="content-area">
      <div className="view-header">
        <div className="view-title-group">
          <h1>
            <span>DockSight Doctor — Configuration Diagnostics</span>
            {report && (
              <span className="badge badge-info">
                {report.total_issues} Finding{report.total_issues === 1 ? '' : 's'}
              </span>
            )}
          </h1>
          <div className="view-description">
            Static linting engine detecting syntax anomalies, missing dependencies, port collisions, and security risks.
          </div>
        </div>

        <button
          onClick={() => setIsEditorOpen(!isEditorOpen)}
          className="btn btn-sm btn-primary"
          id="btn-toggle-diagnostics-editor"
        >
          {isEditorOpen ? 'Hide YAML Source' : 'Edit / Paste YAML for Inspection'}
        </button>
      </div>

      {/* Accuracy & Static Analysis Notice */}
      <div
        style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 16px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <ShieldCheck size={18} color="var(--docker-blue)" />
        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
          <strong>DevOps Static Analysis Notice:</strong> DockSight Doctor performs conservative static rule checks on Compose syntax and declarations without executing containers. Static analysis flags potential risks and best practices, but does not replace comprehensive runtime vulnerability scanning or formal security audits.
        </div>
      </div>

      {/* Quick YAML Editor Drawer */}
      {isEditorOpen && (
        <div
          style={{
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '16px',
            marginBottom: '20px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Inspect Compose YAML Directly
            </span>
            <button
              onClick={() => runAnalysis()}
              className="btn btn-sm btn-primary"
              disabled={isLoading}
              id="btn-run-diagnostics"
            >
              <Play size={13} />
              <span>{isLoading ? 'Scanning...' : 'Run Diagnostics Scan'}</span>
            </button>
          </div>
          <textarea
            value={yamlInput}
            onChange={(e) => setYamlInput(e.target.value)}
            style={{
              width: '100%',
              height: '180px',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              padding: '10px',
              backgroundColor: 'var(--bg-main)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              outline: 'none',
              resize: 'vertical',
            }}
            placeholder="Paste Docker Compose YAML here to analyze..."
          />
        </div>
      )}

      {/* Metrics Banner */}
      <div className="stats-grid" style={{ marginBottom: '20px' }}>
        <div
          className="stat-card"
          style={{
            borderColor: severityFilter === 'error' ? 'var(--color-error)' : 'var(--border-color)',
            cursor: 'pointer',
          }}
          onClick={() => setSeverityFilter(severityFilter === 'error' ? 'all' : 'error')}
        >
          <div className="stat-icon-wrap" style={{ backgroundColor: 'var(--color-error-bg)' }}>
            <AlertCircle size={20} color="var(--color-error)" />
          </div>
          <div>
            <div className="stat-value" style={{ color: 'var(--color-error)' }}>
              {report?.errors_count ?? 0}
            </div>
            <div className="stat-label">Configuration Errors</div>
          </div>
        </div>

        <div
          className="stat-card"
          style={{
            borderColor: severityFilter === 'warning' ? 'var(--color-warning)' : 'var(--border-color)',
            cursor: 'pointer',
          }}
          onClick={() => setSeverityFilter(severityFilter === 'warning' ? 'all' : 'warning')}
        >
          <div className="stat-icon-wrap" style={{ backgroundColor: 'var(--color-warning-bg)' }}>
            <AlertTriangle size={20} color="var(--color-warning)" />
          </div>
          <div>
            <div className="stat-value" style={{ color: 'var(--color-warning)' }}>
              {report?.warnings_count ?? 0}
            </div>
            <div className="stat-label">Warnings & Best Practices</div>
          </div>
        </div>

        <div
          className="stat-card"
          style={{
            borderColor: severityFilter === 'info' ? 'var(--docker-blue)' : 'var(--border-color)',
            cursor: 'pointer',
          }}
          onClick={() => setSeverityFilter(severityFilter === 'info' ? 'all' : 'info')}
        >
          <div className="stat-icon-wrap" style={{ backgroundColor: 'var(--docker-blue-subtle)' }}>
            <Info size={20} color="var(--docker-blue)" />
          </div>
          <div>
            <div className="stat-value" style={{ color: 'var(--docker-blue)' }}>
              {report?.info_count ?? 0}
            </div>
            <div className="stat-label">Informational Hints</div>
          </div>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '10px 16px',
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderBottom: 'none',
          borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
        }}
      >
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
            Filter:
          </span>
          <button
            className={`btn btn-sm ${severityFilter === 'all' ? 'btn-primary' : ''}`}
            onClick={() => setSeverityFilter('all')}
          >
            All Severities ({report?.total_issues ?? 0})
          </button>
          <button
            className={`btn btn-sm ${severityFilter === 'error' ? 'btn-danger' : ''}`}
            onClick={() => setSeverityFilter('error')}
          >
            Errors ({report?.errors_count ?? 0})
          </button>
          <button
            className={`btn btn-sm ${severityFilter === 'warning' ? 'btn-primary' : ''}`}
            onClick={() => setSeverityFilter('warning')}
          >
            Warnings ({report?.warnings_count ?? 0})
          </button>
          <button
            className={`btn btn-sm ${severityFilter === 'info' ? 'btn-primary' : ''}`}
            onClick={() => setSeverityFilter('info')}
          >
            Info ({report?.info_count ?? 0})
          </button>
        </div>

        {/* Filter by service */}
        {servicesList.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Service:</span>
            <select
              className="btn btn-sm"
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              style={{ outline: 'none' }}
              id="diagnostic-service-filter"
            >
              <option value="all">All Services</option>
              {servicesList.map((svc) => (
                <option key={svc} value={svc}>{svc}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Findings List */}
      <div
        style={{
          border: '1px solid var(--border-color)',
          borderRadius: '0 0 var(--radius-md) var(--radius-md)',
          backgroundColor: 'var(--bg-secondary)',
          overflow: 'hidden',
        }}
      >
        {isLoading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Running static rule analyzers...
          </div>
        ) : filteredItems.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <CheckCircle2 size={32} color="var(--color-success)" style={{ marginBottom: '8px' }} />
            <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>No issues found matching active filters!</div>
            <div style={{ fontSize: '12px', marginTop: '4px' }}>Your Docker Compose configuration passes selected checks.</div>
          </div>
        ) : (
          filteredItems.map((item, index) => (
            <div
              key={item.id}
              style={{
                padding: '16px 20px',
                borderBottom: index < filteredItems.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                display: 'flex',
                gap: '14px',
              }}
            >
              <div style={{ marginTop: '2px' }}>{getSeverityIcon(item.severity)}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span className="mono" style={{ fontSize: '11px', color: 'var(--docker-blue)', fontWeight: 600 }}>
                    [{item.rule_id}]
                  </span>
                  <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>
                    {item.title}
                  </span>
                  <Badge variant={item.severity === 'error' ? 'error' : item.severity === 'warning' ? 'warning' : 'info'}>
                    {item.severity}
                  </Badge>
                  {item.service && (
                    <span className="mono" style={{ fontSize: '10px', color: 'var(--accent-lime)' }}>
                      service: {item.service}
                    </span>
                  )}
                </div>

                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px', lineHeight: 1.5 }}>
                  {item.explanation}
                </div>

                {item.path && (
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    Path: <code className="mono">{item.path}</code>
                  </div>
                )}

                <div
                  style={{
                    backgroundColor: 'var(--bg-main)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '8px 12px',
                    fontSize: '11px',
                    lineHeight: 1.5,
                  }}
                >
                  <span style={{ fontWeight: 600, color: 'var(--accent-lime)' }}>Remediation: </span>
                  <span style={{ color: 'var(--text-primary)' }}>{item.suggested_remediation}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
