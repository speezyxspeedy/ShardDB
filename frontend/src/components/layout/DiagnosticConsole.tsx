import React, { useState } from 'react';
import { Terminal, ChevronUp, ChevronDown, Trash2, CheckCircle2, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { ConsoleEvent } from '../../types';

interface DiagnosticConsoleProps {
  events: ConsoleEvent[];
  onClear: () => void;
}

export const DiagnosticConsole: React.FC<DiagnosticConsoleProps> = ({ events, onClear }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getEventIcon = (type: ConsoleEvent['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={13} color="var(--color-success)" />;
      case 'warn':
        return <AlertTriangle size={13} color="var(--color-warning)" />;
      case 'error':
        return <AlertCircle size={13} color="var(--color-error)" />;
      default:
        return <Info size={13} color="var(--docker-blue)" />;
    }
  };

  return (
    <div
      className="bottom-console"
      style={{
        height: isExpanded ? '200px' : '36px',
      }}
    >
      <div className="console-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="console-title">
          <Terminal size={14} color="var(--docker-blue)" />
          <span>DevOps Inspection Console</span>
          <span
            style={{
              padding: '1px 6px',
              borderRadius: '999px',
              backgroundColor: 'var(--bg-main)',
              fontSize: '10px',
              color: 'var(--text-secondary)',
            }}
          >
            {events.length} events
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={(e) => e.stopPropagation()}>
          {isExpanded && (
            <button
              onClick={onClear}
              className="btn btn-sm"
              style={{ padding: '2px 6px', fontSize: '10px' }}
              title="Clear event log"
            >
              <Trash2 size={11} />
              <span>Clear</span>
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="btn btn-sm"
            style={{ padding: '2px 6px' }}
            aria-label={isExpanded ? 'Collapse console' : 'Expand console'}
          >
            {isExpanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="console-body">
          {events.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', padding: '12px 0' }}>
              No diagnostic or inspection events recorded yet. Perform actions to see real-time output.
            </div>
          ) : (
            events.map((evt) => (
              <div key={evt.id} className="console-log-row">
                <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>{evt.timestamp}</span>
                <span style={{ display: 'inline-flex', alignItems: 'center' }}>{getEventIcon(evt.type)}</span>
                <span
                  style={{
                    color: 'var(--docker-blue)',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    fontSize: '10px',
                  }}
                >
                  [{evt.category}]
                </span>
                <span style={{ color: 'var(--text-primary)' }}>{evt.message}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
