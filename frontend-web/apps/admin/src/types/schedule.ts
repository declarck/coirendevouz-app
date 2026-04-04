export type ScheduleAppointment = {
  id: number;
  starts_at: string;
  ends_at: string;
  status: string;
  service: { id: number; name: string };
  staff: { id: number; display_name: string };
  customer: { id: number; full_name: string; phone: string };
};

export type ScheduleResponse = {
  business_id: number;
  appointments: ScheduleAppointment[];
};
