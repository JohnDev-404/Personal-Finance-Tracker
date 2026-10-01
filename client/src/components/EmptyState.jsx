export default function EmptyState({ title, message, action }) {
  return (
    <div className="text-center py-12 px-4 border border-dashed border-slate-800 rounded-lg">
      <h3 className="text-slate-200 font-medium">{title}</h3>
      {message && <p className="text-slate-400 text-sm mt-1">{message}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}