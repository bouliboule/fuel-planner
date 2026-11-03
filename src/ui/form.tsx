import { useId, type ReactNode } from 'react';

const inputClass =
  'mt-1 block min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-base text-slate-900 aria-[invalid=true]:border-red-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100';

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string | undefined;
  error?: string | undefined;
  children: (props: {
    id: string;
    describedBy: string | undefined;
    invalid: boolean;
  }) => ReactNode;
}) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy =
    [hint ? hintId : '', error ? errorId : ''].filter(Boolean).join(' ') ||
    undefined;
  return (
    <div className="mt-4">
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      {children({ id, describedBy, invalid: Boolean(error) })}
      {hint && (
        <p
          id={hintId}
          className="mt-1 text-sm text-slate-500 dark:text-slate-400"
        >
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="mt-1 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}

export function TextField({
  label,
  value,
  onChange,
  hint,
  error,
  type = 'text',
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string | undefined;
  error?: string | undefined;
  type?: 'text' | 'time' | 'date';
  inputMode?: 'decimal' | 'numeric' | undefined;
}) {
  return (
    <Field label={label} hint={hint} error={error}>
      {({ id, describedBy, invalid }) => (
        <input
          id={id}
          type={type}
          inputMode={inputMode}
          value={value}
          aria-describedby={describedBy}
          aria-invalid={invalid}
          className={inputClass}
          onChange={(e) => {
            onChange(e.target.value);
          }}
        />
      )}
    </Field>
  );
}

export function NumberField(props: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string | undefined;
  error?: string | undefined;
  integer?: boolean;
}) {
  return (
    <TextField {...props} inputMode={props.integer ? 'numeric' : 'decimal'} />
  );
}

export function SelectField({
  label,
  value,
  onChange,
  options,
  hint,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly { value: string; label: string }[];
  hint?: string | undefined;
  error?: string | undefined;
}) {
  return (
    <Field label={label} hint={hint} error={error}>
      {({ id, describedBy, invalid }) => (
        <select
          id={id}
          value={value}
          aria-describedby={describedBy}
          aria-invalid={invalid}
          className={inputClass}
          onChange={(e) => {
            onChange(e.target.value);
          }}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}
    </Field>
  );
}

export function CheckboxField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="mt-4 flex min-h-11 items-center gap-3 text-base">
      <input
        type="checkbox"
        className="size-5"
        checked={checked}
        onChange={(e) => {
          onChange(e.target.checked);
        }}
      />
      {label}
    </label>
  );
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  type = 'button',
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  type?: 'button' | 'submit';
  disabled?: boolean;
}) {
  const styles = {
    primary: 'bg-amber-600 text-white disabled:bg-slate-400',
    secondary:
      'border border-slate-300 text-slate-900 dark:border-slate-700 dark:text-slate-100',
    danger: 'bg-red-600 text-white',
  }[variant];
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`min-h-11 rounded-lg px-4 font-medium ${styles}`}
    >
      {children}
    </button>
  );
}
