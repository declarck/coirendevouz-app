import { CONFIG } from 'src/global-config';

import { SignInSplitView } from 'src/sections/auth/sign-in-split-view';

// ----------------------------------------------------------------------

export const metadata = { title: `Sign in | Layout split - ${CONFIG.appName}` };

export default function Page() {
  return <SignInSplitView />;
}
