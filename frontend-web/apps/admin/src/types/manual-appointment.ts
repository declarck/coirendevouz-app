export type ManualAppointmentPayload = {
  staff_id: number;
  service_id: number;
  starts_at: string;
  customer_user_id: number;
  internal_note?: string;
};

export type ManualAppointmentResponse = {
  id: number;
  business_id: number;
  staff_id: number;
  service_id: number;
  starts_at: string;
  ends_at: string;
  status: string;
  source: string;
  internal_note: string;
};
