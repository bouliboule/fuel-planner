/** A row of large toggle buttons for a single choice. */
export function Choice<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T | undefined;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <fieldset className="mt-4">
      <legend className="text-base font-medium">{label}</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((o) => {
          const selected = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={selected}
              onClick={() => {
                onChange(o.value);
              }}
              className={`min-h-12 min-w-16 rounded-xl px-4 text-lg font-medium ${
                selected
                  ? 'bg-amber-600 text-white'
                  : 'border border-slate-300 dark:border-slate-700'
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
