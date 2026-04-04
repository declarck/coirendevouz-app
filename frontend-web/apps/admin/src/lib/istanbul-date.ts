import 'dayjs/locale/tr';
import 'dayjs/locale/en';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

const TZ = 'Europe/Istanbul';

/** Bugünün tarihi (İstanbul takvim günü, `YYYY-MM-DD`). */
export function getIstanbulToday(): string {
  return dayjs().tz(TZ).format('YYYY-MM-DD');
}

/** İstanbul takvimine göre `days` gün ekler/çıkarır. */
export function addDaysIstanbul(isoDate: string, days: number): string {
  return dayjs.tz(`${isoDate}T12:00:00`, TZ).add(days, 'day').format('YYYY-MM-DD');
}

/**
 * Verilen günü içeren haftanın Pazartesi–Pazar aralığı (ISO haftası, Pazartesi başlangıç).
 * `from` ve `to` dahil.
 */
export function getMondayToSundayRangeContaining(isoDate: string): { from: string; to: string } {
  const d = dayjs.tz(`${isoDate}T12:00:00`, TZ);
  const mondayOffset = (d.day() + 6) % 7;
  const monday = d.subtract(mondayOffset, 'day');
  const sunday = monday.add(6, 'day');
  return { from: monday.format('YYYY-MM-DD'), to: sunday.format('YYYY-MM-DD') };
}

/** Tek gün veya haftalık aralık başlığı (`locale`: dayjs locale kodu, örn. `tr` / `en`). */
export function formatScheduleRangeTitle(
  from: string,
  to: string,
  mode: 'day' | 'week',
  locale: string = 'tr'
): string {
  if (mode === 'day' || from === to) {
    return dayjs.tz(`${from}T12:00:00`, TZ).locale(locale).format('D MMMM YYYY dddd');
  }
  const a = dayjs.tz(`${from}T12:00:00`, TZ).locale(locale);
  const b = dayjs.tz(`${to}T12:00:00`, TZ).locale(locale);
  return `${a.format('D MMM')} – ${b.format('D MMM YYYY')}`;
}

/** `YYYY-MM-DD` + `HH:mm` (İstanbul) → ISO 8601 UTC (`starts_at` için). */
export function combineIstanbulDateAndTimeToIso(dateYmd: string, timeHm: string): string {
  return dayjs.tz(`${dateYmd}T${timeHm}:00`, TZ).toISOString();
}

/** ISO anını İstanbul saat diliminde `HH:mm` olarak gösterir (slot etiketi vb.). */
export function formatIstanbulTimeFromIso(iso: string): string {
  return dayjs(iso).tz(TZ).format('HH:mm');
}
