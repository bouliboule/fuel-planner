import type { LucideIcon } from 'lucide-react';

/** A row of large toggle buttons for a single choice, with optional icons. */
export function Choice<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T | undefined;
  options: readonly { value: T; label: string; icon?: LucideIcon }[];
  onChange: (value: T) => void;
}) {
  return (
    <fieldset className="mt-4">
      <legend className="text-base font-bold">{label}</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((o) => {
          const selected = o.value === value;
          const Icon = o.icon;
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={selected}
              onClick={() => {
                onChange(o.value);
              }}
              className={`brutal-flat inline-flex min-h-12 min-w-16 items-center gap-2 px-4 text-lg font-bold transition-[translate,box-shadow] duration-100 ${
                selected
                  ? 'translate-x-1 translate-y-1 bg-main text-main-ink'
                  : 'bg-surface text-ink shadow-brutal'
              }`}
            >
              {Icon && <Icon aria-hidden="true" className="size-5 shrink-0" />}
              {o.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
