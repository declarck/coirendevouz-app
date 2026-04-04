import type { AppointmentBusinessRead } from 'src/types/appointment-business';

import axios from 'src/lib/axios';

// ----------------------------------------------------------------------

export type AppointmentBusinessPatchPayload = {
  status?: string;
  internal_note?: string;
};

export async function fetchAppointmentBusiness(appointmentId: number): Promise<AppointmentBusinessRead> {
  const res = await axios.get<AppointmentBusinessRead>(`appointments/${appointmentId}/`);
  return res.data;
}

export async function patchAppointmentBusiness(
  appointmentId: number,
  payload: AppointmentBusinessPatchPayload
): Promise<AppointmentBusinessRead> {
  const res = await axios.patch<AppointmentBusinessRead>(`appointments/${appointmentId}/`, payload);
  return res.data;
}
