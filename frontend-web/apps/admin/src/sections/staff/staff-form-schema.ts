import type { TFunction } from 'i18next';
import type { StaffWeeklyFormState, StaffExceptionFormRow } from './staff-working-hours-utils';

import { z as zod } from 'zod';

// ----------------------------------------------------------------------

const timeRe = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

export type { StaffWeeklyFormState, StaffExceptionFormRow };

export type StaffFormValues = {
  display_name: string;
  user_id: string;
  is_active: boolean;
  /** true: işletme haftalık şablonu; false: aşağıdaki haftalık JSON */
  hours_inherit: boolean;
  weekly: StaffWeeklyFormState;
  exceptions: StaffExceptionFormRow[];
};

export function createStaffFormSchema(t: TFunction<'coirendevouz'>) {
  const dayRowSchema = zod.object({
    closed: zod.boolean(),
    open: zod.string().regex(timeRe, t('forms.staff.timeFormatError')),
    close: zod.string().regex(timeRe, t('forms.staff.timeFormatError')),
  });

  const weeklySchema = zod.object({
    monday: dayRowSchema,
    tuesday: dayRowSchema,
    wednesday: dayRowSchema,
    thursday: dayRowSchema,
    friday: dayRowSchema,
    saturday: dayRowSchema,
    sunday: dayRowSchema,
  });

  const exceptionRowSchema = zod.object({
    date: zod.string(),
    closed: zod.boolean(),
    open: zod.string(),
    close: zod.string(),
  });

  return zod
    .object({
      display_name: zod.string().min(1, t('forms.staff.displayNameRequired')).max(255),
      user_id: zod.string(),
      is_active: zod.boolean(),
      hours_inherit: zod.boolean(),
      weekly: weeklySchema,
      exceptions: zod.array(exceptionRowSchema),
    })
    .superRefine((data, ctx) => {
      if (data.hours_inherit) {
        return;
      }
      for (const key of [
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
        'sunday',
      ] as const) {
        const row = data.weekly[key];
        if (!row.closed) {
          const [oh, om] = row.open.split(':').map(Number);
          const [ch, cm] = row.close.split(':').map(Number);
          const o = oh * 60 + om;
          const c = ch * 60 + cm;
          if (o >= c) {
            ctx.addIssue({
              code: zod.ZodIssueCode.custom,
              message: t('forms.staff.openBeforeClose'),
              path: ['weekly', key, 'open'],
            });
          }
        }
      }
      for (let i = 0; i < data.exceptions.length; i += 1) {
        const ex = data.exceptions[i];
        if (!ex.date || !/^\d{4}-\d{2}-\d{2}$/.test(ex.date)) {
          ctx.addIssue({
            code: zod.ZodIssueCode.custom,
            message: t('forms.staff.exceptionDateFormat'),
            path: ['exceptions', i, 'date'],
          });
        }
        if (!ex.closed) {
          if (!timeRe.test(ex.open) || !timeRe.test(ex.close)) {
            ctx.addIssue({
              code: zod.ZodIssueCode.custom,
              message: t('forms.staff.exceptionTimeFormat'),
              path: ['exceptions', i, 'open'],
            });
          } else {
            const [oh, om] = ex.open.split(':').map(Number);
            const [ch, cm] = ex.close.split(':').map(Number);
            const o = oh * 60 + om;
            const c = ch * 60 + cm;
            if (o >= c) {
              ctx.addIssue({
                code: zod.ZodIssueCode.custom,
                message: t('forms.staff.openBeforeClose'),
                path: ['exceptions', i, 'open'],
              });
            }
          }
        }
      }
    });
}
