import { z } from 'zod';

// ----------------------------------------------------------------------

export const APPOINTMENT_STATUS_VALUES = [
  'pending',
  'confirmed',
  'completed',
  'cancelled',
  'no_show',
] as const;

export const AppointmentDetailFormSchema = z.object({
  status: z.enum(APPOINTMENT_STATUS_VALUES),
  internal_note: z.string().optional(),
});

export type AppointmentDetailFormValues = z.infer<typeof AppointmentDetailFormSchema>;
