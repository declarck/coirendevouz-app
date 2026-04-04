import type { StaffFormValues } from '../staff-form-schema';

import { useCallback } from 'react';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useTranslate } from 'src/locales';
import { getApiErrorMessage } from 'src/lib/axios';
import { createStaff } from 'src/api/business-staff';
import { DashboardContent } from 'src/layouts/dashboard';
import { useBusinessContext } from 'src/contexts/business/use-business-context';

import { toast } from 'src/components/snackbar';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { StaffNewEditForm } from '../staff-new-edit-form';
import {
  buildWorkingHoursPayload,
  buildWorkingHoursExceptionsPayload,
} from '../staff-working-hours-utils';

// ----------------------------------------------------------------------

export function StaffNewView() {
  const { t } = useTranslate('coirendevouz');
  const router = useRouter();
  const { selectedBusiness } = useBusinessContext();
  const businessId = selectedBusiness?.id;

  const onSubmit = useCallback(
    async (data: StaffFormValues) => {
      if (businessId == null) {
        return;
      }
      const raw = data.user_id.trim();
      if (raw !== '') {
        const n = Number(raw);
        if (!Number.isFinite(n) || n < 1) {
          toast.error(t('staff.userIdInvalid'));
          return;
        }
      }
      try {
        const created = await createStaff(businessId, {
          display_name: data.display_name.trim(),
          ...(raw === '' ? {} : { user: Math.floor(Number(raw)) }),
          ...(!data.hours_inherit ? { working_hours: buildWorkingHoursPayload(data.weekly) } : {}),
          working_hours_exceptions: buildWorkingHoursExceptionsPayload(data.exceptions),
        });
        toast.success(t('staff.created'));
        router.replace(paths.dashboard.coirendevouz.staffEdit(created.id));
      } catch (e) {
        toast.error(getApiErrorMessage(e));
      }
    },
    [businessId, router, t]
  );

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('staff.newHeading')}
        links={[
          { name: t('common.panel'), href: paths.dashboard.root },
          { name: t('nav.staff'), href: paths.dashboard.coirendevouz.staff },
          { name: t('common.new') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <StaffNewEditForm onSubmit={onSubmit} submitLabel={t('common.create')} />
    </DashboardContent>
  );
}
