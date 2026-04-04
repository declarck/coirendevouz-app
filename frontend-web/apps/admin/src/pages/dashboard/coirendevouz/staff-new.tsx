import { CONFIG } from 'src/global-config';
import { useTranslate } from 'src/locales';

import { StaffNewView } from 'src/sections/staff/view/staff-new-view';

// ----------------------------------------------------------------------

export default function StaffNewPage() {
  const { t } = useTranslate('coirendevouz');

  return (
    <>
      <title>{t('pageTitles.staffNew', { app: CONFIG.appName })}</title>
      <StaffNewView />
    </>
  );
}
