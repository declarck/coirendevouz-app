import type { AvailableSlotsResponse } from 'src/types/available-slots';

import axios from 'src/lib/axios';

// ----------------------------------------------------------------------

export type AvailableSlotsQuery = {
  staff_id: number;
  service_id: number;
  date: string;
  slot_minutes?: number;
};

export async function fetchAvailableSlots(params: AvailableSlotsQuery): Promise<AvailableSlotsResponse> {
  const res = await axios.get<AvailableSlotsResponse>('appointments/available-slots/', {
    params: {
      staff_id: params.staff_id,
      service_id: params.service_id,
      date: params.date,
      ...(params.slot_minutes != null ? { slot_minutes: params.slot_minutes } : {}),
    },
  });
  return res.data;
}
