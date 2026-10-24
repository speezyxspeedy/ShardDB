import React, { useState } from 'react';
import {
  Play,
  Save,
  CheckSquare,
  Sparkles,
  Download,
  Upload,
  RotateCcw,
  HelpCircle,
  Loader2,
  Edit2,
  Check,
  Undo2,
  Redo2,
  Layers
} from 'lucide-react';
import type { Workflow, ViewMode } from '../../types';

interface HeaderToolbarProps {
  currentWorkflow: Workflow | null;
  onUpdateWorkflowMeta: (name: string, description: string) => void;
  onSaveWorkflow: () => void;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  onExecuteWorkflow: () => void;
  isRunning: boolean;
  onValidateWorkflow: () => void;
  isValidating: boolean;
  onOpenTemplates: () => void;
  onExportJson: () => void;
  onImportJson: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearCanvas: () => void;
  onOpenShortcuts: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  viewMode: ViewMode;
  onNavigate: (mode: ViewMode) => void;
}

export const HeaderToolbar: React.FC<HeaderToolbarProps> = ({
  currentWorkflow,
  onUpdateWorkflowMeta,
  onSaveWorkflow,
  isSaving,
  hasUnsavedChanges,
  onExecuteWorkflow,
  isRunning,
  onValidateWorkflow,
  isValidating,
  onOpenTemplates,
  onExportJson,
  onImportJson,
  onClearCanvas,
  onOpenShortcuts,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  viewMode,
  onNavigate
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState('');

  const startEditTitle = () => {
    setTitleInput(currentWorkflow?.name || 'Untitled Workflow');
    setIsEditingTitle(true);
  };

  const finishEditTitle = () => {
    if (titleInput.trim()) {
      onUpdateWorkflowMeta(titleInput.trim(), currentWorkflow?.description || '');
    }
    setIsEditingTitle(false);
  };

  return (
    <header
      style={{
        height: 'var(--header-height)',
        background: '#FFFFFF',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        zIndex: 20,
        flexShrink: 0
      }}
    >
      {/* Left: Brand Identity & Workflow Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* NodeFlow Logo */}
        <div
          onClick={() => onNavigate('dashboard')}
          style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
          title="Return to Dashboard"
        >
          <div
            style={{
              width: 30,
              height: 30,
              background: 'var(--text-primary)',
              borderRadius: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-orange)',
              fontFamily: 'var(--font-mono)',
              fontWeight: 800,
              fontSize: 14,
              letterSpacing: '-0.05em'
            }}
          >
            NF
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, fontFamily: 'var(--font-display)', letterSpacing: '-0.03em', lineHeight: 1 }}>
              NodeFlow<span style={{ color: 'var(--accent-orange)' }}>.</span>
            </div>
            <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', letterSpacing: '0.04em' }}>
              INDUSTRIAL BLUEPRINT
            </div>
          </div>
        </div>

        <div style={{ width: 1, height: 24, background: 'var(--border-subtle)' }} />

        {/* Workflow Title & Edit */}
        {viewMode === 'editor' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {isEditingTitle ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input
                  type="text"
                  value={titleInput}
                  onChange={e => setTitleInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') finishEditTitle();
                    if (e.key === 'Escape') setIsEditingTitle(false);
                  }}
                  autoFocus
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    fontFamily: 'var(--font-display)',
                    padding: '3px 8px',
                    width: 220
                  }}
                />
                <button onClick={finishEditTitle} className="btn-icon" style={{ width: 26, height: 26, color: 'var(--status-success)' }}>
                  <Check size={14} />
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span
                  onClick={startEditTitle}
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    fontFamily: 'var(--font-display)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    maxWidth: 240,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                  title="Click to rename workflow"
                >
                  {currentWorkflow?.name || 'Untitled Workflow'}
                </span>
                <button
                  onClick={startEditTitle}
                  title="Edit title"
                  style={{ color: 'var(--text-dim)', padding: 2 }}
                >
                  <Edit2 size={12} />
                </button>
              </div>
            )}

            {/* Unsaved Changes Indicator */}
            {hasUnsavedChanges ? (
              <span
                style={{
                  fontSize: 10,
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--status-warning)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--status-warning)' }} />
                Unsaved Changes
              </span>
            ) : (
              <span
                style={{
                  fontSize: 10,
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--status-success)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--status-success)' }} />
                Saved
              </span>
            )}
          </div>
        )}

        {viewMode === 'dashboard' && (
          <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
            Workflow Dashboard
          </div>
        )}

        {viewMode === 'history' && (
          <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
            Execution History & Logs
          </div>
        )}

        {viewMode === 'workflow-details' && (
          <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
            Workflow Details
          </div>
        )}
      </div>

      {/* Center / Editor Tools */}
      {viewMode === 'editor' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {onUndo && (
            <button
              onClick={onUndo}
              disabled={!canUndo}
              title="Undo Graph Edit (Ctrl+Z)"
              className="btn-icon"
              style={{ width: 28, height: 28 }}
            >
              <Undo2 size={14} />
            </button>
          )}

          {onRedo && (
            <button
              onClick={onRedo}
              disabled={!canRedo}
              title="Redo Graph Edit (Ctrl+Y)"
              className="btn-icon"
              style={{ width: 28, height: 28 }}
            >
              <Redo2 size={14} />
            </button>
          )}

          <div style={{ width: 1, height: 18, background: 'var(--border-subtle)', margin: '0 4px' }} />

          <button
            onClick={onValidateWorkflow}
            disabled={isValidating}
            title="Validate Directed Acyclic Graph structure"
            className="btn-secondary"
            style={{ fontSize: 11, padding: '5px 10px', height: 30 }}
          >
            {isValidating ? <Loader2 size={12} className="spin" /> : <CheckSquare size={13} color="var(--accent-cobalt)" />}
            <span>Validate DAG</span>
          </button>

          <button
            onClick={onOpenTemplates}
            title="Open Starter Templates"
            className="btn-secondary"
            style={{ fontSize: 11, padding: '5px 10px', height: 30 }}
          >
            <Sparkles size={13} color="var(--accent-orange)" />
            <span>Templates</span>
          </button>

          <button
            onClick={onExportJson}
            title="Export workflow graph as JSON file"
            className="btn-icon"
            style={{ width: 28, height: 28 }}
          >
            <Download size={14} />
          </button>

          <label
            title="Import workflow graph from JSON file"
            className="btn-icon"
            style={{ width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Upload size={14} />
            <input type="file" accept=".json" onChange={onImportJson} style={{ display: 'none' }} />
          </label>

          <button
            onClick={onClearCanvas}
            title="Clear canvas"
            className="btn-icon"
            style={{ width: 28, height: 28 }}
          >
            <RotateCcw size={14} />
          </button>
        </div>
      )}

      {/* Right: Actions (Save & Run) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          onClick={onOpenShortcuts}
          title="Keyboard shortcuts"
          className="btn-icon"
          style={{ width: 30, height: 30 }}
        >
          <HelpCircle size={15} />
        </button>

        {viewMode === 'editor' && (
          <>
            <button
              onClick={onSaveWorkflow}
              disabled={isSaving}
              className="btn-secondary"
              style={{ fontSize: 11, padding: '6px 12px', height: 32 }}
            >
              {isSaving ? <Loader2 size={13} className="spin" /> : <Save size={13} />}
              <span>{isSaving ? 'Saving...' : 'Save'}</span>
            </button>

            <button
              onClick={onExecuteWorkflow}
              disabled={isRunning}
              className="btn-primary"
              style={{ fontSize: 11, padding: '6px 14px', height: 32 }}
            >
              {isRunning ? <Loader2 size={13} className="spin" /> : <Play size={13} fill="#FFFFFF" />}
              <span>{isRunning ? 'Executing...' : 'Run Workflow'}</span>
            </button>
          </>
        )}

        {viewMode !== 'editor' && (
          <button
            onClick={() => onNavigate('editor')}
            className="btn-primary"
            style={{ fontSize: 11, padding: '6px 14px', height: 32 }}
          >
            <Layers size={13} />
            <span>Open Canvas</span>
          </button>
        )}
      </div>
    </header>
  );
};
