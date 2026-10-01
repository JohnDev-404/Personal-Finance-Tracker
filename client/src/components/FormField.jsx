export default function FormField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  error,
  autoComplete,
  required = false,
  minLength,
}) {
  const inputId = `field-${name}`;
  return (
    <div>
      <label htmlFor={inputId} className="block text-sm text-slate-300 mb-1">
        {label}
      </label>
      <input
        id={inputId}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        required={required}
        minLength={minLength}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${inputId}-error` : undefined}
        className={`w-full rounded-md bg-slate-900 border px-3 py-2 text-slate-100 focus:outline-none transition ${
          error
            ? 'border-red-500/60 focus:border-red-500'
            : 'border-slate-700 focus:border-emerald-500'
        }`}
      />
      {error && (
        <p id={`${inputId}-error`} className="mt-1 text-xs text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}