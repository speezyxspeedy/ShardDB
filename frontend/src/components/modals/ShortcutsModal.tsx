import { X, Keyboard } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Ctrl / Cmd + Enter', desc: 'Execute current workflow on engine' },
    { key: 'Ctrl / Cmd + S', desc: 'Save workflow graph to database' },
    { key: 'Ctrl / Cmd + Z', desc: 'Undo last canvas change' },
    { key: 'Ctrl / Cmd + Y', desc: 'Redo last canvas change' },
    { key: 'Delete / Backspace', desc: 'Delete selected node or connection' },
    { key: 'Space + Drag', desc: 'Pan around workflow canvas' },
    { key: 'Scroll Wheel', desc: 'Zoom in / zoom out' },
    { key: 'Escape', desc: 'Deselect node / close inspector' }
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(32, 33, 31, 0.4)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        padding: 20
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 480,
          background: '#FFFFFF',
          borderRadius: 4,
          border: '1px solid var(--border-strong)',
          boxShadow: 'var(--shadow-modal)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        onClick={e => e.stopPropagation()}
      >
        <div
          style={{
            padding: '14px 18px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#FAF9F5'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Keyboard size={16} color="var(--accent-orange)" />
            <span style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-display)' }}>
              Keyboard Shortcuts
            </span>
          </div>
          <button onClick={onClose} className="btn-icon" style={{ width: 26, height: 26 }}>
            <X size={15} />
          </button>
        </div>

        <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {shortcuts.map((sc, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 0',
                borderBottom: '1px dotted var(--border-subtle)'
              }}
            >
              <span style={{ fontSize: 12, color: 'var(--text-primary)' }}>{sc.desc}</span>
              <kbd
                style={{
                  fontSize: 10,
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 600,
                  padding: '3px 8px',
                  background: '#FAF9F5',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 3,
                  color: 'var(--text-secondary)'
                }}
              >
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
