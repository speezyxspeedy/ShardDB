import React, { useState } from 'react';
import {
  Search,
  ChevronDown,
  ChevronRight,
  Plus,
  Play,
  FileText,
  GitBranch,
  Clock,
  Sparkles,
  Calculator,
  Globe,
  Smile,
  ScrollText,
  Bell,
  Download,
  HelpCircle,
  PanelLeftClose,
  PanelLeftOpen,
  GripVertical
} from 'lucide-react';
import type { NodeDefinition, NodeCategory } from '../../types';

const ICON_MAP: Record<string, React.FC<{ size?: number; className?: string; style?: React.CSSProperties }>> = {
  Play,
  FileText,
  GitBranch,
  Clock,
  Sparkles,
  Calculator,
  Globe,
  Smile,
  ScrollText,
  Bell,
  Download
};

const CATEGORY_STYLES: Record<string, { tag: string; color: string }> = {
  Trigger: { tag: 'TRIGGER', color: '#FF5A1F' },
  Input: { tag: 'INPUT', color: '#315BDB' },
  Logic: { tag: 'LOGIC', color: '#D97706' },
  Transform: { tag: 'TRANSFORM', color: '#FF5A1F' },
  Aggregator: { tag: 'AGGREGATE', color: '#315BDB' },
  Output: { tag: 'OUTPUT', color: '#1B7F48' }
};

interface NodeCatalogSidebarProps {
  definitions: NodeDefinition[];
  onAddNode: (type: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const NodeCatalogSidebar: React.FC<NodeCatalogSidebarProps> = ({
  definitions,
  onAddNode,
  collapsed,
  onToggleCollapse
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    Trigger: true,
    Input: true,
    Logic: true,
    Transform: true,
    Output: true
  });

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const categories: NodeCategory[] = ['Trigger', 'Input', 'Logic', 'Transform', 'Output'];

  const filteredDefinitions = definitions.filter(d =>
    d.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (collapsed) {
    return (
      <div
        style={{
          width: 44,
          background: '#FFFFFF',
          borderRight: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '12px 0',
          gap: 12,
          zIndex: 10
        }}
      >
        <button
          onClick={onToggleCollapse}
          title="Open Node Library"
          className="btn-icon"
          style={{ width: 32, height: 32 }}
        >
          <PanelLeftOpen size={16} />
        </button>
        <div
          style={{
            writingMode: 'vertical-rl',
            transform: 'rotate(180deg)',
            fontSize: 10,
            fontFamily: 'var(--font-mono)',
            letterSpacing: '0.1em',
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            marginTop: 8
          }}
        >
          Node Catalog
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        width: 270,
        background: '#FFFFFF',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        zIndex: 10
      }}
    >
      {/* Sidebar Header */}
      <div
        style={{
          padding: '12px 14px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#FAF9F5'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--accent-orange)', fontWeight: 700 }}>
            [CATALOG]
          </span>
          <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-display)' }}>
            Node Library
          </span>
        </div>
        <button
          onClick={onToggleCollapse}
          title="Collapse Panel"
          className="btn-icon"
          style={{ width: 24, height: 24 }}
        >
          <PanelLeftClose size={15} />
        </button>
      </div>

      {/* Search Input */}
      <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ position: 'relative' }}>
          <Search
            size={13}
            style={{
              position: 'absolute',
              left: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-dim)'
            }}
          />
          <input
            type="text"
            placeholder="Search nodes..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              paddingLeft: 30,
              paddingRight: 8,
              paddingTop: 6,
              paddingBottom: 6,
              fontSize: 12,
              background: '#FAF9F5'
            }}
          />
        </div>
      </div>

      {/* Node Catalog List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px' }}>
        {searchTerm ? (
          <div>
            <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', marginBottom: 8 }}>
              {filteredDefinitions.length} matching nodes
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {filteredDefinitions.map(def => (
                <NodeCatalogItem
                  key={def.type}
                  def={def}
                  onAdd={() => onAddNode(def.type)}
                  onDragStart={e => onDragStart(e, def.type)}
                />
              ))}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {categories.map(cat => {
              const catNodes = definitions.filter(d => d.category === cat);
              if (catNodes.length === 0) return null;
              const isExpanded = expandedCategories[cat] !== false;
              const catStyle = CATEGORY_STYLES[cat] || { tag: cat.toUpperCase(), color: '#777970' };

              return (
                <div key={cat}>
                  <button
                    onClick={() => toggleCategory(cat)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '4px 0',
                      marginBottom: 6,
                      fontSize: 11,
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      color: 'var(--text-secondary)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                      <span style={{ color: catStyle.color }}>[{catStyle.tag}]</span>
                      <span>{cat}</span>
                    </div>
                    <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>
                      {catNodes.length}
                    </span>
                  </button>

                  {isExpanded && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 6 }}>
                      {catNodes.map(def => (
                        <NodeCatalogItem
                          key={def.type}
                          def={def}
                          onAdd={() => onAddNode(def.type)}
                          onDragStart={e => onDragStart(e, def.type)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div
        style={{
          padding: '8px 12px',
          borderTop: '1px solid var(--border-subtle)',
          background: '#FAF9F5',
          fontSize: 10,
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <span>Drag or click + to add</span>
        <span style={{ color: 'var(--accent-orange)' }}>● {definitions.length} nodes</span>
      </div>
    </div>
  );
};

interface NodeCatalogItemProps {
  def: NodeDefinition;
  onAdd: () => void;
  onDragStart: (e: React.DragEvent) => void;
}

const NodeCatalogItem: React.FC<NodeCatalogItemProps> = ({ def, onAdd, onDragStart }) => {
  const IconComponent = (def.icon && ICON_MAP[def.icon]) || HelpCircle;

  return (
    <div
      draggable
      onDragStart={onDragStart}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '7px 8px',
        background: '#FFFFFF',
        border: '1px solid var(--border-subtle)',
        borderRadius: 4,
        cursor: 'grab',
        transition: 'all 0.15s ease'
      }}
      className="catalog-item"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
        <GripVertical size={12} style={{ color: 'var(--text-dim)', flexShrink: 0 }} />
        <div
          style={{
            width: 20,
            height: 20,
            borderRadius: 3,
            background: '#FAF9F5',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: def.color || 'var(--text-primary)',
            flexShrink: 0
          }}
        >
          <IconComponent size={12} />
        </div>
        <div style={{ overflow: 'hidden' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {def.label}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {def.description}
          </div>
        </div>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onAdd();
        }}
        title="Add to Canvas"
        style={{
          width: 22,
          height: 22,
          borderRadius: 3,
          background: '#FAF9F5',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          color: 'var(--text-primary)'
        }}
      >
        <Plus size={12} />
      </button>
    </div>
  );
};
