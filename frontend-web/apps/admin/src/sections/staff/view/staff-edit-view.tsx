import type { Staff } from 'src/types/staff';
import type { StaffFormValues } from '../staff-form-schema';

import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useTranslate } from 'src/locales';
import { getApiErrorMessage } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';
import { fetchStaff, updateStaff } from 'src/api/business-staff';
import { useBusinessContext } from 'src/contexts/business/use-business-context';

import { toast } from 'src/components/snackbar';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { StaffNewEditForm } from '../staff-new-edit-form';
import { StaffServicesAssignment } from '../staff-services-assignment';
import {
  buildWorkingHoursPayload,
  buildWorkingHoursExceptionsPayload,
} from '../staff-working-hours-utils';

// ----------------------------------------------------------------------

type Props = {
  staffId: number;
};

export function StaffEditView({ staffId }: Props) {
  const { t } = useTranslate('coirendevouz');
  const router = useRouter();
  const { selectedBusiness } = useBusinessContext();
  const businessId = selectedBusiness?.id;

  const [current, setCurrent] = useState<Staff | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (businessId == null) {
      setLoading(false);
      return undefined;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const row = await fetchStaff(businessId, staffId);
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
  }, [businessId, staffId]);

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
        await updateStaff(businessId, staffId, {
          display_name: data.display_name.trim(),
          is_active: data.is_active,
          user: raw === '' ? null : Math.floor(Number(raw)),
          working_hours: data.hours_inherit ? null : buildWorkingHoursPayload(data.weekly),
          working_hours_exceptions: buildWorkingHoursExceptionsPayload(data.exceptions),
        });
        toast.success(t('staff.updated'));
        router.replace(paths.dashboard.coirendevouz.staff);
      } catch (e) {
        toast.error(getApiErrorMessage(e));
      }
    },
    [businessId, router, staffId, t]
  );

  const handleServicesUpdated = useCallback((updated: Staff) => {
    setCurrent(updated);
  }, []);

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
          onClick={() => router.push(paths.dashboard.coirendevouz.staff)}
          sx={{ cursor: 'pointer', textDecoration: 'underline', border: 'none', background: 'none', p: 0 }}
        >
          {t('staff.backToList')}
        </Typography>
      </DashboardContent>
    );
  }

  if (loading) {
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

  if (!current) {
    return (
      <DashboardContent>
        <Typography variant="body2" color="text.secondary">
          {t('staff.loadFailed')}
        </Typography>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('staff.editHeading')}
        links={[
          { name: t('common.panel'), href: paths.dashboard.root },
          { name: t('nav.staff'), href: paths.dashboard.coirendevouz.staff },
          { name: current.display_name },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Stack spacing={3}>
        <StaffNewEditForm current={current} onSubmit={onSubmit} />

        {businessId != null ? (
          <StaffServicesAssignment
            businessId={businessId}
            staffId={staffId}
            initialServiceIds={current.service_ids ?? []}
            onUpdated={handleServicesUpdated}
          />
        ) : null}
      </Stack>
    </DashboardContent>
  );
}
