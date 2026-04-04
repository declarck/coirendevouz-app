import { CONFIG } from 'src/global-config';

import { NotFoundView } from 'src/sections/error/not-found-view';

// ----------------------------------------------------------------------

export const metadata = { title: `404 page not found! | Error - ${CONFIG.appName}` };

export default function Page() {
  return <NotFoundView />;
}
