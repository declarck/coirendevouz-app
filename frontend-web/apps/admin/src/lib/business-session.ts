const SELECTED_BUSINESS_KEY = 'coirendevouz_selected_business_id';

export function getStoredBusinessId(): number | null {
  const raw = sessionStorage.getItem(SELECTED_BUSINESS_KEY);
  if (raw == null || raw === '') {
    return null;
  }
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export function setStoredBusinessId(id: number | null): void {
  if (id == null) {
    sessionStorage.removeItem(SELECTED_BUSINESS_KEY);
  } else {
    sessionStorage.setItem(SELECTED_BUSINESS_KEY, String(id));
  }
}
