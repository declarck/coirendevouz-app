import type { PaginatedResults } from 'src/types/business';
import type { Staff, StaffWritePayload } from 'src/types/staff';

import axios from 'src/lib/axios';

// ----------------------------------------------------------------------

function staffListUrl(businessId: number) {
  return `businesses/${businessId}/staff/`;
}

function staffDetailUrl(businessId: number, staffId: number) {
  return `businesses/${businessId}/staff/${staffId}/`;
}

function staffServicesAssignmentUrl(businessId: number, staffId: number) {
  return `businesses/${businessId}/staff/${staffId}/services/`;
}

/** Tüm sayfaları çeker (`next` bitene kadar). */
export async function fetchAllStaff(businessId: number): Promise<Staff[]> {
  const all: Staff[] = [];
  let page = 1;

  for (;;) {
    const res = await axios.get<PaginatedResults<Staff>>(staffListUrl(businessId), {
      params: { page },
    });
    const batch = res.data.results ?? [];
    all.push(...batch);
    if (!res.data.next) {
      break;
    }
    page += 1;
  }

  return all;
}

export async function fetchStaff(businessId: number, staffId: number): Promise<Staff> {
  const res = await axios.get<Staff>(staffDetailUrl(businessId, staffId));
  return res.data;
}

export async function createStaff(businessId: number, payload: StaffWritePayload): Promise<Staff> {
  const res = await axios.post<Staff>(staffListUrl(businessId), buildWriteBody(payload));
  return res.data;
}

export async function updateStaff(
  businessId: number,
  staffId: number,
  payload: Partial<StaffWritePayload>
): Promise<Staff> {
  const res = await axios.patch<Staff>(staffDetailUrl(businessId, staffId), buildWriteBody(payload));
  return res.data;
}

export async function deactivateStaff(businessId: number, staffId: number): Promise<void> {
  await axios.delete(staffDetailUrl(businessId, staffId));
}

/** `PUT .../staff/{id}/services/` — `service_ids` tam küme. */
export async function putStaffServices(
  businessId: number,
  staffId: number,
  serviceIds: number[]
): Promise<Staff> {
  const res = await axios.put<Staff>(staffServicesAssignmentUrl(businessId, staffId), {
    service_ids: serviceIds,
  });
  return res.data;
}

function buildWriteBody(payload: Partial<StaffWritePayload>): Record<string, unknown> {
  const body: Record<string, unknown> = {};

  if (payload.display_name !== undefined) {
    body.display_name = payload.display_name;
  }
  if (payload.working_hours !== undefined) {
    body.working_hours = payload.working_hours;
  }
  if (payload.working_hours_exceptions !== undefined) {
    body.working_hours_exceptions = payload.working_hours_exceptions;
  }
  if (payload.is_active !== undefined) {
    body.is_active = payload.is_active;
  }
  if (payload.user !== undefined) {
    body.user = payload.user;
  }

  return body;
}
