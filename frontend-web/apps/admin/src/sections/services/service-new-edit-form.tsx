import type { Service } from 'src/types/service';

import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import LoadingButton from '@mui/lab/LoadingButton';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useTranslate } from 'src/locales';

import { Form, Field } from 'src/components/hook-form';

import { type ServiceFormValues, createServiceFormSchema } from './service-form-schema';

// ----------------------------------------------------------------------

function priceToNumber(price: string | number): number {
  if (typeof price === 'number') {
    return price;
  }
  const n = parseFloat(price);
  return Number.isFinite(n) ? n : 0;
}

type Props = {
  current?: Service;
  onSubmit: (data: ServiceFormValues) => Promise<void>;
  submitLabel?: string;
};

export function ServiceNewEditForm({ current, onSubmit, submitLabel }: Props) {
  const { t } = useTranslate('coirendevouz');

  const schema = useMemo(() => createServiceFormSchema(t), [t]);

  const methods = useForm<ServiceFormValues>({
    resolver: zodResolver(schema),
    defaultValues: current
      ? {
          name: current.name,
          duration_minutes: current.duration_minutes,
          price: priceToNumber(current.price),
          is_active: current.is_active,
        }
      : {
          name: '',
          duration_minutes: 30,
          price: 0,
          is_active: true,
        },
  });

  const saveLabel = submitLabel ?? t('common.save');

  return (
    <Form methods={methods} onSubmit={methods.handleSubmit(onSubmit)}>
      <Card sx={{ p: 3 }}>
        <Stack spacing={3} maxWidth={480}>
          <Field.Text name="name" label={t('services.formName')} />

          <Field.Text
            name="duration_minutes"
            label={t('services.formDuration')}
            type="number"
            slotProps={{ htmlInput: { min: 1 } }}
          />

          <Field.Text
            name="price"
            label={t('services.formPrice')}
            type="number"
            slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
          />

          {current ? <Field.Switch name="is_active" label={t('services.formActive')} /> : null}

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <LoadingButton
              type="submit"
              variant="contained"
              loading={methods.formState.isSubmitting}
            >
              {saveLabel}
            </LoadingButton>
            <Button component={RouterLink} href={paths.dashboard.coirendevouz.services} variant="outlined">
              {t('common.cancel')}
            </Button>
          </Box>
        </Stack>
      </Card>
    </Form>
  );
}
