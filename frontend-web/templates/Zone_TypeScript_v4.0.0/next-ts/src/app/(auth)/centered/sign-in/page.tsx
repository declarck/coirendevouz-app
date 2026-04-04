import { CONFIG } from 'src/global-config';

import { SignInCenteredView } from 'src/sections/auth/sign-in-centered-view';

// ----------------------------------------------------------------------

export const metadata = { title: `Sign in | Layout centered - ${CONFIG.appName}` };

export default function Page() {
  return <SignInCenteredView />;
}
