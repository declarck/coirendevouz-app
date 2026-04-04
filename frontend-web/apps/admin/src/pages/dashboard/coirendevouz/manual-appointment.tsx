import { CONFIG } from 'src/global-config';
import { useTranslate } from 'src/locales';

import { ManualAppointmentView } from 'src/sections/manual-appointment/manual-appointment-view';

// ----------------------------------------------------------------------

export default function ManualAppointmentPage() {
  const { t } = useTranslate('coirendevouz');

  return (
    <>
      <title>{t('pageTitles.manualAppointment', { app: CONFIG.appName })}</title>
      <ManualAppointmentView />
    </>
  );
}
