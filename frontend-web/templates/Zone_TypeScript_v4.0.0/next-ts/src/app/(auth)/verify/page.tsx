import { CONFIG } from 'src/global-config';

import { VerifyView } from 'src/sections/auth/verify-view';

// ----------------------------------------------------------------------

export const metadata = { title: `Verify - ${CONFIG.appName}` };

export default function Page() {
  return <VerifyView />;
}
