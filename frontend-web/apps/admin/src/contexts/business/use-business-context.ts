import { use } from 'react';

import { BusinessContext } from './business-context';

// ----------------------------------------------------------------------

export function useBusinessContext() {
  const ctx = use(BusinessContext);
  if (!ctx) {
    throw new Error('useBusinessContext: BusinessProvider eksik.');
  }
  return ctx;
}
