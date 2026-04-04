import { CONFIG } from 'src/global-config';
import { useTranslate } from 'src/locales';

import { ServiceNewView } from 'src/sections/services/view/service-new-view';

// ----------------------------------------------------------------------

export default function ServiceNewPage() {
  const { t } = useTranslate('coirendevouz');

  return (
    <>
      <title>{t('pageTitles.serviceNew', { app: CONFIG.appName })}</title>
      <ServiceNewView />
    </>
  );
}
