import { CONFIG } from 'src/global-config';

import { AccountPersonalView } from 'src/sections/_account/view/account-personal-view';

// ----------------------------------------------------------------------

export const metadata = { title: `Personal | Account - ${CONFIG.appName}` };

export default function Page() {
  return <AccountPersonalView />;
}
