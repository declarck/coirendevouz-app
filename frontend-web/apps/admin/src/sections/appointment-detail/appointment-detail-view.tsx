import type { TFunction } from 'i18next';
import type { AppointmentBusinessRead } from 'src/types/appointment-business';
import type { AppointmentDetailFormValues } from './appointment-detail-form-schema';

import { useParams } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useTranslate } from 'src/locales';
import { getApiErrorMessage } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';
import { useBusinessContext } from 'src/contexts/business/use-business-context';
import { fetchAppointmentBusiness, patchAppointmentBusiness } from 'src/api/appointment-business';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import {
  APPOINTMENT_STATUS_VALUES,
  AppointmentDetailFormSchema,
} from './appointment-detail-form-schema';

// ----------------------------------------------------------------------

function statusColor(
  s: string
): 'default' | 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error' {
  switch (s) {
    case 'confirmed':
      return 'info';
    case 'completed':
      return 'success';
    case 'cancelled':
    case 'no_show':
      return 'error';
    case 'pending':
      return 'warning';
    default:
      return 'default';
  }
}

function formatWindow(isoStart: string, isoEnd: string, intlLocale: string): string {
  const s = new Date(isoStart);
  const e = new Date(isoEnd);
  const opts: Intl.DateTimeFormatOptions = {
    timeZone: 'Europe/Istanbul',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };
  return `${s.toLocaleString(intlLocale, opts)} — ${e.toLocaleTimeString(intlLocale, {
    timeZone: 'Europe/Istanbul',
    hour: '2-digit',
    minute: '2-digit',
  })}`;
}

function sourceLabel(source: string, t: TFunction<'coirendevouz'>): string {
  if (source === 'business_manual') {
    return t('appointmentDetail.sourceManual');
  }
  if (source === 'customer_app') {
    return t('appointmentDetail.sourceCustomerApp');
  }
  return source;
}

function applyDetailToForm(
  data: AppointmentBusinessRead,
  reset: (v: AppointmentDetailFormValues) => void
): void {
  const st = data.status;
  const status = APPOINTMENT_STATUS_VALUES.includes(st as AppointmentDetailFormValues['status'])
    ? (st as AppointmentDetailFormValues['status'])
    : 'pending';
  reset({
    status,
    internal_note: data.internal_note ?? '',
  });
}

