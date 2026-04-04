import type { TFunction } from 'i18next';

import { z as zod } from 'zod';

// ----------------------------------------------------------------------

export type ServiceFormValues = {
  name: string;
  duration_minutes: number;
  price: number;
  is_active: boolean;
};

export function createServiceFormSchema(t: TFunction<'coirendevouz'>) {
  return zod.object({
    name: zod.string().min(1, t('forms.service.nameRequired')).max(255),
    duration_minutes: zod.coerce.number().int().min(1, t('forms.service.durationMin')),
    price: zod.coerce.number().min(0, t('forms.service.priceMin')),
    is_active: zod.boolean(),
  });
}
