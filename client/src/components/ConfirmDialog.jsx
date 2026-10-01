import Modal from './Modal';

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  danger = false,
  busy = false,
}) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="text-slate-300 text-sm">{message}</p>
      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          className="px-4 py-2 rounded-md text-sm border border-slate-700 hover:bg-slate-800 disabled:opacity-50 transition"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={busy}
          className={`px-4 py-2 rounded-md text-sm font-semibold disabled:opacity-50 transition ${
            danger
              ? 'bg-red-500 hover:bg-red-400 text-white'
              : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
          }`}
        >
          {busy ? 'Working…' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}