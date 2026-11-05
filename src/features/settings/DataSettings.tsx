import { useEffect, useState } from 'react';
import { db, exportData } from '../../db/index.ts';
import { t } from '../../i18n/index.ts';
import {
  getPersistenceStatus,
  type PersistenceStatus,
} from '../../pwa/persistence.ts';
import { BackLink } from '../../ui/BackLink.tsx';
import { Button } from '../../ui/form.tsx';
import { Screen } from '../../ui/Screen.tsx';
import { ImportBackup } from './ImportBackup.tsx';

// Per-device convenience only; the export file itself is the backup.
const LAST_EXPORT_KEY = 'fuel-planner:last-export';

function readLastExport(): string | null {
  try {
    return localStorage.getItem(LAST_EXPORT_KEY);
  } catch {
    return null;
  }
}

export function DataSettings() {
  const [lastExport, setLastExport] = useState(readLastExport);
  const [persistence, setPersistence] = useState<
    PersistenceStatus | undefined
  >();

  useEffect(() => {
    void getPersistenceStatus().then(setPersistence);
  }, []);

  return (
    <Screen title={t('data.title')}>
      <BackLink to="/profile" />

      <h2 className="mt-4 text-lg font-black">{t('data.export')}</h2>
      <p className="mt-1 text-sm text-ink-muted">{t('data.exportHint')}</p>
      <p className="mt-1 text-sm">
        {lastExport
          ? t('data.lastExport', { date: lastExport.slice(0, 10) })
          : t('data.neverExported')}
      </p>
      <div className="mt-2">
        <Button
          onClick={() => {
            void exportData(db).then((file) => {
              const blob = new Blob([JSON.stringify(file, null, 2)], {
                type: 'application/json',
              });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `fuel-planner-${file.exportedAt.slice(0, 10)}.json`;
              link.click();
              URL.revokeObjectURL(url);
              try {
                localStorage.setItem(LAST_EXPORT_KEY, file.exportedAt);
              } catch {
                // Storage can be unavailable; the export still downloaded.
              }
              setLastExport(file.exportedAt);
            });
          }}
        >
          {t('data.export')}
        </Button>
      </div>

      <h2 className="mt-6 text-lg font-black">{t('data.import')}</h2>
      <p className="mt-1 text-sm text-ink-muted">{t('data.importHint')}</p>
      <ImportBackup />

      <h2 className="mt-6 text-lg font-black">{t('data.storage')}</h2>
      {persistence && (
        <p className="mt-1 text-sm">{t(`data.storage.${persistence}`)}</p>
      )}
    </Screen>
  );
}
