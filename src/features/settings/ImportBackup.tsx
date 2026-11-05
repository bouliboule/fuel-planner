import { useState } from 'react';
import {
  checkImport,
  db,
  replaceAllData,
  type ImportCheck,
} from '../../db/index.ts';
import { t, type MessageKey } from '../../i18n/index.ts';
import { Button } from '../../ui/form.tsx';

export function ImportBackup({ onImported }: { onImported?: () => void }) {
  const [check, setCheck] = useState<ImportCheck | undefined>();
  const [done, setDone] = useState(false);

  return (
    <div className="mt-2">
      <label className="block">
        <span className="sr-only">{t('data.import')}</span>
        <input
          type="file"
          accept="application/json,.json"
          aria-label={t('data.import')}
          className="block min-h-11 w-full text-sm"
          onChange={(e) => {
            const file = e.target.files?.[0];
            setDone(false);
            if (!file) return;
            void file.text().then((text) => {
              setCheck(checkImport(text));
            });
          }}
        />
      </label>
      {check && !check.ok && (
        <p role="alert" className="mt-2 text-sm font-bold text-danger">
          {t(`data.import.${check.reason}` as MessageKey, {
            detail: check.detail ?? '',
          })}
        </p>
      )}
      {check?.ok && !done && (
        <div className="mt-2">
          <p className="text-sm">{t('data.importSummary', check.counts)}</p>
          <div className="mt-2 flex gap-2">
            <Button
              variant="danger"
              onClick={() => {
                void replaceAllData(db, check.file).then(() => {
                  setDone(true);
                  onImported?.();
                });
              }}
            >
              {t('data.importConfirm')}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setCheck(undefined);
              }}
            >
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      )}
      {done && (
        <p role="status" className="mt-2 text-sm">
          {t('data.importDone')}
        </p>
      )}
    </div>
  );
}
