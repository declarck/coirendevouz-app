import { CONFIG } from 'src/global-config';
import { useTranslate } from 'src/locales';

import { StaffListView } from 'src/sections/staff/view/staff-list-view';

// ----------------------------------------------------------------------

export default function StaffPage() {
  const { t } = useTranslate('coirendevouz');

  return (
    <>
      <title>{t('pageTitles.staff', { app: CONFIG.appName })}</title>
      <StaffListView />
    </>
  );
}
