import type { Service } from 'src/types/service';
import type { ServiceFormValues } from '../service-form-schema';

import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useTranslate } from 'src/locales';
import { getApiErrorMessage } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';
import { fetchService, updateService } from 'src/api/business-services';
import { useBusinessContext } from 'src/contexts/business/use-business-context';

import { toast } from 'src/components/snackbar';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { ServiceNewEditForm } from '../service-new-edit-form';

// ----------------------------------------------------------------------

type Props = {
  serviceId: number;
};

export function ServiceEditView({ serviceId }: Props) {
  const { t } = useTranslate('coirendevouz');
  const router = useRouter();
  const { selectedBusiness } = useBusinessContext();
  const businessId = selectedBusiness?.id;

  const [current, setCurrent] = useState<Service | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (businessId == null) {
      return undefined;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const row = await fetchService(businessId, serviceId);
        if (!cancelled) {
          setCurrent(row);
        }
      } catch (e) {
        if (!cancelled) {
          setLoadError(getApiErrorMessage(e));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [businessId, serviceId]);

  const onSubmit = useCallback(
    async (data: ServiceFormValues) => {
      if (businessId == null) {
        return;
      }
      try {
        await updateService(businessId, serviceId, {
          name: data.name.trim(),
          duration_minutes: data.duration_minutes,
          price: data.price,
          is_active: data.is_active,
        });
        toast.success(t('services.updated'));
        router.replace(paths.dashboard.coirendevouz.services);
      } catch (e) {
        toast.error(getApiErrorMessage(e));
      }
    },
    [businessId, router, serviceId, t]
  );

  if (loadError) {
    return (
      <DashboardContent>
        <Typography color="error" variant="body2" sx={{ mb: 2 }}>
          {loadError}
        </Typography>
        <Typography
          component="button"
          type="button"
          variant="body2"
          onClick={() => router.push(paths.dashboard.coirendevouz.services)}
          sx={{ cursor: 'pointer', textDecoration: 'underline', border: 'none', background: 'none', p: 0 }}
        >
          {t('services.backToServices')}
        </Typography>
      </DashboardContent>
    );
  }

  if (loading || !current) {
    return (
      <DashboardContent>
        <Box sx={{ py: 4 }}>
          <Typography variant="body2" color="text.secondary">
            {t('common.loading')}
          </Typography>
        </Box>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('services.editHeading')}
        links={[
          { name: t('common.panel'), href: paths.dashboard.root },
          { name: t('nav.services'), href: paths.dashboard.coirendevouz.services },
          { name: current.name },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <ServiceNewEditForm current={current} onSubmit={onSubmit} />
    </DashboardContent>
  );
}
