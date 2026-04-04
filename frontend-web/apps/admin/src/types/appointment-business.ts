/** `GET/PATCH .../appointments/{id}/` — işletme yanıtı (`AppointmentBusinessReadSerializer`). */
export type AppointmentBusinessRead = {
  id: number;
  business_id: number;
  business_name: string;
  staff_id: number;
  staff_display_name: string;
  service_id: number;
  service_name: string;
  customer_full_name: string;
  customer_phone: string;
  starts_at: string;
  ends_at: string;
  status: string;
  source: string;
  customer_note: string;
  internal_note: string;
  created_at: string;
};
