import type { ScheduleResponse } from 'src/types/schedule';

import axios from 'src/lib/axios';

// ----------------------------------------------------------------------

export type ScheduleQuery = {
  from: string;
  to: string;
  status?: string;
  /** Boş veya yok: tüm personel; bir veya daha fazla id: yalnızca bu personel(ler) */
  staffIds?: number[];
};

export async function fetchSchedule(
  businessId: number,
  params: ScheduleQuery
): Promise<ScheduleResponse> {
  const search = new URLSearchParams();
  search.set('from', params.from);
  search.set('to', params.to);
  if (params.status) {
    search.set('status', params.status);
  }
  if (params.staffIds?.length) {
    for (const id of params.staffIds) {
      search.append('staff_id', String(id));
    }
  }
  const qs = search.toString();
  const res = await axios.get<ScheduleResponse>(`businesses/${businessId}/schedule/?${qs}`);
  return res.data;
}
