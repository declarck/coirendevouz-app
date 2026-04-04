import { CONFIG } from 'src/global-config';

import { Error500View } from 'src/sections/error/500-view';

// ----------------------------------------------------------------------

export const metadata = { title: `500 Internal server error! | Error - ${CONFIG.appName}` };

export default function Page500() {
  return <Error500View />;
}
