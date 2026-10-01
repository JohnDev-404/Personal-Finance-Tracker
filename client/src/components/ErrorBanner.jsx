export default function ErrorBanner({ message, onDismiss }) {
  if (!message) return null;
  return (
    <div className="rounded-md bg-red-500/10 border border-red-500/30 text-red-300 text-sm px-3 py-2 flex items-start justify-between gap-3">
      <span>{message}</span>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="text-red-200/70 hover:text-red-100"
          aria-label="Dismiss"
        >
          ✕
        </button>
      )}
    </div>
  );
}