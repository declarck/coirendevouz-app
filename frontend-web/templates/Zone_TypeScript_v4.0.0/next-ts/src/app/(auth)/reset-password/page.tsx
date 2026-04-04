import { CONFIG } from 'src/global-config';

import { ResetPasswordView } from 'src/sections/auth/reset-password-view';

// ----------------------------------------------------------------------

export const metadata = { title: `Reset password - ${CONFIG.appName}` };

export default function Page() {
  return <ResetPasswordView />;
}
