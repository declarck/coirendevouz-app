import type { TFunction } from 'i18next';

// ----------------------------------------------------------------------

export const STAFF_WEEKDAY_ORDER = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;

export type StaffWeekdayKey = (typeof STAFF_WEEKDAY_ORDER)[number];

export type StaffWeeklyFormState = Record<
  StaffWeekdayKey,
  { closed: boolean; open: string; close: string }
>;

export type StaffExceptionFormRow = {
  date: string;
  closed: boolean;
  open: string;
  close: string;
};

export function staffWeekdayLabel(day: StaffWeekdayKey, t: TFunction<'coirendevouz'>): string {
  return t(`weekdays.${day}`);
}

export function defaultWeeklyFormState(): StaffWeeklyFormState {
  const row = { closed: false, open: '09:00', close: '18:00' };
  return {
    monday: { ...row },
    tuesday: { ...row },
    wednesday: { ...row },
    thursday: { ...row },
    friday: { ...row },
    saturday: { ...row },
    sunday: { closed: true, open: '09:00', close: '18:00' },
  };
}

function dayRecordFromApi(day: unknown): { closed: boolean; open: string; close: string } {
  if (!day || typeof day !== 'object') {
    return { closed: false, open: '09:00', close: '18:00' };
  }
  const d = day as Record<string, unknown>;
  if (d.closed === true) {
    return { closed: true, open: '09:00', close: '18:00' };
  }
  const open = typeof d.open === 'string' ? d.open : '09:00';
  const close = typeof d.close === 'string' ? d.close : '18:00';
  return { closed: false, open, close };
}

export function weeklyFormStateFromWorkingHours(
  raw: Record<string, unknown> | null | undefined
): StaffWeeklyFormState {
  const base = defaultWeeklyFormState();
  if (!raw || typeof raw !== 'object') {
    return base;
  }
  const next = { ...base };
  for (const key of STAFF_WEEKDAY_ORDER) {
    next[key] = dayRecordFromApi(raw[key]);
  }
  return next;
}

export function buildWorkingHoursPayload(
  weekly: StaffWeeklyFormState
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of STAFF_WEEKDAY_ORDER) {
    const row = weekly[key];
    if (row.closed) {
      out[key] = { closed: true };
    } else {
      out[key] = {
        open: row.open,
        close: row.close,
        closed: false,
        breaks: [],
      };
    }
  }
  return out;
}

export function exceptionRowsFromApi(raw: unknown): StaffExceptionFormRow[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  const rows: StaffExceptionFormRow[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') {
      continue;
    }
    const o = item as Record<string, unknown>;
    const date = typeof o.date === 'string' ? o.date : '';
    if (!date) {
      continue;
    }
    if (o.closed === true) {
      rows.push({ date, closed: true, open: '09:00', close: '18:00' });
    } else {
      rows.push({
        date,
        closed: false,
        open: typeof o.open === 'string' ? o.open : '09:00',
        close: typeof o.close === 'string' ? o.close : '18:00',
      });
    }
  }
  return rows;
}

export function buildWorkingHoursExceptionsPayload(
  rows: StaffExceptionFormRow[]
): Array<Record<string, unknown>> {
  const out: Array<Record<string, unknown>> = [];
  for (const row of rows) {
    const d = row.date.trim();
    if (!d) {
      continue;
    }
    if (row.closed) {
      out.push({ date: d, closed: true });
    } else {
      out.push({
        date: d,
        open: row.open,
        close: row.close,
        closed: false,
        breaks: [],
      });
    }
  }
  return out;
}
