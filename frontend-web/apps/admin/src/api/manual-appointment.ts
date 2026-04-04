import type { ManualAppointmentPayload, ManualAppointmentResponse } from 'src/types/manual-appointment';

import axios from 'src/lib/axios';

// ----------------------------------------------------------------------

export async function createManualAppointment(
  businessId: number,
  payload: ManualAppointmentPayload
): Promise<ManualAppointmentResponse> {
  const res = await axios.post<ManualAppointmentResponse>(
    `businesses/${businessId}/appointments/manual/`,
    {
      staff_id: payload.staff_id,
      service_id: payload.service_id,
      starts_at: payload.starts_at,
      customer_user_id: payload.customer_user_id,
      internal_note: payload.internal_note ?? '',
    }
  );
  return res.data;
}
