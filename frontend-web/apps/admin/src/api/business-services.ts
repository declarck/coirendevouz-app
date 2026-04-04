import type { PaginatedResults } from 'src/types/business';
import type { Service, ServiceWritePayload } from 'src/types/service';

import axios from 'src/lib/axios';

// ----------------------------------------------------------------------

function servicesListUrl(businessId: number) {
  return `businesses/${businessId}/services/`;
}

function serviceDetailUrl(businessId: number, serviceId: number) {
  return `businesses/${businessId}/services/${serviceId}/`;
}

/** Tüm sayfaları çeker (`next` bitene kadar). */
export async function fetchAllServices(businessId: number): Promise<Service[]> {
  const all: Service[] = [];
  let page = 1;

  for (;;) {
    const res = await axios.get<PaginatedResults<Service>>(servicesListUrl(businessId), {
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

export async function fetchService(businessId: number, serviceId: number): Promise<Service> {
  const res = await axios.get<Service>(serviceDetailUrl(businessId, serviceId));
  return res.data;
}

export async function createService(
  businessId: number,
  payload: ServiceWritePayload
): Promise<Service> {
  const res = await axios.post<Service>(servicesListUrl(businessId), payload);
  return res.data;
}

export async function updateService(
  businessId: number,
  serviceId: number,
  payload: Partial<ServiceWritePayload>
): Promise<Service> {
  const res = await axios.patch<Service>(serviceDetailUrl(businessId, serviceId), payload);
  return res.data;
}

export async function deactivateService(businessId: number, serviceId: number): Promise<void> {
  await axios.delete(serviceDetailUrl(businessId, serviceId));
}
