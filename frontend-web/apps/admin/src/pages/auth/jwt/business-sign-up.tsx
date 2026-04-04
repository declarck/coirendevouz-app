import { CONFIG } from 'src/global-config';

import { JwtBusinessSignUpView } from 'src/auth/view/jwt';

// ----------------------------------------------------------------------

const metadata = { title: `İşletme kaydı | ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>
      <JwtBusinessSignUpView />
    </>
  );
}
