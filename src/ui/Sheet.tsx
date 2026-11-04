import { useEffect, useRef, type ReactNode } from 'react';
import { t } from '../i18n/index.ts';

/** Bottom sheet on a modal <dialog>: focus trap, Escape and backdrop close. */
export function Sheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      aria-label={title}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) ref.current.close();
      }}
      className="mx-auto mt-auto mb-0 max-h-[90dvh] w-full max-w-3xl rounded-t-2xl bg-white p-0 text-slate-900 backdrop:bg-black/50 dark:bg-slate-950 dark:text-slate-100"
    >
      <div className="px-4 pt-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button
            type="button"
            onClick={() => ref.current?.close()}
            className="min-h-12 min-w-12 rounded-lg text-2xl"
            aria-label={t('detail.close')}
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
