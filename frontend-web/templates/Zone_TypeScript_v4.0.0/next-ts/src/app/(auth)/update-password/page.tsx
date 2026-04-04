import { CONFIG } from 'src/global-config';

import { UpdatePasswordView } from 'src/sections/auth/update-password-view';

// ----------------------------------------------------------------------

export const metadata = { title: `Update password - ${CONFIG.appName}` };

export default function Page() {
  return <UpdatePasswordView />;
}
