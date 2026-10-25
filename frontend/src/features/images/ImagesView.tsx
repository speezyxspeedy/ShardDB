import React, { useState } from 'react';
import { Search, Layers, Info, AlertTriangle } from 'lucide-react';
import { ImageSummary } from '../../types';
import { Badge } from '../../components/common/Badge';

interface ImagesViewProps {
  images: ImageSummary[];
  isLoading: boolean;
  error: string | null;
  onSelectImage: (id: string) => void;
  isDemoMode: boolean;
  onToggleDemoMode: () => void;
}

export const ImagesView: React.FC<ImagesViewProps> = ({
  images,
  isLoading,
  error,
  onSelectImage,
  isDemoMode,
  onToggleDemoMode,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = images.filter((img) => {
    return (
      img.repository.toLowerCase().includes(searchQuery.toLowerCase()) ||
      img.tag.toLowerCase().includes(searchQuery.toLowerCase()) ||
      img.short_id.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="content-area">
      <div className="view-header">
        <div className="view-title-group">
          <h1>
            <span>Docker Image Explorer</span>
            {isDemoMode && <span className="badge badge-demo">Demo Data</span>}
          </h1>
          <div className="view-description">
            Explore locally cached Docker images, layer history, and storage footprint.
          </div>
        </div>
      </div>

      {error && !isDemoMode && (
        <div
          style={{
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--color-warning)',
            borderRadius: 'var(--radius-md)',
            padding: '16px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertTriangle size={18} color="var(--color-warning)" />
            <span>Docker Engine is offline. {error}</span>
          </div>
          <button onClick={onToggleDemoMode} className="btn btn-sm">
            Switch to Demo Sandbox
          </button>
        </div>
      )}

      <div className="table-container">
        <div className="table-toolbar">
          <div className="search-input-group">
            <Search size={14} />
            <input
              type="text"
              placeholder="Filter by repository or tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              id="image-search"
            />
          </div>

          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Showing {filtered.length} of {images.length} images
          </div>
        </div>

        <table className="table-dense">
          <thead>
            <tr>
              <th>Repository</th>
              <th>Tag</th>
              <th>Image ID</th>
              <th>Size</th>
              <th>Created</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                  Querying local image cache...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                  <Layers size={24} style={{ marginBottom: '8px', opacity: 0.5 }} />
                  <div>No Docker images found matching your search.</div>
                </td>
              </tr>
            ) : (
              filtered.map((img) => (
                <tr key={`${img.id}-${img.tag}`} onClick={() => onSelectImage(img.id)}>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {img.repository}
                  </td>
                  <td>
                    <Badge variant={img.tag === 'latest' ? 'warning' : 'info'}>
                      {img.tag}
                    </Badge>
                  </td>
                  <td className="mono" style={{ color: 'var(--docker-blue)', fontSize: '11px' }}>
                    {img.short_id}
                  </td>
                  <td className="mono" style={{ fontSize: '11px', color: 'var(--text-primary)' }}>
                    {img.size_formatted}
                  </td>
                  <td style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    {img.created ? img.created.split('T')[0] : '—'}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="btn btn-sm"
                      title="Inspect Layers & Metadata"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectImage(img.id);
                      }}
                    >
                      <Info size={12} />
                      <span>Inspect</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
