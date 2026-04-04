import { Navigate, useParams } from 'react-router';

import { paths } from 'src/routes/paths';

import { CONFIG } from 'src/global-config';
import { useTranslate } from 'src/locales';

import { StaffEditView } from 'src/sections/staff/view/staff-edit-view';

// ----------------------------------------------------------------------

export default function StaffEditPage() {
  const { t } = useTranslate('coirendevouz');
  const { id } = useParams();
  const staffId = Number(id);

  if (!Number.isFinite(staffId) || staffId < 1) {
    return <Navigate to={paths.dashboard.coirendevouz.staff} replace />;
  }

  return (
    <>
      <title>{t('pageTitles.staffEdit', { app: CONFIG.appName })}</title>
      <StaffEditView staffId={staffId} />
    </>
  );
}
