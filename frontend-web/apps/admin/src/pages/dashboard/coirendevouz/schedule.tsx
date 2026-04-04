import { CONFIG } from 'src/global-config';
import { useTranslate } from 'src/locales';

import { ScheduleView } from 'src/sections/schedule/schedule-view';

// ----------------------------------------------------------------------

export default function SchedulePage() {
  const { t } = useTranslate('coirendevouz');

  return (
    <>
      <title>{t('pageTitles.schedule', { app: CONFIG.appName })}</title>
      <ScheduleView />
    </>
  );
}
