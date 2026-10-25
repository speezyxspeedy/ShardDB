import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'running' | 'exited' | 'error' | 'warning' | 'info' | 'demo' | 'healthy' | 'default';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  className = '',
}) => {
  const getVariantClass = () => {
    switch (variant) {
      case 'running':
        return 'badge-running';
      case 'healthy':
        return 'badge-healthy';
      case 'exited':
        return 'badge-exited';
      case 'error':
        return 'badge-error';
      case 'warning':
        return 'badge-warning';
      case 'info':
        return 'badge-info';
      case 'demo':
        return 'badge-demo';
      default:
        return 'badge-exited';
    }
  };

  return <span className={`badge ${getVariantClass()} ${className}`}>{children}</span>;
};
