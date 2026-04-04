import type { ServiceFormValues } from '../service-form-schema';

import { useCallback } from 'react';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useTranslate } from 'src/locales';
import { getApiErrorMessage } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';
import { createService } from 'src/api/business-services';
import { useBusinessContext } from 'src/contexts/business/use-business-context';

import { toast } from 'src/components/snackbar';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { ServiceNewEditForm } from '../service-new-edit-form';

// ----------------------------------------------------------------------

export function ServiceNewView() {
  const { t } = useTranslate('coirendevouz');
  const router = useRouter();
  const { selectedBusiness } = useBusinessContext();
  const businessId = selectedBusiness?.id;

  const onSubmit = useCallback(
    async (data: ServiceFormValues) => {
      if (businessId == null) {
        return;
      }
      try {
        await createService(businessId, {
          name: data.name.trim(),
          duration_minutes: data.duration_minutes,
          price: data.price,
          is_active: true,
        });
        toast.success(t('services.created'));
        router.replace(paths.dashboard.coirendevouz.services);
      } catch (e) {
        toast.error(getApiErrorMessage(e));
      }
    },
    [businessId, router, t]
  );

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('services.newHeading')}
        links={[
          { name: t('common.panel'), href: paths.dashboard.root },
          { name: t('nav.services'), href: paths.dashboard.coirendevouz.services },
          { name: t('common.new') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <ServiceNewEditForm onSubmit={onSubmit} submitLabel={t('common.create')} />
    </DashboardContent>
  );
}
