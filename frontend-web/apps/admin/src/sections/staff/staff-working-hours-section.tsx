import type { StaffFormValues } from './staff-form-schema';

import { useFieldArray, useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';

import { useTranslate } from 'src/locales';

import { Iconify } from 'src/components/iconify';
import { Field } from 'src/components/hook-form';

import { staffWeekdayLabel, STAFF_WEEKDAY_ORDER } from './staff-working-hours-utils';

// ----------------------------------------------------------------------

export function StaffWorkingHoursSection() {
  const { t } = useTranslate('coirendevouz');
  const { control, watch } = useFormContext<StaffFormValues>();
  const inherit = watch('hours_inherit');

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'exceptions',
  });

  return (
    <Box sx={{ pt: 2, mt: 2, borderTop: 1, borderColor: 'divider' }}>
      <Typography variant="subtitle1" sx={{ mb: 2 }}>
        {t('staffHours.sectionTitle')}
      </Typography>

      <Stack spacing={2}>
        <Field.Switch
          name="hours_inherit"
          label={t('staffHours.inheritLabel')}
          helperText={t('staffHours.inheritHelper')}
        />

        {!inherit ? (
          <Box
            sx={{
              display: 'grid',
              gap: 1.5,
              gridTemplateColumns: { xs: '1fr', sm: '140px 1fr 1fr' },
              alignItems: 'center',
            }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
              {t('staffHours.colDay')}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
              {t('staffHours.colClosed')}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
              {t('staffHours.colHours')}
            </Typography>
            {STAFF_WEEKDAY_ORDER.map((day) => (
              <StaffDayRow key={day} day={day} />
            ))}
          </Box>
        ) : null}

        <Divider />

        <Typography variant="subtitle2">{t('staffHours.exceptionsTitle')}</Typography>
        <Typography variant="caption" color="text.secondary">
          {t('staffHours.exceptionsHint')}
        </Typography>

        <Stack spacing={1.5}>
          {fields.map((field, index) => (
            <Stack
              key={field.id}
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1}
              alignItems={{ xs: 'stretch', sm: 'center' }}
            >
              <Field.Text
                name={`exceptions.${index}.date`}
                type="date"
                label={t('staffHours.date')}
                size="small"
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ minWidth: { sm: 160 } }}
              />
              <Field.Switch name={`exceptions.${index}.closed`} label={t('staffHours.closedLeave')} />
              <WatchExceptionTimes index={index} />
              <Button
                color="error"
                variant="outlined"
                size="small"
                onClick={() => remove(index)}
                startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
              >
                {t('staffHours.delete')}
              </Button>
            </Stack>
          ))}
        </Stack>

        <Box>
          <Button
            size="small"
            variant="soft"
            startIcon={<Iconify icon="mingcute:add-line" />}
            onClick={() =>
              append({
                date: '',
                closed: true,
                open: '09:00',
                close: '18:00',
              })
            }
          >
            {t('staffHours.addException')}
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}

// ----------------------------------------------------------------------

function StaffDayRow({ day }: { day: (typeof STAFF_WEEKDAY_ORDER)[number] }) {
  const { t } = useTranslate('coirendevouz');
  const { watch } = useFormContext<StaffFormValues>();
  const closed = Boolean(watch(`weekly.${day}.closed`));

  return (
    <>
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        {staffWeekdayLabel(day, t)}
      </Typography>
      <Field.Switch name={`weekly.${day}.closed`} label="" sx={{ justifyContent: { xs: 'flex-start', sm: 'center' } }} />
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        {closed ? (
          <Typography variant="body2" color="text.secondary">
            —
          </Typography>
        ) : (
          <>
            <Field.Text
              name={`weekly.${day}.open`}
              label={t('staffHours.open')}
              type="time"
              size="small"
              slotProps={{
                input: { inputProps: { step: 300 } },
                inputLabel: { shrink: true },
              }}
              sx={{ minWidth: 120 }}
            />
            <Field.Text
              name={`weekly.${day}.close`}
              label={t('staffHours.close')}
              type="time"
              size="small"
              slotProps={{
                input: { inputProps: { step: 300 } },
                inputLabel: { shrink: true },
              }}
              sx={{ minWidth: 120 }}
            />
          </>
        )}
      </Stack>
    </>
  );
}

function WatchExceptionTimes({ index }: { index: number }) {
  const { t } = useTranslate('coirendevouz');
  const { watch } = useFormContext<StaffFormValues>();
  const closed = watch(`exceptions.${index}.closed`);
  if (closed) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 120 }}>
        {t('staffHours.closed')}
      </Typography>
    );
  }
  return (
    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
      <Field.Text
        name={`exceptions.${index}.open`}
        label={t('staffHours.open')}
        type="time"
        size="small"
        slotProps={{
          input: { inputProps: { step: 300 } },
          inputLabel: { shrink: true },
        }}
        sx={{ minWidth: 120 }}
      />
      <Field.Text
        name={`exceptions.${index}.close`}
        label={t('staffHours.close')}
        type="time"
        size="small"
        slotProps={{
          input: { inputProps: { step: 300 } },
          inputLabel: { shrink: true },
        }}
        sx={{ minWidth: 120 }}
      />
    </Stack>
  );
}
