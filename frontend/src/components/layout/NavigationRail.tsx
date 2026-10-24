import React from 'react';
import {
  LayoutGrid,
  GitBranch,
  Clock,
  Sparkles
} from 'lucide-react';
import type { ViewMode } from '../../types';

interface NavigationRailProps {
  currentView: ViewMode;
  onNavigate: (view: ViewMode) => void;
  onOpenTemplates: () => void;
  systemHealthy: boolean;
}

export const NavigationRail: React.FC<NavigationRailProps> = ({
  currentView,
  onNavigate,
  onOpenTemplates,
  systemHealthy
}) => {
  const navItems = [
    {
      id: 'dashboard' as ViewMode,
      label: 'Workflows Dashboard',
      icon: LayoutGrid
    },
    {
      id: 'editor' as ViewMode,
      label: 'Canvas Editor',
      icon: GitBranch
    },
    {
      id: 'history' as ViewMode,
      label: 'Execution History',
      icon: Clock
    }
  ];

  return (
    <aside
      style={{
        width: 'var(--nav-rail-width)',
        height: '100%',
        background: '#FFFFFF',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '12px 0',
        zIndex: 25,
        flexShrink: 0,
        justifyContent: 'space-between'
      }}
    >
      {/* Top Nav Items */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              title={item.label}
              style={{
                width: 38,
                height: 38,
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: isActive ? 'var(--text-primary)' : 'transparent',
                color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
                border: isActive ? '1px solid var(--text-primary)' : '1px solid transparent',
                transition: 'all 0.15s ease'
              }}
            >
              <Icon size={18} />
            </button>
          );
        })}

        <div style={{ width: 24, height: 1, background: 'var(--border-subtle)', margin: '4px 0' }} />

        {/* Templates Quick Button */}
        <button
          onClick={onOpenTemplates}
          title="Starter Templates"
          style={{
            width: 38,
            height: 38,
            borderRadius: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            color: 'var(--accent-orange)',
            border: '1px solid var(--border-subtle)'
          }}
        >
          <Sparkles size={18} />
        </button>
      </div>

      {/* Bottom Health Indicator */}
      <div
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}
        title={systemHealthy ? 'Backend Engine Online & Healthy' : 'Backend Engine Connecting...'}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: systemHealthy ? 'var(--status-success)' : 'var(--status-error)',
            boxShadow: systemHealthy ? '0 0 6px rgba(27, 127, 72, 0.4)' : 'none'
          }}
        />
        <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>
          {systemHealthy ? 'OK' : 'ERR'}
        </span>
      </div>
    </aside>
  );
};
