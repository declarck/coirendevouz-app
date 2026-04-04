import type { Staff } from 'src/types/staff';

import { useForm } from 'react-hook-form';
import { useMemo, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useTranslate } from 'src/locales';

import { Form, Field } from 'src/components/hook-form';

import { StaffWorkingHoursSection } from './staff-working-hours-section';
import { type StaffFormValues, createStaffFormSchema } from './staff-form-schema';
import {
  exceptionRowsFromApi,
  defaultWeeklyFormState,
  weeklyFormStateFromWorkingHours,
} from './staff-working-hours-utils';

// ----------------------------------------------------------------------

type Props = {
  current?: Staff;
  onSubmit: (data: StaffFormValues) => Promise<void>;
  submitLabel?: string;
};

function buildDefaultValues(current?: Staff): StaffFormValues {
  if (!current) {
    return {
      display_name: '',
      user_id: '',
      is_active: true,
      hours_inherit: true,
      weekly: defaultWeeklyFormState(),
      exceptions: [],
    };
  }

  const rawWh = current.working_hours as Record<string, unknown> | null | undefined;
  const inherit =
    rawWh == null || (typeof rawWh === 'object' && Object.keys(rawWh).length === 0);

  return {
    display_name: current.display_name,
    user_id: current.user_id != null ? String(current.user_id) : '',
    is_active: current.is_active,
    hours_inherit: inherit,
    weekly: weeklyFormStateFromWorkingHours(rawWh),
    exceptions: exceptionRowsFromApi(current.working_hours_exceptions),
  };
}

export function StaffNewEditForm({ current, onSubmit, submitLabel }: Props) {
  const { t } = useTranslate('coirendevouz');

  const schema = useMemo(() => createStaffFormSchema(t), [t]);

  const methods = useForm<StaffFormValues>({
    resolver: zodResolver(schema),
    defaultValues: buildDefaultValues(current),
  });

  const { reset } = methods;

  const saveLabel = submitLabel ?? t('common.save');

  useEffect(() => {
    reset(buildDefaultValues(current));
  }, [current, reset]);

  return (
    <Form methods={methods} onSubmit={methods.handleSubmit(onSubmit)}>
      <Card sx={{ p: 3 }}>
        <Stack spacing={3} maxWidth={720}>
          <Field.Text name="display_name" label={t('staff.displayName')} />

          <Field.Text
            name="user_id"
            label={t('staff.userIdOptional')}
            placeholder={t('staff.userPlaceholder')}
            helperText={t('staff.userHelper')}
          />

          {current ? <Field.Switch name="is_active" label={t('staff.activeSwitch')} /> : null}

          {!current ? (
            <Typography variant="caption" color="text.secondary">
              {t('staff.afterCreateHint')}
            </Typography>
          ) : null}

          <StaffWorkingHoursSection />

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <LoadingButton
              type="submit"
              variant="contained"
              loading={methods.formState.isSubmitting}
            >
              {saveLabel}
            </LoadingButton>
            <Button component={RouterLink} href={paths.dashboard.coirendevouz.staff} variant="outlined">
              {t('common.cancel')}
            </Button>
          </Box>
        </Stack>
      </Card>
    </Form>
  );
}
