export type AvailableSlotItem = {
  starts_at: string;
  ends_at: string;
};

export type AvailableSlotsResponse = {
  staff_id: number;
  service_id: number;
  date: string;
  slot_minutes: number;
  slots: AvailableSlotItem[];
};
