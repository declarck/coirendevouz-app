import type { AvailableSlotItem } from 'src/types/available-slots';
import type { ManualAppointmentFormValues } from './manual-appointment-form-schema';

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
import { useRouter } from 'src/routes/hooks';

import { useTranslate } from 'src/locales';
import { getApiErrorMessage } from 'src/lib/axios';
import { fetchAllStaff } from 'src/api/business-staff';
import { DashboardContent } from 'src/layouts/dashboard';
import { fetchAllServices } from 'src/api/business-services';
import { fetchAvailableSlots } from 'src/api/available-slots';
import { createManualAppointment } from 'src/api/manual-appointment';
import { useBusinessContext } from 'src/contexts/business/use-business-context';
import {
  getIstanbulToday,
  formatIstanbulTimeFromIso,
  combineIstanbulDateAndTimeToIso,
} from 'src/lib/istanbul-date';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import {
  createManualAppointmentFormSchema,
  defaultManualAppointmentFormValues,
} from './manual-appointment-form-schema';

// ----------------------------------------------------------------------

export function ManualAppointmentView() {
  const { t } = useTranslate('coirendevouz');
  const router = useRouter();
  const { selectedBusinessId } = useBusinessContext();

  const formSchema = useMemo(() => createManualAppointmentFormSchema(t), [t]);

  const [staffLoading, setStaffLoading] = useState(false);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [slots, setSlots] = useState<AvailableSlotItem[]>([]);
  const [selectedSlotStartsAt, setSelectedSlotStartsAt] = useState<string | null>(null);

  const [staffList, setStaffList] = useState<Awaited<ReturnType<typeof fetchAllStaff>>>([]);
  const [serviceList, setServiceList] = useState<Awaited<ReturnType<typeof fetchAllServices>>>([]);

  const methods = useForm<ManualAppointmentFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ...defaultManualAppointmentFormValues(),
      appointment_date: getIstanbulToday(),
    },
  });

  const { watch, setValue, handleSubmit, reset } = methods;
  const staffIdStr = watch('staff_id');
  const serviceIdStr = watch('service_id');
  const appointmentDate = watch('appointment_date');
  const appointmentTime = watch('appointment_time');

  const businessId = selectedBusinessId;

  useEffect(() => {
    let cancelled = false;
    if (businessId != null) {
      setStaffLoading(true);
      fetchAllStaff(businessId)
        .then((list) => {
          if (!cancelled) {
            setStaffList(list);
          }
        })
        .catch((e) => {
          if (!cancelled) {
            toast.error(getApiErrorMessage(e));
          }
        })
        .finally(() => {
          if (!cancelled) {
            setStaffLoading(false);
          }
        });
    }
    return () => {
      cancelled = true;
    };
  }, [businessId]);

  useEffect(() => {
    let cancelled = false;
    if (businessId != null) {
      setServicesLoading(true);
      fetchAllServices(businessId)
        .then((list) => {
          if (!cancelled) {
            setServiceList(list);
          }
        })
        .catch((e) => {
          if (!cancelled) {
            toast.error(getApiErrorMessage(e));
          }
        })
        .finally(() => {
          if (!cancelled) {
            setServicesLoading(false);
          }
        });
    }
    return () => {
      cancelled = true;
    };
  }, [businessId]);

  const activeStaff = useMemo(
    () => staffList.filter((s) => s.is_active && s.service_ids.length > 0),
    [staffList]
  );

  const selectedStaff = useMemo(() => {
    if (!staffIdStr) {
      return null;
    }
    const id = Number(staffIdStr);
    return activeStaff.find((s) => s.id === id) ?? null;
  }, [activeStaff, staffIdStr]);

  useEffect(() => {
    setValue('service_id', '');
  }, [staffIdStr, setValue]);

  const servicesForStaff = useMemo(() => {
    if (!selectedStaff) {
      return [];
    }
    const setIds = new Set(selectedStaff.service_ids);
    return serviceList.filter((svc) => svc.is_active && setIds.has(svc.id));
  }, [selectedStaff, serviceList]);

  useEffect(() => {
    if (!serviceIdStr) {
      return;
    }
    const sid = Number(serviceIdStr);
    if (!servicesForStaff.some((s) => s.id === sid)) {
      setValue('service_id', '');
    }
  }, [servicesForStaff, serviceIdStr, setValue]);

  useEffect(() => {
    setSelectedSlotStartsAt(null);
    setSlots([]);
    setSlotsError(null);

    let cancelled = false;

    if (
      businessId != null &&
      staffIdStr &&
      serviceIdStr &&
      appointmentDate
    ) {
      const staffId = Number(staffIdStr);
      const serviceId = Number(serviceIdStr);
      if (Number.isFinite(staffId) && Number.isFinite(serviceId)) {
        setSlotsLoading(true);
        fetchAvailableSlots({ staff_id: staffId, service_id: serviceId, date: appointmentDate })
          .then((res) => {
            if (!cancelled) {
              setSlots(res.slots ?? []);
            }
          })
          .catch((e) => {
            if (!cancelled) {
              setSlots([]);
              setSlotsError(getApiErrorMessage(e));
            }
          })
          .finally(() => {
            if (!cancelled) {
              setSlotsLoading(false);
            }
          });
      }
    }

    return () => {
      cancelled = true;
    };
  }, [businessId, staffIdStr, serviceIdStr, appointmentDate]);

  const onPickSlot = useCallback(
    (startsAt: string) => {
      setSelectedSlotStartsAt(startsAt);
      setValue('appointment_time', formatIstanbulTimeFromIso(startsAt), { shouldValidate: true });
    },
    [setValue]
  );

  useEffect(() => {
    if (!selectedSlotStartsAt || !appointmentTime) {
      return;
    }
    const fromSlot = formatIstanbulTimeFromIso(selectedSlotStartsAt);
    if (appointmentTime !== fromSlot) {
      setSelectedSlotStartsAt(null);
    }
  }, [appointmentTime, selectedSlotStartsAt]);

  const onSubmit = useCallback(
    async (data: ManualAppointmentFormValues) => {
      if (businessId == null) {
        return;
      }
      const startsAt =
        selectedSlotStartsAt ??
        combineIstanbulDateAndTimeToIso(data.appointment_date, data.appointment_time);

      try {
        await createManualAppointment(businessId, {
          staff_id: Number(data.staff_id),
          service_id: Number(data.service_id),
          starts_at: startsAt,
          customer_user_id: Number(data.customer_user_id),
          internal_note: data.internal_note?.trim() || undefined,
        });
        toast.success(t('manualAppointment.created'));
        reset({
          ...defaultManualAppointmentFormValues(),
          appointment_date: getIstanbulToday(),
        });
        setSelectedSlotStartsAt(null);
        router.push(paths.dashboard.coirendevouz.schedule);
      } catch (e) {
        toast.error(getApiErrorMessage(e));
      }
    },
    [businessId, reset, router, selectedSlotStartsAt, t]
  );

  if (businessId == null) {
    return (
      <DashboardContent>
        <Typography variant="body2" color="text.secondary">
          {t('manualAppointment.noBusiness')}
        </Typography>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('nav.manualAppointment')}
        links={[
          { name: t('common.panel'), href: paths.dashboard.root },
          { name: t('nav.schedule'), href: paths.dashboard.coirendevouz.schedule },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Form methods={methods} onSubmit={handleSubmit(onSubmit)}>
        <Card sx={{ p: 3 }}>
          <Stack spacing={3} maxWidth={560}>
            <Typography variant="body2" color="text.secondary">
              {t('manualAppointment.intro')}
            </Typography>

            <Field.Select
              name="staff_id"
              label={t('manualAppointment.staff')}
              disabled={staffLoading}
              slotProps={{ select: { displayEmpty: true } }}
            >
              <MenuItem value="">
                <em>{staffLoading ? t('common.loading') : t('common.select')}</em>
              </MenuItem>
              {activeStaff.map((s) => (
                <MenuItem key={s.id} value={String(s.id)}>
                  {s.display_name}
                </MenuItem>
              ))}
            </Field.Select>

            <Field.Select
              name="service_id"
              label={t('manualAppointment.service')}
              disabled={!selectedStaff || servicesLoading}
              slotProps={{ select: { displayEmpty: true } }}
            >
              <MenuItem value="">
                <em>
                  {!selectedStaff
                    ? t('manualAppointment.selectStaffFirst')
                    : servicesLoading
                      ? t('common.loading')
                      : t('common.select')}
                </em>
              </MenuItem>
              {servicesForStaff.map((svc) => (
                <MenuItem key={svc.id} value={String(svc.id)}>
                  {svc.name} ({t('common.durationShort', { minutes: svc.duration_minutes })})
                </MenuItem>
              ))}
            </Field.Select>

            <Field.Text
              name="appointment_date"
              label={t('manualAppointment.date')}
              type="date"
              InputLabelProps={{ shrink: true }}
            />

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                {t('manualAppointment.availableSlots')}
              </Typography>
              {slotsLoading ? (
                <Typography variant="body2" color="text.secondary">
                  {t('manualAppointment.slotsLoading')}
                </Typography>
              ) : slotsError ? (
                <Typography variant="body2" color="error">
                  {slotsError}
                </Typography>
              ) : slots.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  {t('manualAppointment.noSlotsHint')}
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {slots.map((slot) => {
                    const selected = selectedSlotStartsAt === slot.starts_at;
                    return (
                      <Button
                        key={slot.starts_at}
                        size="small"
                        variant={selected ? 'contained' : 'outlined'}
                        onClick={() => onPickSlot(slot.starts_at)}
                      >
                        {formatIstanbulTimeFromIso(slot.starts_at)}
                      </Button>
                    );
                  })}
                </Box>
              )}
            </Box>

            <Field.Text
              name="appointment_time"
              label={t('manualAppointment.startTime')}
              type="time"
              InputLabelProps={{ shrink: true }}
              helperText={
                selectedSlotStartsAt
                  ? t('manualAppointment.helperSlotMatch')
                  : t('manualAppointment.helperManualTime')
              }
            />

            <Field.Text
              name="customer_user_id"
              label={t('manualAppointment.customerUserId')}
              placeholder={t('manualAppointment.customerPlaceholder')}
            />

            <Field.Text name="internal_note" label={t('manualAppointment.internalNote')} multiline minRows={2} />

            <LoadingButton type="submit" variant="contained" loading={methods.formState.isSubmitting}>
              {t('manualAppointment.submit')}
            </LoadingButton>
          </Stack>
        </Card>
      </Form>
    </DashboardContent>
  );
}
