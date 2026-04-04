import { CONFIG } from 'src/global-config';
import { useTranslate } from 'src/locales';

import { AppointmentDetailView } from 'src/sections/appointment-detail/appointment-detail-view';

// ----------------------------------------------------------------------

export default function AppointmentDetailPage() {
  const { t } = useTranslate('coirendevouz');

  return (
    <>
      <title>{t('pageTitles.appointmentDetail', { app: CONFIG.appName })}</title>
      <AppointmentDetailView />
    </>
  );
}
