import type { TFunction } from 'i18next';

import { z } from 'zod';

// ----------------------------------------------------------------------

export function createManualAppointmentFormSchema(t: TFunction<'coirendevouz'>) {
  return z.object({
    staff_id: z.string().min(1, t('forms.manualAppointment.staffRequired')),
    service_id: z.string().min(1, t('forms.manualAppointment.serviceRequired')),
    appointment_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, t('forms.manualAppointment.dateInvalid')),
    appointment_time: z
      .string()
      .regex(/^\d{2}:\d{2}$/, t('forms.manualAppointment.timeFormat')),
    customer_user_id: z
      .string()
      .min(1, t('forms.manualAppointment.customerIdRequired'))
      .refine((s) => {
        const n = Number(s);
        return Number.isInteger(n) && n >= 1;
      }, t('forms.manualAppointment.positiveInt')),
    internal_note: z.string().optional(),
  });
}

export type ManualAppointmentFormValues = z.infer<
  ReturnType<typeof createManualAppointmentFormSchema>
>;

export function defaultManualAppointmentFormValues(): ManualAppointmentFormValues {
  return {
    staff_id: '',
    service_id: '',
    appointment_date: '',
    appointment_time: '09:00',
    customer_user_id: '',
    internal_note: '',
  };
}
