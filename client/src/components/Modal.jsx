import { useEffect, useRef } from 'react';

export default function Modal({ open, onClose, title, children, maxWidth = 'max-w-md' }) {
  const panelRef = useRef(null);

  // Close on Escape. Effect only binds while the modal is open.
  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    // Prevent page scroll behind the modal.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  // Focus the first focusable element when the modal opens.
  useEffect(() => {
    if (open && panelRef.current) {
      const first = panelRef.current.querySelector(
        'input, select, textarea, button:not([data-modal-close])'
      );
      first?.focus();
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        className={`relative w-full ${maxWidth} rounded-lg border border-slate-800 bg-slate-900 shadow-xl`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <h2 className="text-lg font-semibold text-slate-100">{title}</h2>
          <button
            type="button"
            data-modal-close
            onClick={onClose}
            aria-label="Close dialog"
            className="text-slate-400 hover:text-slate-100 transition"
          >
            ✕
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}