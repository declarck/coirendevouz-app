import { Navigate, useParams } from 'react-router';

import { paths } from 'src/routes/paths';

import { CONFIG } from 'src/global-config';
import { useTranslate } from 'src/locales';

import { ServiceEditView } from 'src/sections/services/view/service-edit-view';

// ----------------------------------------------------------------------

export default function ServiceEditPage() {
  const { t } = useTranslate('coirendevouz');
  const { id } = useParams();
  const serviceId = Number(id);

  if (!Number.isFinite(serviceId) || serviceId < 1) {
    return <Navigate to={paths.dashboard.coirendevouz.services} replace />;
  }

  return (
    <>
      <title>{t('pageTitles.serviceEdit', { app: CONFIG.appName })}</title>
      <ServiceEditView serviceId={serviceId} />
    </>
  );
}
