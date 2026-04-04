import { CONFIG } from 'src/global-config';
import { useTranslate } from 'src/locales';

import { ServicesListView } from 'src/sections/services/view/services-list-view';

// ----------------------------------------------------------------------

export default function ServicesPage() {
  const { t } = useTranslate('coirendevouz');

  return (
    <>
      <title>{t('pageTitles.services', { app: CONFIG.appName })}</title>
      <ServicesListView />
    </>
  );
}