export function AppointmentDetailView() {
  const { t, i18n } = useTranslate('coirendevouz');
  const intlLocale = i18n.language?.startsWith('en') ? 'en-GB' : 'tr-TR';

  const { id: idParam } = useParams();
  const appointmentId = idParam != null ? Number(idParam) : NaN;
  const { selectedBusinessId } = useBusinessContext();

  const [detail, setDetail] = useState<AppointmentBusinessRead | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const methods = useForm<AppointmentDetailFormValues>({
    resolver: zodResolver(AppointmentDetailFormSchema),
    defaultValues: {
      status: 'pending',
      internal_note: '',
    },
  });

  const { reset, handleSubmit } = methods;

  const statusLabel = useCallback(
    (s: string) => t(`appointmentStatus.${s}`, { defaultValue: s }),
    [t]
  );

  const load = useCallback(async () => {
    if (!Number.isFinite(appointmentId) || appointmentId < 1) {
      setLoadError(t('appointmentDetail.invalidAppointment'));
      setDetail(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const data = await fetchAppointmentBusiness(appointmentId);
      if (selectedBusinessId != null && data.business_id !== selectedBusinessId) {
        setDetail(null);
        setLoadError(t('appointmentDetail.wrongBusiness'));
        return;
      }
      setDetail(data);
      applyDetailToForm(data, reset);
    } catch (e) {
      setDetail(null);
      setLoadError(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [appointmentId, reset, selectedBusinessId, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const onSubmit = useCallback(
    async (data: AppointmentDetailFormValues) => {
      if (!Number.isFinite(appointmentId) || appointmentId < 1) {
        return;
      }
      try {
        const updated = await patchAppointmentBusiness(appointmentId, {
          status: data.status,
          internal_note: data.internal_note?.trim() ?? '',
        });
        setDetail(updated);
        applyDetailToForm(updated, reset);
        toast.success(t('appointmentDetail.updated'));
      } catch (e) {
        toast.error(getApiErrorMessage(e));
      }
    },
    [appointmentId, reset, t]
  );

  const quickStatus = useCallback(
    async (next: AppointmentDetailFormValues['status']) => {
      if (!Number.isFinite(appointmentId) || appointmentId < 1) {
        return;
      }
      try {
        const updated = await patchAppointmentBusiness(appointmentId, { status: next });
        setDetail(updated);
        applyDetailToForm(updated, reset);
        toast.success(t('appointmentDetail.statusUpdated'));
      } catch (e) {
        toast.error(getApiErrorMessage(e));
      }
    },
    [appointmentId, reset, t]
  );

  const invalidId = useMemo(
    () => !Number.isFinite(appointmentId) || appointmentId < 1,
    [appointmentId]
  );

  if (invalidId) {
    return (
      <DashboardContent>
        <Typography color="error">{t('appointmentDetail.invalidLink')}</Typography>
        <Button component={RouterLink} href={paths.dashboard.coirendevouz.schedule} sx={{ mt: 2 }}>
          {t('appointmentDetail.backSchedule')}
        </Button>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('appointmentDetail.heading')}
        links={[
          { name: t('common.panel'), href: paths.dashboard.root },
          { name: t('nav.schedule'), href: paths.dashboard.coirendevouz.schedule },
          { name: `#${appointmentId}` },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      {loading ? (
        <Typography variant="body2" color="text.secondary">
          {t('common.loading')}
        </Typography>
      ) : loadError ? (
        <Stack spacing={2}>
          <Typography color="error">{loadError}</Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button variant="outlined" onClick={() => void load()}>
              {t('common.tryAgain')}
            </Button>
            <Button component={RouterLink} href={paths.dashboard.coirendevouz.schedule} variant="contained">
              {t('appointmentDetail.backSchedule')}
            </Button>
          </Stack>
        </Stack>
      ) : detail ? (
        <Stack spacing={3}>
          <Card sx={{ p: 2 }}>
            <Stack spacing={2}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
                <Typography variant="h6">{t('appointmentDetail.appointmentN', { id: detail.id })}</Typography>
                <Label color={statusColor(detail.status)} variant="soft">
                  {statusLabel(detail.status)}
                </Label>
              </Stack>
              <Typography variant="body2" color="text.secondary">
                {formatWindow(detail.starts_at, detail.ends_at, intlLocale)}
              </Typography>
              <Stack spacing={0.5}>
                <Typography variant="body2">
                  <Box component="span" color="text.secondary">
                    {t('appointmentDetail.fieldBusiness')}{' '}
                  </Box>
                  {detail.business_name}
                </Typography>
                <Typography variant="body2">
                  <Box component="span" color="text.secondary">
                    {t('appointmentDetail.fieldService')}{' '}
                  </Box>
                  {detail.service_name}
                </Typography>
                <Typography variant="body2">
                  <Box component="span" color="text.secondary">
                    {t('appointmentDetail.fieldStaff')}{' '}
                  </Box>
                  {detail.staff_display_name}
                </Typography>
                <Typography variant="body2">
                  <Box component="span" color="text.secondary">
                    {t('appointmentDetail.fieldCustomer')}{' '}
                  </Box>
                  {detail.customer_full_name}
                  {detail.customer_phone ? ` · ${detail.customer_phone}` : ''}
                </Typography>
                <Typography variant="body2">
                  <Box component="span" color="text.secondary">
                    {t('appointmentDetail.fieldSource')}{' '}
                  </Box>
                  {sourceLabel(detail.source, t)}
                </Typography>
                {detail.customer_note ? (
                  <Typography variant="body2">
                    <Box component="span" color="text.secondary">
                      {t('appointmentDetail.fieldCustomerNote')}{' '}
                    </Box>
                    {detail.customer_note}
                  </Typography>
                ) : null}
              </Stack>
            </Stack>
          </Card>

          <Form methods={methods} onSubmit={handleSubmit(onSubmit)}>
            <Card sx={{ p: 3 }}>
              <Stack spacing={3} maxWidth={560}>
                <Typography variant="subtitle2" color="text.secondary">
                  {t('appointmentDetail.quickStatus')}
                </Typography>
                <Stack direction="row" flexWrap="wrap" gap={1} useFlexGap>
                  <Button size="small" variant="outlined" onClick={() => void quickStatus('completed')}>
                    {t('appointmentDetail.quickCompleted')}
                  </Button>
                  <Button size="small" variant="outlined" color="error" onClick={() => void quickStatus('cancelled')}>
                    {t('appointmentDetail.quickCancelled')}
                  </Button>
                  <Button size="small" variant="outlined" color="warning" onClick={() => void quickStatus('no_show')}>
                    {t('appointmentDetail.quickNoShow')}
                  </Button>
                  <Button size="small" variant="outlined" onClick={() => void quickStatus('confirmed')}>
                    {t('appointmentDetail.quickConfirmed')}
                  </Button>
                </Stack>

                <Field.Select name="status" label={t('common.status')} slotProps={{ select: { displayEmpty: false } }}>
                  {APPOINTMENT_STATUS_VALUES.map((v) => (
                    <MenuItem key={v} value={v}>
                      {statusLabel(v)}
                    </MenuItem>
                  ))}
                </Field.Select>

                <Field.Text name="internal_note" label={t('appointmentDetail.internalNote')} multiline minRows={3} />

                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <LoadingButton type="submit" variant="contained" loading={methods.formState.isSubmitting}>
                    {t('common.save')}
                  </LoadingButton>
                  <Button component={RouterLink} href={paths.dashboard.coirendevouz.schedule} variant="outlined">
                    {t('appointmentDetail.backSchedule')}
                  </Button>
                </Stack>
              </Stack>
            </Card>
          </Form>
        </Stack>
      ) : null}
    </DashboardContent>
  );
}
